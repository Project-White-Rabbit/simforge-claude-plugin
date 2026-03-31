---
description: Set up Bitfab tracing — authenticate, instrument, and create replay scripts
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Edit", "Write", "AskUserQuestion"]
argument-hint: [all|login|instrument|replay]
---

# Bitfab Setup

**Important: Always use the `AskUserQuestion` tool when asking the user questions or presenting choices.** Never just print a question as text and wait — use the tool so the user gets a real interactive prompt. This keeps the flow moving and prevents the skill from stalling.

This skill handles Bitfab onboarding in three phases: **login**, **instrument**, and **replay**. Run them individually or all at once.

| Invocation | Action |
|---|---|
| `/bitfab:setup` or `/bitfab:setup all` | Run full setup (login → instrument → replay) |
| `/bitfab:setup login` | Authenticate and retrieve API key |
| `/bitfab:setup instrument` | Instrument AI workflows with Bitfab tracing |
| `/bitfab:setup replay` | Create or update replay scripts for instrumented workflows |

---

## Login

Authenticate with Bitfab and retrieve the API key.

### Step 1: Check Authentication

Run the status check:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/status.js"
```

If the output says **"not authenticated"**, you MUST run the login script yourself — do NOT ask the user to run it manually:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/login.js"
```

This script opens the user's browser for OAuth authentication and waits for the callback. It will exit automatically once the user completes login in the browser (up to 2 minutes). Run it with a 150000ms timeout.

After successful login, confirm to the user and continue.

### Step 2: Verify the API Key Exists

Check that credentials were saved — **NEVER print or log the API key**:

```bash
node -e "const fs = require('fs'), os = require('os'), p = require('path').join(os.homedir(), '.config', 'bitfab', 'credentials.json'); try { const k = JSON.parse(fs.readFileSync(p, 'utf-8')).apiKey; console.log(k ? 'API key found (' + k.slice(0,6) + '...)' : 'No API key') } catch { console.error('No credentials found') }"
```

The API key is stored at `~/.config/bitfab/credentials.json` and read automatically by the SDK via the `BITFAB_API_KEY` environment variable.

**If running `login` only**, stop here and report the result.

---

## Instrument

Instrument the codebase with Bitfab tracing. Requires authentication (run `login` first if not authenticated).

### Step 1: Check Existing Instrumentation

Before instrumenting, check whether Bitfab is already set up in this codebase.

1. **Detect the project language** (TypeScript, Python, Ruby, or Go)
2. **Search for existing SDK usage:**
   - TypeScript: `grep -r "from \"@goharvest/bitfab\"" --include="*.ts" --include="*.tsx"` or `withSpan` / `getFunction` calls
   - Python: `grep -r "from bitfab import" --include="*.py"` or `@span` / `get_function` calls
   - Ruby: `grep -r "bitfab_span\|Bitfab::Traceable" --include="*.rb"` or `bitfab_function` calls
   - Go: `grep -r "bitfab-go" --include="*.go"` or `client.Span` / `client.Start` calls
3. **If instrumentation already exists:**
   - List the trace function keys and instrumented functions you found
   - List the trace function keys you found, then use the `AskUserQuestion` tool to ask:
     - question: "Found instrumentation for: [list]. Want to search for more workflows?"
     - header: "Instrument"
     - options: "Search for more" (find uninstrumented AI workflows) / "Continue" (skip to replay setup)
   - If "Search for more", search the codebase for all LLM calls, agent runs, and AI-driven decisions, compare against what's already traced, and present any uninstrumented workflows
   - If "Continue", move on
4. **If no instrumentation exists**, proceed to the full instrumentation prompt below.

### Step 2: Instrument the Codebase

Follow the instrumentation prompt below. This is the same flow used by the Bitfab setup page.

For detailed SDK documentation, refer to:
- **TypeScript SDK**: https://docs.bitfab.ai/typescript-sdk
- **Python SDK**: https://docs.bitfab.ai/python-sdk
- **Ruby SDK**: https://docs.bitfab.ai/ruby-sdk
- **Go SDK**: https://docs.bitfab.ai/go-sdk
- **Full documentation**: https://docs.bitfab.ai/introduction

### Instrumentation Prompt

Bitfab captures every AI function call — inputs, outputs, and errors — so you can see exactly what your AI is doing and discover what's going wrong. The goal is to have enough context in each trace to tell whether a call succeeded or failed, and why.

Instrument this codebase with Bitfab tracing:

