# OpenSync

Dashboards for OpenCode, Claude Code, Codex, Cursor, Factory Droid and more.

Cloud-synced dashboards that track session activity, tool usage, and token spend. Build eval datasets across projects.

[Website](https://www.opensync.dev/) | [Docs](https://docs.opensync.dev) | [Dashboard](https://www.opensync.dev/)

## OpenSync Ecosystems

| Project                | Description                                   | Links                                                                                                                         |
| ---------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| OpenSync               | Dashboards for AI coding sessions             | [Website](https://www.opensync.dev/) / [GitHub](https://github.com/waynesutton/opensync)                                      |
| opencode-sync-plugin   | Sync OpenCode sessions                        | [GitHub](https://github.com/waynesutton/opencode-sync-plugin) / [npm](https://www.npmjs.com/package/opencode-sync-plugin)     |
| claude-code-sync       | Sync Claude Code sessions                     | [GitHub](https://github.com/waynesutton/claude-code-sync) / [npm](https://www.npmjs.com/package/claude-code-sync)             |
| droid-sync             | Sync Factory Droid sessions (community built) | [GitHub](https://github.com/yemyat/droid-sync-plugin) / [npm](https://www.npmjs.com/package/droid-sync)                       |
| codex-sync             | Sync Codex CLI sessions                       | [GitHub](https://github.com/waynesutton/codex-sync-plugin) / [npm](https://www.npmjs.com/package/codex-sync)                  |
| cursor-opensync-plugin | Sync Cursor sessions                          | [GitHub](https://github.com/waynesutton/cursor-cli-sync-plugin) / [npm](https://www.npmjs.com/package/cursor-opensync-plugin) |
| pi-opensync-plugin     | Sync Pi coding agent sessions                 | [GitHub](https://github.com/joshuadavidthomas/pi-opensync-plugin) / [npm](https://www.npmjs.com/package/pi-opensync-plugin)   |

## Features

| Feature                                                 | Description                                    |
| ------------------------------------------------------- | ---------------------------------------------- |
| [Sync](https://docs.opensync.dev/getting-started/hosted)   | Sessions sync in real time as you work         |
| [Search](https://docs.opensync.dev/search/fulltext)        | Full text, semantic, and hybrid search         |
| [Private](https://docs.opensync.dev/auth/workos)           | Your data stays in your account                |
| [Tag](https://docs.opensync.dev/dashboard/evals)           | Organize sessions with custom labels for evals |
| [Export](https://docs.opensync.dev/dashboard/evals)        | DeepEval JSON, OpenAI Evals JSONL, plain text  |
| [Delete](https://docs.opensync.dev/getting-started/hosted) | Your data, your control                        |

## Quick start

### Use the hosted version

1. Go to [opensync.dev](https://www.opensync.dev/)
2. Sign in with GitHub or email
3. Install a sync plugin (see below)
4. Start coding

[Full setup guide](https://docs.opensync.dev/getting-started/hosted)

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

[OpenCode plugin docs](https://docs.opensync.dev/plugins/opencode-sync)

**For Claude Code:**

```bash
npm install -g claude-code-sync
claude-code-sync login
```

[Claude Code plugin docs](https://docs.opensync.dev/plugins/claude-code-sync)

**For Codex CLI:**

```bash
npm install -g codex-sync
codex-sync login
```

[Codex CLI plugin docs](https://docs.opensync.dev/plugins/codex-sync)

**For Cursor:**

```bash
npm install -g cursor-sync-plugin
cursor-sync login
```

[Cursor plugin docs](https://docs.opensync.dev/plugins/cursor-sync)

**For Pi:**

```bash
npm install -g pi-opensync-plugin
```

Then run `/opensync:config` in pi to configure the extension.

[Pi plugin docs](https://github.com/joshuadavidthomas/pi-opensync-plugin)

## Self hosting

Clone and deploy your own instance:

```bash
git clone https://github.com/waynesutton/opensync.git
cd opensync
npm install
npx convex dev
```

Requires Convex, WorkOS, and OpenAI accounts.

[Self hosting guide](https://docs.opensync.dev/hosting/convex) | [Fork guide](https://docs.opensync.dev/fork/guide) | [install.md](install.md)

### One-click deploy

Deploy the frontend to Vercel or Netlify. **This deploys the web UI only.** You must set up Convex and WorkOS separately.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/waynesutton/opensync&env=VITE_CONVEX_URL,VITE_WORKOS_CLIENT_ID&envDescription=Required%20environment%20variables%20for%20OpenSync&envLink=https://github.com/waynesutton/opensync/blob/main/ONE-CLICK-DEPLOY.md)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/waynesutton/opensync)

After deploying, follow the [post-deploy checklist](ONE-CLICK-DEPLOY.md) to complete setup.

## Dashboard

Four views for managing your sessions:

| View                                                           | What it does                                       |
| -------------------------------------------------------------- | -------------------------------------------------- |
| [Overview](https://docs.opensync.dev/dashboard/overview)   | Usage stats, token charts, recent sessions         |
| [Sessions](https://docs.opensync.dev/dashboard/sessions)   | Filter, search, and manage all sessions            |
| [Evals](https://docs.opensync.dev/dashboard/evals)         | Mark sessions as eval-ready, export datasets       |
| [Analytics](https://docs.opensync.dev/dashboard/analytics) | Model comparison, project breakdown, cost tracking |

[Context search](https://docs.opensync.dev/dashboard/context) lets you find relevant sessions for RAG and context engineering.

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

[Full API reference](https://docs.opensync.dev/api/endpoints)

## Tech stack

- [Convex](https://convex.dev) for backend and real time sync
- [WorkOS](https://workos.com) for authentication
- React, Vite, Tailwind for frontend
- OpenAI for embeddings

## License

MIT
