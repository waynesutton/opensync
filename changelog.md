# Changelog

All notable changes to OpenSync.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed

- Fixed delete account not removing Convex data: changed deletion order to delete Convex data first, then WorkOS
- Fixed delete account redirecting to WorkOS logout URL instead of homepage: replaced signOut() with direct redirect

### Changed

- Removed search bar from Dashboard header, added search icon to Context link for cleaner UX
- Search functionality consolidated into dedicated Context page (/context)
- Login page now supports tan mode theme with icon-only theme switcher in bottom right footer
- Login page mockup updated: view tabs (overview/sessions/evals/analytics), 4 stats (sessions/tokens/cost/duration), OC/CC source badges on sessions
- Login page tagline now mentions eval datasets: "Build eval datasets across projects"
- Login page feature list updated: added Tag feature for eval organization, improved keyword colors for better contrast in dark mode
- Trust message and plugin link text improved for readability in dark mode (zinc-400 to zinc-100)
- Docs page sidebar and main content now use hidden scrollbar for cleaner UI

### Added

- Comprehensive documentation page with Mintlify-style UI
- Left sidebar navigation with collapsible sections and anchor tags
- Right table of contents for on-page navigation
- Copy as Markdown button for each section
- View as Markdown mode for entire page
- llms.txt file for AI assistants with project overview and API reference
- "Use Hosted Version" section as first docs section with features from Login page (Sync, Search, Private, Export, Delete, API)
- Plugin installation and login instructions for hosted opensync.dev
- Documentation sections: Use Hosted Version, Requirements, Quick Start, Dashboard Features, OpenCode Plugin, Claude Code Plugin, API Reference, Search Types, Authentication, Hosting, Fork Guide, Troubleshooting, FAQ
- Mobile responsive design with slide-out sidebar
- Theme support for both dark and tan modes

- GitHub icon link in Login page footer (bottom left, links to opensync repo)

- Setup banner on Dashboard Overview for new users with no synced data
- Banner links to opencode-sync-plugin and claude-code-sync repos with npm install commands
- Dismissible banner with X button, state persists in localStorage
- Theme switcher on Login page footer (Sun/Moon icon, no text labels)

- Delete synced data option in Settings (removes all sessions, messages, embeddings while keeping account)
- Delete account option in Settings (calls WorkOS API to delete user, removes all Convex data)
- Danger Zone section in Profile tab with confirmation modals for destructive actions
- Trust message on login page about data control and privacy
- Getting started section on login page with plugin install links (claude-code-sync, opencode-sync-plugin)
- Dedicated context search page (/context) with full-text search for sessions and messages
- Paginated search queries (searchSessionsPaginated, searchMessagesPaginated) with 20 results per page
- Context search uses Convex built-in full-text search (no OpenAI API key required)
- Search mode toggle (Sessions/Messages) with keyboard shortcut (Cmd/Ctrl+K)
- Search result highlighting with match context extraction
- Context link added to Dashboard header for quick access
- Evals tab in Dashboard with eval-ready session list, stats, and export modal
- Evals backend (convex/evals.ts): setEvalReady, listEvalSessions, getEvalTags, generateEvalExport
- Export formats for evals: DeepEval JSON, OpenAI Evals JSONL, Filesystem plain text
- evalReady, reviewedAt, evalNotes, evalTags fields added to sessions schema
- Eval toggle button in session detail panel to mark sessions as eval-ready
- Message-level embeddings table (messageEmbeddings) with vector index for finer-grained retrieval
- semanticSearchMessages and hybridSearchMessages actions in search.ts
- Batch embedding generation for messages (batchGenerateForSession, batchGenerateMessagesForUser)
- Session sync timeout in ProtectedRoute (5s max) with redirect to login on failure
- Source field added to sessions schema to distinguish OpenCode vs Claude Code sessions
- Source dropdown filter in dashboard header (All Sources / OpenCode / Claude Code)
- All analytics queries now support source filtering for multi-plugin support
- Backend support for claude-code-sync plugin (same API key authentication)
- Source badges on session list items (CC for Claude Code, OC for OpenCode)
- Source badge in session detail header (full "Claude Code" or "OpenCode" label)
- sourceStats query in analytics.ts for session distribution by source
- messages.upsert now accepts source parameter for auto-created sessions
- CSV export now includes Source column (opencode/claude-code) and exports all sessions regardless of filter
- ConsumptionBreakdown component with stacked bar chart, credit usage bar, and usage table
- StackedBarChart component for multi-segment bar visualization with tooltips
- UsageCreditBar component showing included credit vs on-demand charges
- Dashboard footer with GitHub repo link and "powered by convex" attribution
- CSV export for all user session data (exportAllDataCSV query)
- Export CSV button in sessions view next to list/timeline toggle
- Tokens/Cost chart type toggle in Consumption Breakdown
- Prompt/Completion token breakdown in usage table
- ConfirmModal component for themed confirmation dialogs (replaces browser confirm())
- Session delete confirmation modal in sessions view
- Date range selector in Usage Overview (7, 14, 30, 60, 90 days options)
- Daily/Weekly/Monthly view toggle for consumption breakdown
- Cumulative mode toggle for usage visualization
- Project and model filters in consumption breakdown
- Privacy messaging on login page ("Private - your data stays in your account")
- Netlify logo added to login page footer alongside Convex and WorkOS logos
- Close icon (X) button to session detail panel header for desktop users
- Hidden scrollbar CSS utility class for cleaner UI while maintaining scroll functionality
- Timeline view for sessions (DAW-style track visualization grouped by project)
- Horizontal drag scrolling for sessions list and timeline view
- Sessions view mode toggle (list/timeline) in the filter bar
- Enhanced Analytics tab with efficiency metrics (tokens/message, cost per 1K tokens, prompt/completion ratio)
- Extended project analytics table with messages, prompt tokens, completion tokens, and duration columns
- New stat cards with icons for token breakdown (prompt, completion, total, messages, duration)
- Projects Overview filtering (search, min sessions, min tokens) with sortable columns

