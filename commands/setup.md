---
description: Set up Simforge tracing — authenticate and instrument your codebase
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Edit", "Write"]
---

# Simforge Setup

This skill handles the full Simforge onboarding: authentication and SDK instrumentation.

## Step 1: Check Authentication

Run the status check:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/status.js"
```

If the output says **"not authenticated"**, run the login script:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/login.js"
```

After successful login, confirm to the user and continue to Step 2.

## Step 2: Retrieve the API Key

Read the stored credentials to get the API key:

```bash
node -e "const fs = require('fs'), os = require('os'), p = require('path').join(os.homedir(), '.config', 'simforge', 'credentials.json'); try { console.log(JSON.parse(fs.readFileSync(p, 'utf-8')).apiKey) } catch { console.error('No credentials found') }"
```

Use this key for the `SIMFORGE_API_KEY` environment variable.

## Step 3: Instrument the Codebase

Follow the instrumentation prompt below. This is the same flow used by the Simforge setup page.

For detailed SDK documentation, refer to:
- **TypeScript SDK**: https://docs.simforge.goharvest.ai/typescript-sdk
- **Python SDK**: https://docs.simforge.goharvest.ai/python-sdk
- **Ruby SDK**: https://docs.simforge.goharvest.ai/ruby-sdk
- **Go SDK**: https://docs.simforge.goharvest.ai/go-sdk
- **Full documentation**: https://docs.simforge.goharvest.ai/introduction

---

## Instrumentation Prompt

Simforge captures every AI function call — inputs, outputs, and errors — so you can see exactly what your AI is doing and discover what's going wrong. The goal is to have enough context in each trace to tell whether a call succeeded or failed, and why.

Instrument this codebase with Simforge tracing:

1. Detect the project language (TypeScript, Python, Ruby, or Go)
2. Read the SDK documentation for that language (linked above). Read it carefully.
3. Use the API key from Step 2 above.
4. Install the SDK and set the SIMFORGE_API_KEY environment variable
5. Read the codebase to understand the architecture and identify ALL AI workflows — every place the app makes LLM calls, runs agents, or makes AI-driven decisions
6. Present the user with a numbered list of workflows you found, ordered by value (most complex or most LLM-heavy first). For each, give the function name, a brief description, and why tracing it is valuable. Recommend one to start with and explain why. Ask which to instrument: a number, multiple numbers, or "all".
7. For each workflow the user selects, present your instrumentation plan as a tree diagram and wait for confirmation before writing code. Format:

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

8. Instrument the code following the SDK documentation exactly. Do NOT modify the original function's logic in any way — instrumentation is purely additive. Never change behavior, arguments, return values, error handling, variable names, types, control flow, or code structure. The only changes should be adding tracing calls around existing code.
9. Tell the user how to run the app to generate the first trace — give them the exact command(s). Do NOT run the app yourself.
10. Show a tree diagram of what you instrumented (same format as step 7), explain what visibility each trace gives you, and ask: "Want me to instrument another workflow, or all remaining workflows?" — then repeat steps 7–10.
