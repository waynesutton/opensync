# cursor-opensync-plugin: Syncing Cursor sessions to OpenSync

Sharing a plugin for the OpenSync ecosystem that syncs Cursor IDE sessions to your dashboard.

## What it does

`cursor-opensync-plugin` captures your Cursor agent sessions and sends them to OpenSync. You get:

- User prompts you submit to the agent
- Assistant text responses from the agent
- File edit diffs showing actual code changes
- Shell commands executed
- MCP tool calls
- Session metadata (project, directory, timestamps)

Install it globally:

```bash
npm install -g cursor-opensync-plugin
cursor-sync login
cursor-sync setup
```

The setup command configures hooks in `~/.cursor/hooks.json`. After that, sessions sync automatically when you use Cursor.

## How it works

Cursor 1.7+ introduced a hooks system. External scripts can run at defined stages of the agent loop:

- `beforeSubmitPrompt` when you submit a prompt
- `beforeShellExecution` before shell commands run
- `beforeMCPExecution` before MCP tools execute
- `afterFileEdit` after the agent modifies a file
- `afterAgentResponse` after the agent completes a text response
- `stop` when the session completes

The plugin observes these events and syncs the data to your Convex deployment. It never blocks any actions.

## Feature comparison with other sync plugins

If you've used [codex-sync](https://www.npmjs.com/package/codex-sync), [claude-code-sync](https://www.npmjs.com/package/claude-code-sync), or [opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin), you'll notice cursor-sync has different capabilities.

| Feature | cursor-sync | codex-sync | claude-code-sync |
|---------|:-----------:|:----------:|:----------------:|
| User prompts | Yes | Yes | Yes |
| Assistant responses | Yes | Yes | Yes |
| File edit diffs | Yes | Yes | Yes |
| Shell commands | Yes | Yes | Yes |
| MCP tool calls | Yes | Yes | Yes |
| Token usage | No | Yes | Yes |
| Cost calculation | No | Yes | Yes |
| Model info per message | No | Yes | Yes |

## Why no token/cost data?

Codex CLI, Claude Code, and OpenCode store complete session data in local files (JSONL or SQLite). Their sync plugins read these files and extract everything: tokens, costs, and model info.

Cursor uses a hooks-based API. According to the [Cursor hooks documentation](https://cursor.com/docs/agent/hooks), the hook payloads include event-specific data but do not expose:

- Token counts (input/output/cached)
- Cost information
- Which model generated a response

Cursor does have an [Analytics API](https://cursor.com/docs/account/teams/analytics-api) and [AI Code Tracking API](https://cursor.com/docs/account/teams/ai-code-tracking-api), but these are Enterprise-only and provide aggregated team metrics rather than per-session granular data.

## What you can track

cursor-sync captures:

- Your prompts and the agent's responses
- File modifications with actual diff content
- Shell commands and MCP tool usage
- Session duration and tool call counts
- Project context

This gives you a searchable history of your Cursor sessions in OpenSync.

## Links

- [npm package](https://www.npmjs.com/package/cursor-opensync-plugin)
- [GitHub repo](https://github.com/waynesutton/cursor-cli-sync-plugin)
- [OpenSync dashboard](https://opensync.dev/)
- [Cursor hooks docs](https://cursor.com/docs/agent/hooks)

## Feedback

If you run into issues or have suggestions, open an issue on GitHub. The plugin is part of the OpenSync ecosystem alongside sync plugins for Codex CLI, Claude Code, OpenCode, and Factory Droid.
