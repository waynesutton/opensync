# Changelog

All notable changes to OpenSync.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Netlify logo added to login page footer alongside Convex and WorkOS logos
- Close icon (X) button to session detail panel header for desktop users
- Hidden scrollbar CSS utility class for cleaner UI while maintaining scroll functionality
- Timeline view for sessions (DAW-style track visualization grouped by project)
- Horizontal drag scrolling for sessions list and timeline view
- Sessions view mode toggle (list/timeline) in the filter bar
- Enhanced Analytics tab with efficiency metrics (tokens/message, cost per 1K tokens, prompt/completion ratio)
- Extended project analytics table with messages, prompt tokens, completion tokens, and duration columns
- New stat cards with icons for token breakdown (prompt, completion, total, messages, duration)

### Fixed

- Fixed Tokens/Cost/Duration table header alignment in sessions view
- Fixed markdown download with sanitized filenames and date timestamps
- Added loading state to download button when markdown is being fetched

### Changed

- Removed Daily Activity chart from Analytics view (replaced with more detailed metrics)
- Updated projectStats Convex query to include messageCount, promptTokens, completionTokens, and totalDurationMs
- Tan mode theme toggle for Dashboard, Settings, and Docs pages (dark mode remains default)
- Theme switcher icon in header to toggle between dark and tan modes
- Theme persistence via localStorage
- Modern dashboard redesign with three view modes: Overview, Sessions, Analytics
- New analytics Convex queries: dailyStats, modelStats, projectStats, providerStats, summaryStats, sessionsWithDetails
- Reusable chart components: BarChart, AreaChart, DonutChart, Sparkline, ProgressBar, StatCard, DataTable
- Token usage visualization with 30-day trend charts
- Model distribution donut chart and usage breakdown
- Project-level analytics with token and cost tracking
- Session filtering by model, project, and provider
- Session sorting by date, tokens, cost, and duration
- Settings page redesign with tabbed interface (API Access default, Usage, Profile)
- Usage statistics page with interactive charts
- Mobile-responsive dashboard with back navigation for session detail view
- GET /sync/sessions/list endpoint to list all session external IDs for the authenticated user
- Used by opencode-sync CLI `sync --all` to check which sessions already exist before syncing
- Published opencode-sync-plugin to npm: [npmjs.com/package/opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin)
- Added Plugin Setup section to Settings page with Convex URL and API Key display
- Users can now copy both credentials needed for opencode-sync-plugin directly from Settings
- Added show/hide toggle for API key in Plugin Setup section

### Fixed

- Fixed "Session not found" error when messages sync before their sessions (auto-creates session)
- Fixed Netlify build errors for TypeScript compilation
- Added `src/vite-env.d.ts` for Vite client types (import.meta.env)
- Added `@types/node` to devDependencies for Convex process.env types
- Updated tsconfig.json with vite/client and node types
- Fixed unused variable error in Dashboard.tsx
- Fixed invalid title prop on Lucide icons in Sidebar.tsx
- Fixed Netlify 404 "Page not found" for SPA routes (/login, /docs, /settings, etc.)
- Added `public/_redirects` and `netlify.toml` for client-side routing support
- Added 404 catch-all route in React app for unmatched routes
- Added WorkOS auth state detection on login page (shows sign out if logged in but sync pending)
- Enhanced netlify.toml with security headers and asset caching

### Documentation

- Added NETLIFY-WORKOS-DEPLOYMENT.md with full deployment troubleshooting guide

### Changed

- Updated plugin authentication to use API Keys (`osk_*`) instead of WorkOS OAuth
- Both opencode-sync-plugin and claude-code-sync now use simple CLI login with Convex URL and API Key
- Plugins accept both `.convex.cloud` and `.convex.site` URL formats
- No browser authentication required for plugins

### Documentation

- Added PLUGIN-AUTH-PRD.md with full authentication specification
- Updated README.md with new plugin auth flow and architecture diagram
- Updated OPENCODE-PLUGIN.md with API Key authentication instructions
- Updated CLAUDE-CODE-PLUGIN.md with API Key authentication and CLI commands
- Updated SETUP.md Step 9 and data flow diagram for API Key auth
- Updated files.md and task.md with plugin auth references

## [0.1.0] - 2026-01-17

Initial release.

### Added

#### Backend (Convex)
- Database schema with tables: users, sessions, messages, parts, sessionEmbeddings, apiLogs
- WorkOS JWT authentication configuration
- Session sync endpoints: POST /sync/session, POST /sync/message, POST /sync/batch
- Public API endpoints: GET /api/sessions, GET /api/sessions/get, GET /api/search, GET /api/context, GET /api/export, GET /api/stats
- Health check endpoint: GET /health
- Full-text search on sessions and messages via Convex search indexes
- Semantic search using OpenAI text-embedding-3-small and Convex vector indexes
- Hybrid search combining full-text and semantic results with RRF scoring
- Session export in JSON, JSONL, and Markdown formats
- RAG context retrieval endpoint for LLM integration
- API key generation and authentication (osk_ prefix)
- API access logging

#### Frontend (React)
- WorkOS AuthKit integration for login/logout
- Protected routes with auth guards
- Dashboard page with session list and search
- Session viewer with message display and tool call rendering
- Sidebar with collapsible session list
- Public session sharing via /s/:slug routes
- Settings page with usage statistics
- API key generation and management UI
- Interactive API documentation page (/docs)
- Keyboard shortcuts: Cmd+K for search, Cmd+. for sidebar toggle
- Markdown export button in session viewer
- Copy share link functionality

#### Documentation
- README with quick start guide
- SETUP.md with full deployment instructions
- API.md with endpoint reference and SDK examples
- OPENCODE-PLUGIN.md with plugin usage guide
- PRD-FEATURES.md with future feature specifications

### Technical Details

- Convex backend with real-time subscriptions
- WorkOS AuthKit for enterprise authentication
- React 18 with Vite and Tailwind CSS
- Radix UI components for dialogs and dropdowns
- Lucide React for icons
- react-markdown for message rendering
- react-syntax-highlighter for code blocks

---

## Planned Features

See [PRD-FEATURES.md](docs/PRD-FEATURES.md), [SYNC-FOR-EVALS-PRD.md](docs/SYNC-FOR-EVALS-PRD.md), and [PLUGIN-AUTH-PRD.md](docs/PLUGIN-AUTH-PRD.md) for specifications.

### Plugins
- opencode-sync-plugin: **Published** at [npmjs.com/package/opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin)
- claude-code-sync: npm package for Claude Code (API Key auth) - coming soon
- Both plugins use simple CLI login with Convex URL and API Key

### Sync for Evals
- Mark sessions as eval-ready with notes and tags
- Export to DeepEval JSON, OpenAI Evals JSONL, Filesystem formats
- Copy-paste commands for running evals locally
- Support for Promptfoo model comparison

### Future Features
- RAG Context Library: Dedicated context search UI with saved searches
- Model Comparison Dashboard: Analytics comparing model performance
- Training Data Marketplace: Sell anonymized session data (deferred)
