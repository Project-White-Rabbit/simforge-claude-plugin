---
description: Update Simforge plugin to the latest version
allowed-tools: ["Bash"]
---

# Simforge Update

Run the update script to check for and apply the latest Simforge plugin version:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/update.js"
```

After the script completes, confirm the result to the user. If it updated successfully, remind them to restart Claude Code to apply the update.
