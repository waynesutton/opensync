# OpenCode Sync Plugin

Sync your OpenCode sessions to the OpenSync dashboard.

## Installation

```bash
npm install -g opencode-sync-plugin
```

## Authentication

```bash
opencode-sync login
```

Enter when prompted:
- **Convex URL**: Your deployment URL (e.g., `https://your-project-123.convex.cloud`)
- **WorkOS Client ID**: Your client ID (e.g., `client_xxxxx`)

Complete authentication in the browser.

## Configuration

Add the plugin to your project's `opencode.json`:

```json
{
  "plugin": ["opencode-sync-plugin"]
}
```

## Usage

Start an OpenCode session and your sessions sync automatically.

### Check Status

```bash
opencode-sync status
```

### Manual Sync

```bash
opencode-sync sync
```

## What Gets Synced

| Data | Description |
|------|-------------|
| Session metadata | Project name, directory, git branch, timestamps |
| Messages | User prompts and assistant responses |
| Tool calls | Which tools were used and their outcomes |
| Token usage | Input and output token counts |
| Model info | Which model was used |
| Cost | Estimated cost per session |

## Troubleshooting

### Plugin not syncing

1. Verify authentication: `opencode-sync status`
2. Check the plugin is in `opencode.json`
3. Check Convex dashboard logs for errors

### "Invalid token" errors

1. Re-authenticate: `opencode-sync login`
2. Verify your Convex URL is correct
3. Check WorkOS Client ID matches your deployment

### Sessions not appearing in dashboard

1. Wait a few seconds for sync to complete
2. Refresh the OpenSync dashboard
3. Check your user account matches between plugin and dashboard

## Related

- [OpenSync Setup Guide](./SETUP.md) - Deploy your own OpenSync instance
- [API Reference](./API.md) - Access your sessions programmatically
