# Claude Code Sync Plugin

Sync your Claude Code sessions to the OpenSync dashboard. Track coding sessions, analyze tool usage, and monitor token consumption across projects.

## Installation

### From the marketplace

```bash
/plugin install yourusername/claude-code-sync
```

### During development

```bash
claude --plugin-dir /path/to/claude-code-sync
```

## Configuration

Create a config file at `~/.claude-code-sync.json`:

```json
{
  "convex_url": "https://your-deployment.convex.cloud",
  "api_key": "optional-api-key",
  "auto_sync": true,
  "sync_tool_calls": true,
  "sync_thinking": false
}
```

Or use environment variables:

```bash
export CLAUDE_SYNC_CONVEX_URL="https://your-deployment.convex.cloud"
export CLAUDE_SYNC_API_KEY="optional-api-key"
export CLAUDE_SYNC_AUTO="true"
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `convex_url` | string | required | Your Convex deployment URL |
| `api_key` | string | optional | API key for authentication |
| `auto_sync` | boolean | `true` | Automatically sync when sessions end |
| `sync_tool_calls` | boolean | `true` | Include tool call details |
| `sync_thinking` | boolean | `false` | Include thinking/reasoning traces |

## Commands

### Check sync status

```
/claude-code-sync:sync-status
```

Shows your current configuration and tests the connection to your Convex backend.

### Manual sync

```
/claude-code-sync:sync-now
```

Manually sync the current session without waiting for it to end.

## What Gets Synced

| Data | Description |
|------|-------------|
| Session metadata | Project name, working directory, git branch, timestamps |
| User prompts | Your messages to Claude (truncated for privacy) |
| Tool calls | Which tools were used and their outcomes |
| Token usage | Input and output token counts |
| Model info | Which Claude model was used |

Sensitive data like passwords, tokens, and API keys are automatically redacted.

## How It Works

The plugin registers hooks that fire at key points in Claude Code's lifecycle:

1. **SessionStart**: Records when you begin a session
2. **UserPromptSubmit**: Tracks each prompt you send
3. **PostToolUse**: Logs tool executions
4. **Stop**: Notes when Claude finishes responding
5. **SessionEnd**: Syncs the full transcript

All events are sent to your Convex backend in real-time.

## Privacy

- All data goes to YOUR Convex deployment. No third parties.
- Sensitive fields are redacted before sync.
- Full file contents are not synced, only paths and lengths.
- Thinking traces are off by default.
- You control what gets synced via configuration.

## Requirements

- Claude Code v1.0.41 or later
- Python 3.10+ with `uv` available
- A deployed Convex backend (see [OpenSync Setup Guide](./SETUP.md))

---

## Backend Setup (For Maintainers)

If you're setting up the OpenSync backend to support Claude Code sessions, follow these additional steps.

### Step 1: Update the Convex Schema

Add the `source` field to distinguish between OpenCode and Claude Code sessions. In `convex/schema.ts`:

```typescript
sessions: defineTable({
  // Existing fields...
  
  // Add this field
  source: v.union(v.literal("opencode"), v.literal("claude-code")),
  
  // Claude Code specific fields
  startType: v.optional(v.string()),
  endReason: v.optional(v.string()),
  messageCount: v.optional(v.number()),
  toolCallCount: v.optional(v.number()),
  tokenUsage: v.optional(v.object({
    input: v.number(),
    output: v.number(),
  })),
  model: v.optional(v.string()),
})
  .index("by_session_id", ["sessionId"])
  .index("by_source", ["source"])
  .index("by_project", ["projectName"])
```

Push the schema:

```bash
npx convex dev
```

### Step 2: Add Sync Functions

Create `convex/sync.ts` with the `recordEvent` mutation to handle events from Claude Code. See the full implementation in the main codebase.

### Step 3: Run Migration (If Existing Data)

If you have existing OpenCode sessions, migrate them to include the source field:

```bash
npx convex run migrations:addSourceToExisting
```

### Step 4: Update the WebUI (Optional)

Add source filtering to the sessions list so users can filter between OpenCode and Claude Code sessions.

---

## Troubleshooting

### "No Convex URL configured"

Create the config file at `~/.claude-code-sync.json` with your deployment URL.

### "Connection failed"

Check that:
1. Your Convex deployment is running
2. The URL is correct (should end in `.convex.cloud`)
3. Your API key is valid (if using authentication)

### Sync not working

Run `/claude-code-sync:sync-status` to diagnose issues.

### Hook not firing

Check that the plugin is loaded:

```
/plugins
```

You should see `claude-code-sync` in the list.

## Related

- [OpenSync Setup Guide](./SETUP.md) - Deploy your own OpenSync instance
- [OpenCode Plugin](./OPENCODE-PLUGIN.md) - Sync OpenCode sessions
- [API Reference](./API.md) - Access your sessions programmatically
