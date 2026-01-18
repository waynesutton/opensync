# Claude Code Sync Plugin

Sync your Claude Code sessions to the OpenSync dashboard. Track coding sessions, analyze tool usage, and monitor token consumption across projects.

## Installation

```bash
npm install -g claude-code-sync
```

## Authentication

The plugin uses **API Key authentication**. No browser OAuth flow required.

### Step 1: Get Your API Key

1. Log into your OpenSync dashboard at https://opensyncsessions.netlify.app
2. Go to **Settings**
3. Click **Generate API Key**
4. Copy the key (starts with `osk_`)

### Step 2: Configure the Plugin

```bash
claude-code-sync login
```

Enter when prompted:
- **Convex URL**: Your deployment URL (e.g., `https://your-project.convex.cloud`)
- **API Key**: Your API key from Settings (e.g., `osk_abc123...`)

### Step 3: Verify Connection

```bash
claude-code-sync status
```

You should see:
```
📊 Claude Code Sync - Status

Configuration:
  Convex URL: https://your-project.convex.site
  API Key:    osk_****1234
  Auto Sync:  enabled
  Tool Calls: enabled
  Thinking:   disabled

⏳ Testing connection...
✅ Connected to Convex backend
```

## Configuration

### Config File

Credentials are stored at `~/.config/claude-code-sync/config.json`:

```json
{
  "convexUrl": "https://your-deployment.convex.cloud",
  "apiKey": "osk_your_api_key",
  "autoSync": true,
  "syncToolCalls": true,
  "syncThinking": false
}
```

### Environment Variables

Alternatively, use environment variables:

```bash
export CLAUDE_SYNC_CONVEX_URL="https://your-deployment.convex.cloud"
export CLAUDE_SYNC_API_KEY="osk_your_api_key"
export CLAUDE_SYNC_AUTO_SYNC="true"
export CLAUDE_SYNC_TOOL_CALLS="true"
export CLAUDE_SYNC_THINKING="false"
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `convexUrl` | string | required | Your Convex deployment URL |
| `apiKey` | string | required | API key from OpenSync Settings (osk_*) |
| `autoSync` | boolean | `true` | Automatically sync when sessions end |
| `syncToolCalls` | boolean | `true` | Include tool call details |
| `syncThinking` | boolean | `false` | Include thinking/reasoning traces |

Update options with:

```bash
claude-code-sync set syncThinking true
claude-code-sync set autoSync false
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `claude-code-sync login` | Configure Convex URL and API Key |
| `claude-code-sync logout` | Clear stored credentials |
| `claude-code-sync status` | Show authentication and connection status |
| `claude-code-sync config` | Show current configuration |
| `claude-code-sync config --json` | Output config as JSON |
| `claude-code-sync set <key> <value>` | Update a configuration value |

## What Gets Synced

### Session Data

| Field | Description |
|-------|-------------|
| `sessionId` | Unique session identifier |
| `source` | Always "claude-code" for this plugin |
| `projectPath` | Working directory path |
| `projectName` | Project folder name |
| `cwd` | Current working directory |
| `gitBranch` | Active git branch (if in a repo) |
| `model` | Claude model used (e.g., claude-sonnet-4-20250514) |
| `startType` | How session started: new, resume, continue |
| `endReason` | Why session ended: user_stop, max_turns, error, completed |
| `messageCount` | Total messages in session |
| `toolCallCount` | Number of tool invocations |
| `tokenUsage` | Input and output token counts |
| `costEstimate` | Estimated cost in cents |
| `thinkingEnabled` | Whether extended thinking was on |
| `permissionMode` | Permission mode setting |
| `mcpServers` | Connected MCP server names |

### Message Data

| Field | Description |
|-------|-------------|
| `sessionId` | Parent session ID |
| `messageId` | Unique message identifier |
| `role` | user, assistant, or system |
| `content` | Message text content |
| `toolName` | Tool name (for tool calls) |
| `toolArgs` | Tool arguments (for tool calls) |
| `toolResult` | Tool result (for tool calls) |
| `durationMs` | Response time in milliseconds |
| `tokenCount` | Tokens used for this message |
| `thinkingContent` | Thinking trace (if enabled) |

## How It Works

The plugin registers hooks that fire at key points in Claude Code's lifecycle:

1. **SessionStart** - Records when you begin a session, captures project info and settings
2. **UserPromptSubmit** - Tracks each prompt you send
3. **PostToolUse** - Logs tool executions (if syncToolCalls enabled)
4. **Stop** - Captures Claude's response and token usage
5. **SessionEnd** - Syncs final session data with totals

All events are sent to your Convex backend via the `/sync/session` and `/sync/message` HTTP endpoints.

## Privacy

- **Your data stays yours** - All data goes to YOUR Convex deployment, not any third party
- **Automatic redaction** - Sensitive patterns (API keys, tokens, passwords) are redacted
- **File contents excluded** - Only file paths and lengths are synced, not contents
- **Thinking off by default** - Extended thinking traces require explicit opt-in
- **Full control** - Configure exactly what gets synced

## Viewing Your Sessions

After syncing, view your sessions at:
- **Dashboard**: https://opensyncsessions.netlify.app
- **Filter by source**: Use the source filter to show only Claude Code sessions
- **Search**: Full-text and semantic search across all sessions
- **Export**: Download sessions as JSON, JSONL, or Markdown

## Troubleshooting

### "Not configured" error

Run `claude-code-sync login` to set up your credentials.

### "Invalid API key" error

1. Go to OpenSync Settings
2. Generate a new API key
3. Run `claude-code-sync login` with the new key

### "Could not connect" error

Check that:
1. Your Convex deployment is running
2. The URL is correct (accepts `.convex.cloud` or `.convex.site`)
3. Your API key is valid (starts with `osk_`)

### Sessions not appearing

1. Wait a few seconds for sync to complete
2. Refresh the OpenSync dashboard
3. Check the source filter includes "claude-code"
4. Run `claude-code-sync status` to verify connection

### Check logs

The plugin logs sync activity to the console. Look for lines starting with `[claude-code-sync]`.

## URL Formats

The plugin accepts both URL formats:
- `https://your-project.convex.cloud` (dashboard URL)
- `https://your-project.convex.site` (API endpoint URL)

The plugin automatically normalizes to `.site` for API calls.

## Differences from OpenCode Plugin

| Feature | OpenCode Plugin | Claude Code Plugin |
|---------|-----------------|-------------------|
| Package | `opencode-sync-plugin` | `claude-code-sync` |
| Source field | `"opencode"` | `"claude-code"` |
| Config location | `~/.config/opencode-sync/` | `~/.config/claude-code-sync/` |
| Env var prefix | `OPENCODE_SYNC_*` | `CLAUDE_SYNC_*` |
| Hook system | OpenCode hooks | Claude Code hooks |

Both plugins use the same OpenSync backend and API key authentication.

## Related Documentation

- [OpenSync Setup Guide](./SETUP.md) - Deploy your own OpenSync instance
- [OpenCode Plugin](./OPENCODE-PLUGIN.md) - Sync OpenCode sessions
- [API Reference](./API.md) - Access sessions programmatically
- [Sync for Evals PRD](./SYNC-FOR-EVALS-PRD.md) - Export sessions for model evaluation

## Links

- **OpenSync Repo**: https://github.com/waynesutton/opensync
- **OpenSync Dashboard**: https://opensyncsessions.netlify.app
- **npm Package**: https://www.npmjs.com/package/claude-code-sync
- **Plugin Repo**: https://github.com/waynesutton/claude-code-sync