1. Use the API key from the Login phase (or retrieve it now if already authenticated).
2. Install the SDK (if not already installed) and set the BITFAB_API_KEY environment variable
3. Read the SDK documentation for the detected language (linked above). Read it carefully.
4. Read the codebase to understand the architecture and identify ALL AI workflows — every place the app makes LLM calls, runs agents, or makes AI-driven decisions
5. Present the user with a numbered list of workflows you found, ordered by value (most complex or most LLM-heavy first). For each, give the function name, a brief description, and why tracing it is valuable. Recommend one to start with and explain why. Ask which to instrument: a number, multiple numbers, or "all".
6. For each workflow the user selects, present your instrumentation plan as a tree diagram and wait for confirmation before writing code. Format:

```
Trace function: "<trace-function-key>"
  ├── outerFunction              [function]   ← enclosing workflow
  │   ├── llmCall                [llm]        ← LLM call
  │   ├── toolCall               [function]   ← tool/retrieval call
  │   └── anotherLlmCall         [llm]        ← LLM call
  Example input/output: <realistic example of what this trace would capture>
  Extra context: <runtime details you'll add — model, confidence, token counts, etc.>
  Not instrumented (and why): <functions you're skipping and why>
```

  When using a trace processor (e.g., OpenAI Agents SDK), show the plan like this instead:

```
Trace function: "my-agent"
  ├── runAgent                       [function]   ← withSpan outer wrapper around run()
  │   └── (captured by trace processor automatically)
  │       ├── LLM calls              [auto]
  │       ├── tool calls             [auto]
  │       └── handoffs               [auto]
  Setup: addTraceProcessor(processor) registered at startup
```

  Do NOT show individual tool/LLM functions as manual spans when using a trace processor — they are captured automatically.

7. Instrument the code following the SDK documentation exactly. Do NOT modify the original function's logic in any way — instrumentation is purely additive. Never change behavior, arguments, return values, error handling, variable names, types, control flow, or code structure. The only changes should be adding tracing calls around existing code.
8. Tell the user how to run the app to generate the first trace — give them the exact command(s). Do NOT run the app yourself.
9. Show a tree diagram of what you instrumented (same format as step 6), explain what visibility each trace gives you, and ask: "Want me to instrument another workflow, or all remaining workflows?" — then repeat steps 5–9.

**If running `instrument` only**, stop here after instrumentation is complete.

---

## Replay

Create or update replay scripts for instrumented trace functions. Requires instrumentation to be present in the codebase.

Replay scripts let the team regression-test any trace function against production data with one command — they use `bitfab.replay()` / `client.replay()` to fetch historical traces, re-run them through the current code, and report old vs. new outputs side-by-side.

For replay API details, refer to the SDK documentation for the detected language (linked in the Instrument section).

### Step 1: Gather all trace function keys

First, find every trace function key in the codebase by searching for the SDK's trace function key patterns (e.g., `getFunction("key")`, `get_function("key")`, `bitfab_function "key"`, `WithFunctionName("key")`). Build a complete list — this is the source of truth for what replay must cover.

### Step 2: Search for existing replay scripts

- Look for files matching `scripts/replay.*`, `scripts/*replay*`, or any file that imports `bitfab.replay` / `client.replay`

### Step 3: If replay scripts exist

- Read them and extract the trace function keys / pipelines they cover
- **Compare against the complete list of trace function keys from Step 1**
- If any keys are missing, use `AskUserQuestion`:
  - question: "Replay scripts cover [X, Y] but are missing [Z]. Want me to add them?"
  - header: "Replay"
  - options: "Add missing" (create replay scripts for uncovered keys) / "Skip" (leave as-is)
- If all keys are covered: report that replay scripts are up to date

### Step 4: If no replay script exists

- Use `AskUserQuestion`:
  - question: "No replay scripts found. Want me to create one? It lets you regression-test any trace function against production data with one command."
  - header: "Replay"
  - options: "Create replay script" (create a new replay script) / "Skip" (no replay script)
- If "Create replay script", create the script. The script should:
  - Accept a pipeline name as a CLI argument
  - Accept optional `--limit N` (default 10) and `--trace-ids id1,id2` flags
  - Map pipeline names to trace function keys and their replay functions
  - Use a per-pipeline replay function for each trace function (important because replay deserializes historical inputs — if the function signature doesn't match the raw input shape, the wrapper reshapes arguments)
  - Call `bitfab.replay()` / `client.replay()` and print results with delta summaries (original count → new count)
  - Print a summary (total replayed, same, changed, errors) and the test run URL
  - Live in a `scripts/` directory (or the project's existing scripts location)

---

## Full Setup Flow

When running `/bitfab:setup` or `/bitfab:setup all`, execute all three phases in order:

1. **Login** — authenticate and get API key
2. **Instrument** — discover and instrument AI workflows
3. **Replay** — create or update replay scripts for all instrumented trace functions

After all three phases complete, give a summary of what was set up.
