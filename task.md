# Tasks

Current development tasks and feature backlog for OpenSync.

OpenSync supports two AI coding tools: **OpenCode** and **Claude Code**.

- fix filter ui
- workos login fix
- add claude code plugin
- notifications matches the ui
- small footer

## Completed

- [x] Database schema design (users, sessions, messages, parts, embeddings)
- [x] WorkOS AuthKit integration
- [x] Session sync endpoints (POST /sync/session, /message, /batch)
- [x] Public API endpoints (sessions, search, export, stats)
- [x] Full-text search on sessions and messages
- [x] Semantic search with vector embeddings
- [x] Hybrid search with RRF scoring
- [x] Dashboard with session list and viewer
- [x] Public session sharing (/s/:slug)
- [x] Settings page with usage stats
- [x] API key generation and management
- [x] Interactive docs page
- [x] Markdown export
- [x] README and documentation
- [x] opencode-sync-plugin published to npm ([npmjs.com/package/opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin))
- [x] Fixed Netlify build errors (vite-env.d.ts, @types/node, tsconfig types)
- [x] Fixed Netlify SPA routing 404 errors (_redirects, netlify.toml)
- [x] Added 404 catch-all route and WorkOS auth sync detection
- [x] GET /sync/sessions/list endpoint for listing session external IDs (used by sync CLI --all)
- [x] Dashboard redesign with Overview, Sessions, Analytics views
- [x] Analytics queries (dailyStats, modelStats, projectStats, providerStats, summaryStats)
- [x] Reusable chart components (BarChart, AreaChart, DonutChart, Sparkline, ProgressBar, StatCard)
- [x] Session filtering by model, project, provider
- [x] Session sorting by date, tokens, cost, duration
- [x] Settings page redesign with tabbed interface
- [x] Mobile-responsive dashboard layout
- [x] Tan mode theme toggle for Dashboard, Settings, and Docs pages (dark mode default)
- [x] Theme switcher icon in header with localStorage persistence
- [x] Added Netlify logo to login page footer
- [x] Added close icon (X) to session detail panel for desktop
- [x] Hidden scrollbar on sessions list while keeping scroll functionality
- [x] Fixed Tokens/Cost/Duration table header alignment
- [x] Fixed markdown download with sanitized filenames and loading state
- [x] Timeline view for sessions (DAW-style track visualization grouped by project)
- [x] Horizontal drag scrolling for sessions list and timeline view
- [x] Sessions view mode toggle (list/timeline)
- [x] Enhanced Analytics with efficiency metrics (tokens/message, cost per 1K, prompt/completion ratio)
- [x] Extended project analytics table with full token breakdown and duration
- [x] Removed Daily Activity chart from Analytics (replaced with detailed metrics)

## In Progress

None currently.

## Backlog

### High Priority (Plugins)

**Authentication:** All plugins use API Key auth (`osk_*` prefix). See [PLUGIN-AUTH-PRD.md](docs/PLUGIN-AUTH-PRD.md).

- [x] opencode-sync-plugin (npm package for OpenCode CLI) - **Published:** [npmjs.com/package/opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin)
  - [x] API Key authentication (no browser OAuth)
  - [x] Session lifecycle hooks
  - [x] CLI commands (login, logout, status, config)
  - [x] Config file (~/.config/opencode-sync/config.json)
  - [x] URL normalization (.cloud to .site)
- [ ] claude-code-sync plugin (npm package for Claude Code)
  - [ ] API Key authentication (no browser OAuth)
  - [ ] Event hooks (SessionStart, UserPromptSubmit, PostToolUse, SessionEnd)
  - [ ] CLI commands (login, logout, status, config)
  - [ ] Config file (~/.config/claude-code-sync/config.json)
  - [ ] URL normalization (.cloud to .site)
- [ ] Add source field to sessions schema (opencode vs claude-code)

### High Priority (Core)

- [ ] Session delete confirmation modal
- [ ] Search results highlighting
- [ ] Pagination for large session lists
- [ ] Source filtering in session list (OpenCode / Claude Code / All)

### Medium Priority (Sync for Evals)

See [SYNC-FOR-EVALS-PRD.md](docs/SYNC-FOR-EVALS-PRD.md) for full specification.

- [ ] Schema: Add evalReady, reviewedAt, evalNotes, evalTags fields
- [ ] EvalReadyToggle component in session detail
- [ ] Evals page with eval-ready session list
- [ ] EvalExportModal with format selection
- [ ] Export formats:
  - [ ] DeepEval JSON
  - [ ] OpenAI Evals JSONL
  - [ ] Filesystem (plain text files)
- [ ] WhatsNextPanel with copy-paste commands
- [ ] convex/evals.ts functions

### Medium Priority (RAG Context Library)

- [ ] Dedicated context search page (/context)
- [ ] Token budget controls
- [ ] Saved searches / bookmarks
- [ ] Copy format options (plain, markdown, XML tags)

### Low Priority (Analytics)

- [x] Model Comparison Dashboard (basic version implemented)
  - [x] Analytics overview with 30-day range
  - [x] Usage charts by model
  - [x] Model comparison with progress bars
  - [x] Efficiency metrics (tokens per message, cost per 1K tokens, prompt/completion ratio)
  - [ ] Date range selector (custom ranges)

### Low Priority (Marketplace)

Deferred. See [PRD-FEATURES.md](docs/PRD-FEATURES.md).

- [ ] Listing creation wizard
- [ ] Anonymization utilities
- [ ] Marketplace browser
- [ ] Payment integration (Stripe)

### Tech Debt

- [ ] Add error boundaries to pages
- [ ] Add loading skeletons
- [ ] Add test coverage
- [ ] Add rate limiting to API endpoints
- [ ] Add request validation middleware
- [ ] Migration script for source field on existing sessions

## Plugin Repos

| Repo | Purpose | Language | Auth | Status |
|------|---------|----------|------|--------|
| [opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin) | npm package for OpenCode CLI | TypeScript | API Key (osk_*) | Published |
| claude-code-sync | npm package for Claude Code | TypeScript | API Key (osk_*) | Not started |

## Notes

- Plugins are separate repos from this backend
- Both plugins use TypeScript/JavaScript (npm packages)
- Plugins authenticate with API Keys (`osk_*`), not WorkOS OAuth
- Web UI continues to use WorkOS AuthKit for browser authentication
- Plugins accept both `.convex.cloud` and `.convex.site` URLs, normalize to `.site` for API calls
- Schema will need source field to distinguish session origins (opencode vs claude-code)
- Eval export feature targets DeepEval, OpenAI Evals, and Promptfoo frameworks
- Marketplace payment uses Convex Stripe component (future)
- See [PLUGIN-AUTH-PRD.md](docs/PLUGIN-AUTH-PRD.md) for full plugin authentication specification
