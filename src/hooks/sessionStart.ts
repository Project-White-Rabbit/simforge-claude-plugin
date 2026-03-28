import { hasCredentials } from "../config.js"
import { checkForUpdate } from "../updates.js"

const messages: string[] = []

try {
  if (!hasCredentials()) {
    messages.push(
      `[Simforge] Not authenticated. Run /simforge:setup to connect your account and instrument your codebase.`,
    )
  }
} catch {}

try {
  const { current, latest, updateAvailable, autoUpdateEnabled } =
    await checkForUpdate()
  if (updateAvailable && latest) {
    const lines = [`[Simforge] Update available: v${current} → v${latest}.`]
    if (autoUpdateEnabled) {
      lines.push(`          Auto-update is enabled — restart to apply.`)
    } else {
      lines.push(
        `          Run /simforge:update to update, or enable auto-update: /plugin → Marketplaces → simforge → Enable auto-update`,
      )
    }
    messages.push(lines.join("\n"))
  }
} catch {}

if (messages.length > 0) {
  process.stdout.write(JSON.stringify({ systemMessage: `\n${messages.join("\n")}` }))
}
