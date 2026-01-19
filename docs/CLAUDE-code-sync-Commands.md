# claude-code-sync Commands Reference

**GitHub:** [github.com/waynesutton/claude-code-sync](https://github.com/waynesutton/claude-code-sync) | **npm:** [npmjs.com/package/claude-code-sync](https://www.npmjs.com/package/claude-code-sync)

Complete reference for all claude-code-sync CLI commands, configuration options, and troubleshooting.

## Installation

### Install globally via npm

```bash
npm install -g claude-code-sync
```

### Verify installation

```bash
claude-code-sync --version
```

### Update to latest version

```bash
npm update -g claude-code-sync
```

### Uninstall

```bash
npm uninstall -g claude-code-sync
```

### Reinstall (clean)

```bash
npm uninstall -g claude-code-sync && npm install -g claude-code-sync
```

## Commands

### login

Configure your Convex URL and API Key.

```bash
claude-code-sync login
```

**Interactive prompts:**
- Convex URL: Your deployment URL (e.g., `https://your-project.convex.cloud`)
- API Key: Your API key from Settings (starts with `osk_`)

**What it does:**
1. Validates the Convex URL format
2. Validates the API key format
3. Tests the connection to your backend
4. Saves credentials to `~/.config/claude-code-sync/config.json`

### setup

Add hooks to Claude Code settings. This configures `~/.claude/settings.json` so Claude Code calls the plugin on session events.

```bash
claude-code-sync setup
```

**Options:**

| Flag | Description |
|------|-------------|
| `--force` | Overwrite existing hooks configuration |

**What it does:**
1. Creates `~/.claude` directory if needed
2. Reads existing `settings.json` if present
3. Adds the sync hooks configuration
4. Writes the updated settings

**One-liner alternative:**

If you prefer a single command to copy and paste:

```bash
mkdir -p ~/.claude && cat > ~/.claude/settings.json << 'EOF'
{
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "claude-code-sync hook SessionStart" }] }],
    "SessionEnd": [{ "hooks": [{ "type": "command", "command": "claude-code-sync hook SessionEnd" }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "claude-code-sync hook UserPromptSubmit" }] }],
    "PostToolUse": [{ "matcher": "*", "hooks": [{ "type": "command", "command": "claude-code-sync hook PostToolUse" }] }],
    "Stop": [{ "matcher": "*", "hooks": [{ "type": "command", "command": "claude-code-sync hook Stop" }] }]
  }
}
EOF
```

**Note:** The one-liner overwrites existing settings. Use `claude-code-sync setup` to merge with existing configuration.

### verify

Verify that both credentials and Claude Code configuration are set up correctly.

```bash
claude-code-sync verify
```

**Output example:**

```
  OpenSync Setup Verification

Credentials: OK
   Convex URL: https://your-project.convex.cloud
   API Key: osk_****...****

Claude Code Config: OK
   Config file: ~/.claude/settings.json
   Hooks registered: claude-code-sync

Testing connection...
Connection: OK

Ready! Start Claude Code and sessions will sync automatically.
```

**Checks performed:**
1. Credentials exist in `~/.config/claude-code-sync/config.json`
2. Hooks are configured in `~/.claude/settings.json`
3. Connection to Convex backend works

### logout

Clear stored credentials.

```bash
claude-code-sync logout
```

Removes the config file at `~/.config/claude-code-sync/config.json`.

### status

Show connection status and current configuration.

```bash
claude-code-sync status
```

**Output includes:**
- Convex URL
- API Key (masked)
- Auto sync status
- Tool calls sync status
- Thinking sync status
- Connection test result

### config

Display current configuration.

```bash
claude-code-sync config
```

**Options:**

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |

**Examples:**

```bash
# Human readable output
claude-code-sync config

# JSON output for scripting
claude-code-sync config --json
```

### set

Update a configuration value.

```bash
claude-code-sync set <key> <value>
```

**Available keys:**

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `autoSync` | boolean | `true` | Automatically sync sessions |
| `syncToolCalls` | boolean | `true` | Include tool call details |
| `syncThinking` | boolean | `false` | Include thinking traces |

**Valid values for booleans:** `true`, `false`, `1`, `0`, `yes`, `no`

**Examples:**

```bash
# Enable thinking sync
claude-code-sync set syncThinking true

# Disable tool call sync
claude-code-sync set syncToolCalls false

# Disable auto sync
claude-code-sync set autoSync false
```

### help

Display help information.

```bash
claude-code-sync --help
claude-code-sync help
claude-code-sync help <command>
```

**Examples:**

```bash
# General help
claude-code-sync --help

# Help for specific command
claude-code-sync help login
claude-code-sync help set
```

### version

Display version number.

```bash
claude-code-sync --version
claude-code-sync -V
```

### hook

Handle Claude Code hook events. This command is called internally by Claude Code and reads JSON from stdin.

```bash
claude-code-sync hook <event>
```

**Events:**

| Event | Description |
|-------|-------------|
| `SessionStart` | Called when a coding session begins |
| `SessionEnd` | Called when a session terminates |
| `UserPromptSubmit` | Called when you submit a prompt |
| `PostToolUse` | Called after each tool execution |
| `Stop` | Called when Claude finishes responding |

**Note:** You should not call this command directly. It is invoked by Claude Code based on the hooks configuration in `~/.claude/settings.json`.

## Environment Variables

Environment variables override config file settings.

| Variable | Description | Example |
|----------|-------------|---------|
| `CLAUDE_SYNC_CONVEX_URL` | Convex deployment URL | `https://your-project.convex.cloud` |
| `CLAUDE_SYNC_API_KEY` | API key from Settings | `osk_abc123...` |
| `CLAUDE_SYNC_AUTO_SYNC` | Enable/disable auto sync | `true` or `false` |
| `CLAUDE_SYNC_TOOL_CALLS` | Sync tool call details | `true` or `false` |
| `CLAUDE_SYNC_THINKING` | Sync thinking traces | `true` or `false` |

**Example usage:**

```bash
# Set in shell profile (.bashrc, .zshrc)
export CLAUDE_SYNC_CONVEX_URL="https://your-project.convex.cloud"
export CLAUDE_SYNC_API_KEY="osk_your_api_key"

# Or inline for single session
CLAUDE_SYNC_CONVEX_URL="https://..." CLAUDE_SYNC_API_KEY="osk_..." claude
```

## Configuration File

Location: `~/.config/claude-code-sync/config.json`

**Structure:**

```json
{
  "convexUrl": "https://your-project.convex.cloud",
  "apiKey": "osk_your_api_key",
  "autoSync": true,
  "syncToolCalls": true,
  "syncThinking": false
}
```

**View config file:**

```bash
cat ~/.config/claude-code-sync/config.json
```

**Reset config:**

```bash
rm ~/.config/claude-code-sync/config.json
claude-code-sync login
```

## Troubleshooting

### Connection failed

**Symptom:** "Could not connect to Convex backend"

**Solutions:**

1. Verify URL format:
   ```bash
   # Correct format
   https://your-project.convex.cloud
   
   # Wrong formats
   your-project.convex.cloud  # Missing https://
   https://your-project.convex.cloud/  # Trailing slash
   ```

2. Check if backend is deployed:
   ```bash
   curl https://your-project.convex.site/health
   ```

3. Verify API key:
   - Must start with `osk_`
   - Generate a new key in Settings if needed

### Invalid API Key

**Symptom:** "Invalid API Key. Must start with osk_"

**Solution:** Generate a new API key from your OpenSync dashboard Settings page.

### Plugin not loading

**Symptom:** Sessions not syncing

**Check configuration:**

```bash
claude-code-sync status
```

**Verify plugin is recognized:**

```bash
# Check if globally installed
npm list -g claude-code-sync

# Check installation location
which claude-code-sync
```

### Permission errors

**Symptom:** EACCES or permission denied during install

**Solutions:**

```bash
# Fix npm permissions (recommended)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Or use sudo (not recommended)
sudo npm install -g claude-code-sync
```

### Cache issues

**Symptom:** Stale data or unexpected behavior

**Clear npm cache:**

```bash
npm cache clean --force
npm uninstall -g claude-code-sync
npm install -g claude-code-sync
```

### Check Node.js version

**Requirement:** Node.js 18 or later

```bash
node --version
```

If below v18:

```bash
# Using nvm
nvm install 18
nvm use 18

# Or upgrade Node.js directly
```

### Debug mode

View verbose output:

```bash
DEBUG=* claude-code-sync status
```

### View logs

Check for errors in Claude Code output when starting a session.

### Reset everything

Complete reset:

```bash
# Remove plugin
npm uninstall -g claude-code-sync

# Remove config
rm -rf ~/.config/claude-code-sync

# Reinstall
npm install -g claude-code-sync

# Reconfigure
claude-code-sync login
```

## Quick Reference

| Task | Command |
|------|---------|
| Install | `npm install -g claude-code-sync` |
| Configure credentials | `claude-code-sync login` |
| Configure Claude Code | `claude-code-sync setup` |
| Verify everything | `claude-code-sync verify` |
| Check status | `claude-code-sync status` |
| View config | `claude-code-sync config` |
| View config (JSON) | `claude-code-sync config --json` |
| Enable thinking sync | `claude-code-sync set syncThinking true` |
| Disable tool sync | `claude-code-sync set syncToolCalls false` |
| Clear credentials | `claude-code-sync logout` |
| Check version | `claude-code-sync --version` |
| Update | `npm update -g claude-code-sync` |
| Uninstall | `npm uninstall -g claude-code-sync` |
| Full reset | `npm uninstall -g claude-code-sync && rm -rf ~/.config/claude-code-sync ~/.claude/settings.json && npm install -g claude-code-sync` |

## Links

- [npm Package](https://www.npmjs.com/package/claude-code-sync)
- [GitHub Repository](https://github.com/waynesutton/claude-code-sync)
- [OpenSync Backend](https://github.com/waynesutton/opensync)
- [OpenSync Dashboard](https://opensyncsessions.netlify.app)
