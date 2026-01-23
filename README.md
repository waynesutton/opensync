# OpenSync

Dashboards for OpenCode and Claude coding sessions.

Cloud-synced dashboards that track session activity, tool usage, and token spend. Build eval datasets across projects.

[Website](https://www.opensync.dev/) | [Docs](https://www.opensync.dev/docs) | [Dashboard](https://www.opensync.dev/)

## Opensync Ecosystem

| Project              | Description                             | Links                                                                                                                     |
| -------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| OpenSync             | Dashboards for AI coding sessions       | [Website](https://www.opensync.dev/) / [GitHub](https://github.com/waynesutton/opensync)                                  |
| opencode-sync-plugin | Sync OpenCode sessions                  | [GitHub](https://github.com/waynesutton/opencode-sync-plugin) / [npm](https://www.npmjs.com/package/opencode-sync-plugin) |
| claude-code-sync     | Sync Claude Code sessions               | [GitHub](https://github.com/waynesutton/claude-code-sync) / [npm](https://www.npmjs.com/package/claude-code-sync)         |
| droid-sync           | Sync Factory Droid sessions (community) | [GitHub](https://github.com/yemyat/droid-sync-plugin) / [npm](https://www.npmjs.com/package/droid-sync)                   |
| codex-sync           | Sync Codex CLI sessions                 | [GitHub](https://github.com/waynesutton/codex-sync-plugin) / [npm](https://www.npmjs.com/package/codex-sync)                     |

## Features

| Feature                                                 | Description                                    |
| ------------------------------------------------------- | ---------------------------------------------- |
| [Sync](https://www.opensync.dev/docs#hosted-features)   | Sessions sync in real time as you work         |
| [Search](https://www.opensync.dev/docs#search)          | Full text, semantic, and hybrid search         |
| [Private](https://www.opensync.dev/docs#auth)           | Your data stays in your account                |
| [Tag](https://www.opensync.dev/docs#dashboard-evals)    | Organize sessions with custom labels for evals |
| [Export](https://www.opensync.dev/docs#dashboard-evals) | DeepEval JSON, OpenAI Evals JSONL, plain text  |
| [Delete](https://www.opensync.dev/docs#hosted-features) | Your data, your control                        |

## Quick start

### Use the hosted version

1. Go to [opensync.dev](https://www.opensync.dev/)
2. Sign in with GitHub or email
3. Install a sync plugin (see below)
4. Start coding

[Full setup guide](https://www.opensync.dev/docs#hosted)

### Install sync plugins

**For OpenCode:**

```bash
npm install -g opencode-sync-plugin
opencode-sync login
```

Add to your `opencode.json`:

```json
{
  "plugins": ["opencode-sync-plugin"]
}
```

[OpenCode plugin docs](https://www.opensync.dev/docs#opencode-plugin)

**For Claude Code:**

```bash
npm install -g claude-code-sync
claude-code-sync login
```

[Claude Code plugin docs](https://www.opensync.dev/docs#claude-plugin)

**For Codex CLI:**

```bash
npm install -g codex-sync
codex-sync login
```

[Codex CLI plugin docs](https://www.opensync.dev/docs#codex-plugin)

## Self hosting

Clone and deploy your own instance:

```bash
git clone https://github.com/waynesutton/opensync.git
cd opensync
npm install
npx convex dev
```

Requires Convex, WorkOS, and Netlify accounts.

[Self hosting guide](https://www.opensync.dev/docs#hosting) | [Fork guide](https://www.opensync.dev/docs#fork) | [install.md](install.md)

## Dashboard

Four views for managing your sessions:

| View                                                           | What it does                                       |
| -------------------------------------------------------------- | -------------------------------------------------- |
| [Overview](https://www.opensync.dev/docs#dashboard-overview)   | Usage stats, token charts, recent sessions         |
| [Sessions](https://www.opensync.dev/docs#dashboard-sessions)   | Filter, search, and manage all sessions            |
| [Evals](https://www.opensync.dev/docs#dashboard-evals)         | Mark sessions as eval-ready, export datasets       |
| [Analytics](https://www.opensync.dev/docs#dashboard-analytics) | Model comparison, project breakdown, cost tracking |

[Context search](https://www.opensync.dev/docs#dashboard-context) lets you find relevant sessions for RAG and context engineering.

## API

All endpoints require authentication. Generate an API key in Settings.

| Endpoint              | Description         |
| --------------------- | ------------------- |
| `POST /sync/session`  | Sync a session      |
| `POST /sync/message`  | Sync a message      |
| `GET /api/sessions`   | List sessions       |
| `GET /api/search?q=`  | Search sessions     |
| `GET /api/context?q=` | Get context for LLM |
| `GET /api/export?id=` | Export session      |

[Full API reference](https://www.opensync.dev/docs#api)

## Tech stack

- [Convex](https://convex.dev) for backend and real time sync
- [WorkOS](https://workos.com) for authentication
- React, Vite, Tailwind for frontend
- OpenAI for embeddings

## License

MIT
