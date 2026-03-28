---
description: Log out of Simforge and remove MCP server configuration
allowed-tools: ["Bash"]
---

# Simforge Logout

Run the logout script to remove stored Simforge credentials and the MCP server configuration.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/logout.js"
```

After the script completes, confirm: "Logged out of Simforge. MCP tools will be unavailable until you run /simforge:login again."
