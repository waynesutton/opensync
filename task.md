# Tasks

Current development tasks and feature backlog for OpenSync.

OpenSync supports two AI coding tools: **OpenCode** and **Claude Code**.

## Active Tasks

- [x] Fix filter UI alignment
- [x] Add API rename and Claude API config
- [x] Notifications UI match existing design
- [x] Dedicated context search page (/context) system
- [x] Search results highlighting
- [x] Pagination for large session lists
- [x] update docs
- [x] Delete user data and profile option

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
- [x] Projects Overview filtering (search, min sessions, min tokens) with sortable columns
- [x] WorkOS login fix: session persistence across page refresh with proper callback handling
- [x] Plugin Setup section in Settings with Convex URL and API Key display
- [x] WORKOS-AUTH.md documentation for auth architecture
- [x] ConsumptionBreakdown component with stacked bar chart, credit bar, and usage table
- [x] Overview layout reorder: Usage Overview up, Token Usage and Model Distribution to bottom
- [x] Dashboard footer with GitHub repo link and "powered by convex" attribution
- [x] CSV export for all user session data (exportAllDataCSV Convex query)
- [x] Export CSV button in sessions view toolbar next to list/timeline toggle
- [x] Fixed Consumption Breakdown filters (project/model selection now filters data)
- [x] Added Tokens/Cost toggle for chart visualization in Usage Overview
- [x] Added prompt/completion token breakdown to usage table
- [x] Fixed markdown export to include message content (textContent fallback)
- [x] Privacy messaging on login page ("Private - your data stays in your account")
- [x] Removed EnvStatus debug component from login footer
- [x] Fixed session persistence on page refresh with retry mechanism and timeout handling
- [x] ConfirmModal component for themed confirmation dialogs
- [x] Session delete confirmation modal (replaces browser confirm())
- [x] Fixed StackedBarChart height rendering for proper bar display
- [x] Date range selector in Usage Overview (7/14/30/60/90 days)
- [x] Source field added to sessions schema (opencode vs claude-code)
- [x] Source dropdown filter in dashboard header (All Sources / OpenCode / Claude Code)
- [x] All analytics queries updated to filter by source
- [x] claude-code-sync plugin backend integration completed
- [x] Source badges (CC/OC) on session list items and detail header
- [x] sourceStats query for session distribution by source
- [x] messages.upsert accepts source param for auto-created sessions
- [x] CSV export includes Source column and exports all sessions
- [x] Evals tab integrated into Dashboard (Overview, Sessions, Evals, Analytics)
- [x] Session sync timeout in ProtectedRoute (5s max, redirects to login on failure)

## In Progress

None currently.

## Recently Completed

- [x] Comprehensive documentation page update (Docs.tsx)
  - Added "Use Hosted Version" section as first section
  - Features section with Sync, Search, Private, Export, Delete, API
  - Plugin installation instructions for hosted opensync.dev
  - Login and sync walkthrough for both opencode-sync-plugin and claude-code-sync
  - Left sidebar with collapsible navigation and anchor tags
  - Right table of contents for on-page navigation
  - Copy as Markdown button per section and full page
  - View as Markdown mode for entire documentation
  - Mobile responsive design with slide-out sidebar
  - llms.txt file for AI assistants

- [x] Login page mockup updated to match Dashboard features
  - View tabs row (overview/sessions/evals/analytics)
  - 4 stats instead of 3 (sessions, tokens, cost, duration)
  - OC/CC source badges on session items
  - GitHub icon link in footer (bottom left)

- [x] Setup banner for new users on Dashboard Overview
  - Shows when totalSessions === 0 with links to both sync plugins
  - Two plugin cards: opencode-sync-plugin (OC) and claude-code-sync (CC)
  - npm install commands and GitHub/npm links for each
  - Dismissible with X button, persists in localStorage

- [x] Dashboard UX improvement: removed search bar, added search icon to Context link
  - Search functionality consolidated into dedicated Context page
  - Cleaner header with Context link as search entry point
  - Removed unused searchQuery state, keyboard handler, and searchResults query

- [x] Login page tan mode theme support with footer theme switcher
  - Added ThemeSwitcher component to bottom right footer
  - Full theme-aware styling for all Login page elements
  - Logo inversion for tan mode (Convex, WorkOS, Netlify)
  - Theme persists via localStorage

- [x] Delete user data and account options
  - Added deleteAllData mutation (removes sessions, messages, parts, embeddings, apiLogs)
  - Added deleteAccount action (calls WorkOS API DELETE /user_management/users/:id)
  - Danger Zone section in Settings Profile tab with confirmation modals
  - Trust message on login page about data privacy and control
  - Getting started section with plugin links on login page

