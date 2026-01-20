# Factory Droid Sync Plugin

Sync your Factory Droid sessions to the OpenSync dashboard.

## Overview

The `droid-sync` plugin integrates with Factory's Droid CLI to sync coding sessions to OpenSync. It uses Droid's hooks system to capture session events and sync them to your OpenSync backend.

## Installation

### Option 1: Plugin Marketplace (Recommended)

```bash
# Add the opensync marketplace
droid plugin marketplace add https://github.com/waynesutton/droid-sync-plugin

# Install the plugin
droid plugin install droid-sync
```

### Option 2: Manual Installation

```bash
# Clone the plugin
git clone https://github.com/waynesutton/droid-sync-plugin ~/.factory/plugins/droid-sync

# Or install via npm
npm install -g droid-sync
```

## Authentication

```bash
droid-sync login
```

Enter when prompted:
- **Convex URL**: Your deployment URL (e.g., `https://your-project.convex.cloud`)
- **API Key**: Your API key from Settings (starts with `osk_`)

### Getting Your API Key

1. Log into your OpenSync dashboard
2. Go to **Settings**
3. Click **Generate API Key**
4. Copy the key (starts with `osk_`)

## Configuration

Credentials are stored at `~/.opensync/droid-credentials.json`:

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

```bash
export DROID_SYNC_CONVEX_URL="https://your-deployment.convex.cloud"
export DROID_SYNC_API_KEY="osk_your_api_key"
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `droid-sync login` | Configure Convex URL and API Key |
| `droid-sync logout` | Clear stored credentials |
| `droid-sync status` | Show authentication and connection status |
| `droid-sync verify` | Test connectivity to OpenSync |
| `droid-sync sync` | Manually sync recent sessions |
| `droid-sync sync --all` | Sync all sessions |

## How It Works

The plugin uses Droid's hooks system to capture events:

### Hooks Configuration

The plugin registers these hooks in `~/.factory/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "droid-sync hook session-start"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "droid-sync hook stop"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "droid-sync hook session-end"
          }
        ]
      }
    ]
  }
}
```

### Event Flow

1. **SessionStart** - Captures session ID, project path, git branch
2. **Stop** - Processes the transcript and syncs messages
3. **SessionEnd** - Finalizes session with totals and duration

### Transcript Processing

Droid stores session transcripts as JSONL files at `~/.factory/projects/<project>/<session-id>.jsonl`. The plugin reads these files to extract:

- User prompts
- Assistant responses
- Tool calls and results
- Token usage
- Cost estimates

## What Gets Synced

### Session Data

| Field | Description |
|-------|-------------|
| `sessionId` | Unique session identifier |
| `source` | Always "factory-droid" for this plugin |
| `projectPath` | Working directory path |
| `projectName` | Project folder name |
| `gitBranch` | Active git branch (if in a repo) |
| `model` | Model used (from Factory settings) |
| `messageCount` | Total messages in session |
| `toolCallCount` | Number of tool invocations |
| `tokenUsage` | Input and output token counts |
| `costEstimate` | Estimated cost |
| `permissionMode` | Permission mode setting |

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

## Privacy

- **Your data stays yours** - All data goes to YOUR Convex deployment
- **Automatic redaction** - Sensitive patterns (API keys, tokens, passwords) are redacted
- **File contents excluded** - Only file paths and lengths are synced
- **Full control** - Configure exactly what gets synced

## Viewing Your Sessions

After syncing, view sessions at your OpenSync dashboard:
- **Filter by source**: Use "factory-droid" to show only Droid sessions
- **Search**: Full-text and semantic search across sessions
- **Export**: Download as JSON, JSONL, or Markdown

## Troubleshooting

### "Not configured" error

Run `droid-sync login` to set up credentials.

### Sessions not syncing

1. Verify hooks are registered: Check `~/.factory/settings.json`
2. Check `droid-sync status` for connection issues
3. Manually trigger: `droid-sync sync`

### Hook errors

Check Droid's hook output in the terminal for error messages.

## Related

- [OpenSync Setup Guide](./OPENSYNC-SETUP.md)
- [API Reference](./API.md)
- [OpenCode Plugin](./OPENCODE-PLUGIN.md)
- [Claude Code Plugin](./CLAUDE-CODE-PLUGIN.md)