### Fixed

- Fixed Claude Code session content rendering with empty blocks
- Added content normalization helpers to handle different part formats (string vs `{ text: "..." }` vs `{ content: "..." }`)
- SessionViewer now properly extracts text content from all plugin formats
- Added fallback to `message.textContent` when parts have no displayable content
- Updated markdown export, API export, and context functions with same content normalization
- Fixed searchable text extraction in message upsert for better full-text search on Claude Code sessions
- Enhanced embedding generation to use parts content as fallback when textContent is empty
- Fixed session persistence on page refresh with improved token refresh logic and retry mechanism
- Auth sync now retries up to 3 times with proper state management to prevent infinite loops
- Added 5-second timeout on session sync in ProtectedRoute to prevent stuck loading states
- Removed devMode dependency for session persistence (works in both dev and production)
- Fixed Tokens/Cost/Duration table header alignment in sessions view
- Fixed markdown download with sanitized filenames and date timestamps
- Added loading state to download button when markdown is being fetched
- Fixed markdown export to include message content from parts and textContent fallback
- Fixed Consumption Breakdown filters to actually filter model/project stats
- Fixed StackedBarChart height rendering with proper flex layout and minHeight values

### Changed

- Overview layout: Usage Overview section moved above Recent Sessions, Token Usage and Model Distribution moved to bottom
- Removed EnvStatus debug component from login page footer (cleaner production UI)
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
- Updated plugin authentication to use API Keys (`osk_*`) instead of WorkOS OAuth
- Both opencode-sync-plugin and claude-code-sync now use simple CLI login with Convex URL and API Key
- Plugins accept both `.convex.cloud` and `.convex.site` URL formats
- No browser authentication required for plugins

### Fixed (Build and Deployment)

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
- Added WORKOS-AUTH.md with WorkOS AuthKit integration architecture and security model
- Added PLUGIN-AUTH-PRD.md with full authentication specification
- Updated README.md with new plugin auth flow and architecture diagram
- Updated OPENCODE-PLUGIN.md with API Key authentication instructions
- Updated CLAUDE-CODE-PLUGIN.md with API Key authentication and CLI commands
- Updated SETUP.md Step 9 and data flow diagram for API Key auth

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
- claude-code-sync: **Published** at [npmjs.com/package/claude-code-sync](https://www.npmjs.com/package/claude-code-sync)
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