- [x] Fixed Claude Code session content rendering (empty blocks issue)
  - Added content normalization helpers to handle different formats (string vs object)
  - SessionViewer now properly extracts text from `{ text: "..." }` or `{ content: "..." }` formats
  - Added fallback to `message.textContent` when parts are empty
  - Updated markdown export, API export, and context functions with same normalization
  - Fixed searchable text extraction in message upsert for better full-text search
  - Enhanced embedding generation to use parts content as fallback

## Backlog

### High Priority (Plugins)

**Authentication:** All plugins use API Key auth (`osk_*` prefix). See [PLUGIN-AUTH-PRD.md](docs/PLUGIN-AUTH-PRD.md).

- [x] opencode-sync-plugin (npm package for OpenCode CLI) - **Published:** [npmjs.com/package/opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin)
  - [x] API Key authentication (no browser OAuth)
  - [x] Session lifecycle hooks
  - [x] CLI commands (login, logout, status, config)
  - [x] Config file (~/.config/opencode-sync/config.json)
  - [x] URL normalization (.cloud to .site)
- [x] claude-code-sync plugin (npm package for Claude Code) - **Published:** [npmjs.com/package/claude-code-sync](https://www.npmjs.com/package/claude-code-sync)
  - [x] API Key authentication (no browser OAuth)
  - [x] Event hooks (SessionStart, UserPromptSubmit, PostToolUse, SessionEnd)
  - [x] CLI commands (login, logout, status, config, setup, verify, synctest)
  - [x] Config file (~/.config/claude-code-sync/config.json)
  - [x] URL normalization (.cloud to .site)
  - [x] OpenSync backend integration (source field, source badge, sourceStats query)
- [x] Add source field to sessions schema (opencode vs claude-code)

### High Priority (Core)


- [x] Source filtering in session list (OpenCode / Claude Code / All)

### Medium Priority (Sync for Evals)

See [SYNC-FOR-EVALS-PRD.md](docs/SYNC-FOR-EVALS-PRD.md) for full specification.

- [x] Schema: Add evalReady, reviewedAt, evalNotes, evalTags fields
- [x] EvalReadyToggle component in session detail
- [x] Evals page with eval-ready session list
- [x] EvalExportModal with format selection
- [x] Export formats:
  - [x] DeepEval JSON
  - [x] OpenAI Evals JSONL
  - [x] Filesystem (plain text files)
- [ ] WhatsNextPanel with copy-paste commands (future enhancement)
- [x] convex/evals.ts functions
- [x] Message-level embeddings (messageEmbeddings table with vector index)

### Medium Priority (RAG Context Library)

- [x] Dedicated context search page (/context)
- [x] Paginated search results (20 per page)
- [x] Full-text search without OpenAI API key
- [ ] Token budget controls
- [ ] Saved searches / bookmarks
- [ ] Expose the existing search APIs as MCP tools that agents can call directly
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
- [x] Migration script for source field on existing sessions (handled via default value in queries)

## Plugin Repos

| Repo | Purpose | Language | Auth | Status |
|------|---------|----------|------|--------|
| [opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin) | npm package for OpenCode CLI | TypeScript | API Key (osk_*) | Published |
| [claude-code-sync](https://www.npmjs.com/package/claude-code-sync) | npm package for Claude Code | TypeScript | API Key (osk_*) | Published |

## Notes

- Plugins are separate repos from this backend
- Both plugins use TypeScript/JavaScript (npm packages)
- Plugins authenticate with API Keys (`osk_*`), not WorkOS OAuth
- Web UI continues to use WorkOS AuthKit for browser authentication
- Plugins accept both `.convex.cloud` and `.convex.site` URLs, normalize to `.site` for API calls
- Source field distinguishes session origins: "opencode" (default) vs "claude-code"
- Existing sessions without source field are treated as "opencode" for backward compatibility
- Dashboard source dropdown filters all views (Overview, Sessions, Analytics)
- Eval export feature targets DeepEval, OpenAI Evals, and Promptfoo frameworks
- Marketplace payment uses Convex Stripe component (future)
- See [PLUGIN-AUTH-PRD.md](docs/PLUGIN-AUTH-PRD.md) for full plugin authentication specification
- See [CLAUDE-CODE-PLUGIN.md](docs/CLAUDE-CODE-PLUGIN.md) for Claude Code plugin documentation
