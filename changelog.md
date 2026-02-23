# Changelog

All notable changes to OpenSync.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Batch deletion system with reactive UI progress tracking (fixes #30)
  - Paginated batch deletion to stay under Convex 4096 read limit
  - New internalAction orchestrateBatchDeletion coordinates table-by-table deletion
  - Separate batch mutations for parts, messages, sessions, embeddings, dailyWrapped, apiLogs
  - Deletion status tracking fields on users table (deletionStatus, deletionProgress, deletionError)
  - Real-time progress display in Settings Danger Zone showing counts per table
  - Success/error notifications with auto-clear after completion
  - Buttons disabled during deletion to prevent duplicate operations

### Fixed

- Fixed "Too many reads in a single function execution (limit: 4096)" error in deleteUserData
  - Replaced collect() calls with paginated take(200) batches
  - Each batch mutation handles one table type with proper indexing
  - Progress counters update in real-time via Convex reactivity

---

## Previous Unreleased

### Added

- Comprehensive Mintlify documentation rewrite with in-depth technical content
  - Created docs.json (replacing mint.json) with new Mintlify schema, navigation groups, and correct GitHub URLs
  - Created index.mdx landing page with CardGroup links to all documentation sections
  - Rewrote getting-started/hosted.mdx with supported tools table, step-by-step setup, what gets synced, privacy details
  - Rewrote getting-started/requirements.mdx with cloud vs local deployment, architecture overview, env var reference
  - Rewrote dashboard/overview.mdx with schema field mapping, filter details, real-time update explanation
  - Rewrote dashboard/sessions.mdx with full data model table, filtering, sorting, message parts, bulk actions
  - Rewrote dashboard/evals.mdx with eval workflow, labels, metadata fields, three export formats with examples
  - Rewrote dashboard/analytics.mdx with cost formula, model pricing table, token breakdown, trend charts
  - Rewrote dashboard/context.mdx with embedding internals, API examples, RAG use cases
  - Rewrote plugins/opencode-sync.mdx with setup steps, commands, syncing internals, schema mapping, troubleshooting
  - Rewrote plugins/claude-code-sync.mdx with setup, commands, session data mapping, troubleshooting
  - Rewrote plugins/codex-sync.mdx with supported models, pricing, troubleshooting
  - Rewrote plugins/cursor-sync.mdx with supported models, what gets synced, privacy notes
  - Rewrote api/endpoints.mdx with full sync/query/search/export/context endpoint reference and request/response examples
  - Rewrote search/fulltext.mdx with indexing details, syntax, ranking, comparison with semantic
  - Rewrote search/semantic.mdx with embedding model, storage schema, examples, requirements
  - Rewrote search/hybrid.mdx with scoring formula, RAG pipeline example, comparison table
  - Rewrote auth/workos.mdx with auth flow, user provisioning schema, redirect URIs, CORS, troubleshooting
  - Rewrote hosting/convex.mdx with schema tables, indexes, HTTP endpoints, monitoring, scaling
  - Fixed broken /docs#anchor links in README.md, ONE-CLICK-DEPLOY.md, and Login.tsx (mapped to new Mintlify paths)
  - Fixed /docs/fork/contribute link in FAQ
  - Added Pi and Factory Droid to supported tools in FAQ
- pi-opensync-plugin community plugin support (syncs Pi coding agent sessions)
  - Added "pi" to SourceType union with orange PI badge (#f97316)
  - Added Pi to Login page "Syncs with" section with SVG icon
  - Added Pi to Settings AI Agents with community status badge
  - Added Pi plugin card to Dashboard setup banner with install command
  - Added Pi source label mapping to Evals page
  - Updated README ecosystem table with pi-opensync-plugin links
- One-click deploy buttons for Vercel and Netlify in README
  - Deploy buttons deploy frontend only with explicit warning
  - Created ONE-CLICK-DEPLOY.md post-deploy checklist with step-by-step Convex/WorkOS/OpenAI setup
  - Created vercel.json with SPA rewrite rules for client-side routing
  - Created SetupIncompleteBanner component showing when VITE_CONVEX_URL or VITE_WORKOS_CLIENT_ID is missing
  - Banner links to GitHub checklist for completing setup
  - Updated install.md with quick link to one-click deploy option

### Fixed

- Fixed publicPlatformStats query causing production crash and black screen
  - Added null-safe token handling (s.totalTokens ?? 0) to prevent NaN values
  - Limited query to 1000 most recent sessions to avoid timeout on large datasets
  - Fixed Login page going black after initial render on opensync.dev
- Fixed homepage blank screen in production caused by auth loading blocking page render
  - Changed loading guard to only block during OAuth callback (when URL contains ?code=)
  - Anonymous visitors now see homepage content immediately without waiting for Convex auth
  - Platform Stats leaderboard re-enabled after confirming auth was the root cause
- Fixed duplicate "cursor" and "Cursor" entries in source filter dropdown
  - Normalized source values: "cursor" is now converted to "cursor-sync" on sync
  - Updated sessions.upsert and batchUpsert to normalize source on insert/update
  - Updated messages.upsert and batchUpsert to normalize source for auto-created sessions
  - Updated users.me query to normalize enabledAgents (converts "cursor" to "cursor-sync", deduplicates)
  - Updated users.updateEnabledAgents to normalize input before saving
  - Added "cursor" as alias in source.ts getSourceLabel and getSourceColorClass
  - Added "cursor" mapping in Dashboard AI_AGENTS_MAP for legacy data display

### Added

- Sessions pagination: loads 40 sessions initially with "Load more" button for 20 at a time
- Eval selection mode in Sessions view with checkbox toggle icon next to list view
  - Select individual sessions or "Select All" for bulk operations
  - "Mark" button to batch set eval-ready status on selected sessions
- cursor-opensync-plugin integration: sync Cursor IDE sessions to OpenSync
- Evals export now properly handles cursor-sync sessions
  - Added cursor-sync source filtering in listEvalSessions and previewExport stats
  - Added cursor-sync to filesystem export manifest sources
  - Export logic skips tool messages when finding user-assistant pairs for test cases
  - All four export formats (DeepEval, OpenAI, Promptfoo, Filesystem) work with Cursor sessions

### Fixed

- Fixed all dropdown filters and selects to use custom themed components matching dark/tan modes
  - Dashboard EvalsView: source and tag filters now use CompactDropdown
  - Dashboard AnalyticsView: min sessions and min tokens filters now use CompactDropdown
  - Charts ConsumptionBreakdown (Usage Overview): date range, project, and model filters now use ChartDropdown
  - All dropdowns have consistent styling with proper hover states, click-outside-to-close, and chevron rotation
- Added "tool" to message role validator to support tool call messages from cursor-sync-plugin
  - Added cursor-sync to SourceType union with "CR" badge label
  - Added cursor-sync to AI Coding Agents in Settings (status: supported)
  - Added cursor-sync-plugin to Plugin Setup and Quick Setup sections
  - Added Cursor to homepage "Syncs with" section (removed "coming soon" badge)
  - Added cursor-sync-plugin to homepage "Getting started" section
  - Added CR source badge with violet theme color
  - Added Cursor Plugin documentation section with installation, configuration, and commands
  - Added cursor-sync-plugin to README ecosystem table and install section
  - Added cursor-sync to AI_AGENTS_MAP in Evals.tsx for source filter display

### Changed

- Redesigned Evals UI for CRM-style list view (both standalone page and Dashboard tab)
  - Hidden scrollbars for cleaner look
  - Flex layout instead of table (no horizontal scrolling)
  - Truncated session names (35-40 chars) and model names (28 chars)
  - Shows 50 items initially with "Load more" button for pagination
  - Responsive columns (model hidden on mobile)
  - Compact filters bar with inline controls
  - Wider Model column (w-44) for better readability

### Added

- Comprehensive Plugin Development Guide (docs/PLUGIN-DEVELOPMENT-GUIDE.md)
  - API endpoints reference with request/response examples
  - Database schema documentation (sessions, messages, parts tables)
  - CLI commands reference with all standard commands
  - TypeScript code examples (API client, session parser, cost calculation, CLI implementation)
  - README and package.json templates for new plugins
  - Testing checklist for plugin verification
  - Architecture diagrams and data flow documentation

- Enhanced Eval Export Features per PRD
  - New Promptfoo JSONL export format for Promptfoo evaluations
  - Multi-turn export modes: per_turn (default), full conversation, final turn only
  - Export preview modal showing session/test case counts and validation warnings
  - Enhanced filtering: date range, model, eval status, minimum tokens
  - Annotation system with eval status (golden/correct/incorrect/needs_review)
  - Bulk status updates for selected sessions
  - New API endpoint GET /api/export/evals with all filter params
  - Code blocks only filter option
  - Enhanced DeepEval format with full PRD-compliant metadata
- New schema fields for eval annotations
  - evalStatus: golden, correct, incorrect, needs_review
  - expectedOutput: ground truth for comparison
  - detectedLanguage: auto-detected programming language
  - New index: by_user_eval_status

- New public Updates page (/updates) showing GitHub activity from opensync repository
  - Two-column layout: open issues (left), discussions (right)
  - Client-side GitHub API fetching (no auth required, 60 req/hour limit)
  - Shows issue labels, author avatars, timestamps, comment counts
  - Fallback card for discussions linking to GitHub (REST API requires auth)
  - Refresh button to manually refetch data
  - Dark/tan theme support
  - No login required (public page like /docs)
- Updates navigation link in Dashboard header (Bell icon)
  - Desktop: text link between Context and Docs
  - Mobile: icon button in right nav
- Updates link added to Docs page header and sidebar (Resources section)
- Updates link added to Login page footer (next to Terms/Privacy)
- Removed duplicate search from Docs sidebar (main header search only)

### Changed

- Updated README tagline to "Dashboards for OpenCode, Claude Code, Codex, Factory Droid and more"
- Commented out Stats page (/stats) to reduce Convex database reads
  - Route still exists but shows placeholder message
  - Original code preserved in block comment for future re-enabling
  - No longer reads from api.analytics.publicMessageCount or publicMessageGrowth
- Simplified stats page UI
  - Removed Play/Reset animation controls from growth chart (static display only)
  - Removed milestone progress bar and "% to target" from message counter
  - Removed "Target: 500k" from growth chart footer
  - Removed "9am PT snapshot" label (refresh button available for manual updates)
  - Stats can be refreshed on demand (no rate limit on read-only queries)

### Fixed

- Fixed mobile scrolling issues across Dashboard
  - Sessions list now scrolls properly on mobile devices
  - Session detail panel content scrolls correctly on mobile
  - Wrapped view download button visible on mobile (page scrolls to show controls)
  - Added `shrink-0` to header, footer, filters bar, and sort headers to maintain fixed heights in flex layout
  - Added `min-h-0` to flex containers to allow proper overflow scrolling
  - Added `touch-pan-y` class for touch scrolling on mobile
  - Added CSS `100dvh` (dynamic viewport height) fallback for mobile browser compatibility
  - Added `-webkit-overflow-scrolling: touch` for smooth iOS scrolling
  - No changes to desktop UI or features
- Hardened public stats page rendering
  - Added a local error boundary so stats failures do not blank the app
  - Guarded growth chart against invalid data points
- Fixed stats page exceeding 16MB Convex read limit
  - Changed publicMessageCount and publicMessageGrowth queries to use async iteration instead of collect
  - Added temporary refresh button to stats header (to be removed later)

### Added

- New public /stats page with platform statistics (isolated from homepage)
  - Message milestone counter with real-time document count
  - Dynamic milestone targets (500k, 600k, etc.) that auto-update as counts grow
  - Progress bar showing percentage towards next milestone
  - Animated growth chart with SVG line showing cumulative message growth
  - Play/Reset animation controls (no auto-play)
  - Dynamic Y-axis scaling based on actual data
  - X-axis date labels (first, middle, last dates)
  - Dark/tan theme support with theme toggle
  - Back link to homepage
- New Convex queries in analytics.ts:
  - publicMessageCount: total message documents count (no auth required)
  - publicMessageGrowth: daily message counts with cumulative totals (no auth required)

### Changed

- Moved stats components from Login page to dedicated /stats page
  - Prevents potential rendering issues from impacting homepage
  - Stats accessible via /stats route (public, no auth required)
- Stats page data now loads as a daily snapshot at 9am PT (no realtime updates)
- codex-sync plugin integration: sync OpenAI Codex CLI sessions to OpenSync
  - Added codex-sync to README Ecosystem table and Quick Start section
  - Added Codex CLI to AI Coding Agents in Settings (status: supported)
  - Added codex-sync to Plugin Setup and Quick Setup sections
  - Added Codex CLI icon to homepage "Syncs with" section
  - Added codex-sync to homepage "Getting started" package links
  - Added CX source badge with purple theme color
  - Added Codex CLI Plugin documentation section with installation, configuration, and commands
  - Updated analytics provider inference to recognize Codex models
- Created docs/ADD-NEW-PLUGIN-TEMPLATE.md: reusable prompt template for adding future plugins
- Docs page updates for codex-sync plugin:
  - Added codex-sync npm link to sidebar
  - Added Codex CLI card to hosted version "Install Plugins" section
  - Added codex-sync login to "Login and Sync" section
  - Added Codex CLI card to Quick Start "Install a Plugin" section
  - Updated Sessions View description to include CX badge
  - Updated markdown export content with codex-sync commands

### Fixed

- Fixed deleteAllData mutation failing with Server Error (GitHub #17)
  - Added missing messageEmbeddings table deletion (was not being cleaned up)
  - Added missing dailyWrapped table deletion (was not being cleaned up)
  - Converted sequential deletes to parallel using Promise.all (prevents timeout)
  - Updated return type from `embeddings` to `sessionEmbeddings` plus new `messageEmbeddings` and `dailyWrapped` counts

### Changed

- Daily Sync Wrapped images now export at 9:16 portrait (675x1200 pixels) for social media compatibility
- Increased font sizes across all 10 wrapped templates for better readability
- Removed Twitter/X and LinkedIn share buttons from Wrapped view (download only)
- Updated wrapped templates with vertical portrait layouts and large typography
- Commented out Rotate Design button and design info for production (code preserved for testing)

### Fixed

- Fixed session panel flashing when switching between sessions in Dashboard
  - Added lastValidSessionRef to cache session data during transitions
  - Changed activeSession fallback to use cached ref when queries are loading
  - Replaced full-screen loading overlay with subtle corner spinner
  - Content stays visible until new session data loads (no flash)
- Fixed wrapped image export capturing extra space by using hidden off-screen container (no CSS transforms)
- Fixed Template 5 (vinyl): removed center hole, enlarged circle to 420px, increased all text sizes
- Fixed Template 6 (orange gradient): enlarged all text to 6xl for stats, 3xl for labels
- Fixed Template 9 (color shapes): moved decorative shapes to right side to prevent text overlap
- Replaced cost with sessions count on all 10 wrapped templates (more shareable, less sensitive data)
- Added sessionCount field to wrapped stats (optional for backward compatibility)

## [1.2.0] - 2026-01-22

### Added

- Daily Sync Wrapped feature: AI-generated visualization of past 24-hour coding activity
  - New Wrapped tab in Dashboard (5th view mode alongside Overview, Sessions, Evals, Analytics)
  - 10 CSS template designs inspired by modern visual styles (minimal dark, gradient noise, geometric, tech cards, bold typography, vinyl record, orange gradient, dark minimal, blue landscape, color shapes)
  - Google Imagen API integration for AI-generated wrapped images
  - CSS fallback templates when AI generation unavailable
  - 24-hour countdown timer showing time until next generation
  - Download as PNG button using html2canvas
  - Share to Twitter/X and LinkedIn buttons
  - Rotate Design button for testing different template styles
  - Daily cron job at 9:30 AM PT generates wrapped for all active users
  - Automatic cleanup of expired wrapped records every 6 hours
- New convex/wrapped.ts with queries (getTodayWrapped, getWrappedStats, get24HourStats, getCountdownInfo), mutations (createWrapped, deleteExpired), and actions (generateWrappedImage, generateForUser, generateAllWrapped)
- New convex/crons.ts for scheduled wrapped generation and cleanup
- New dailyWrapped table in schema with indexes (by_user_date, by_user, by_expires)
- html2canvas dependency for client-side PNG export

### Changed

- Dashboard ViewMode type now includes "wrapped" as 5th option
- Dashboard view toggles updated to include Wrapped tab

## [1.1.0] - 2025-01-21

### Added

- Full Factory Droid (FD) support as third sync source alongside OpenCode and Claude Code
- Source utilities file (src/lib/source.ts) with getSourceLabel and getSourceColorClass for consistent badge rendering
- Factory Droid plugin card in Dashboard setup banner (3-column grid with OC, CC, FD)
- Factory Droid stat card on Evals page showing FD session count
- droid-sync link in Settings Plugin Setup section with GitHub and npm links
- factoryDroid stats tracking in convex/evals.ts listEvalSessions query
- Content normalization helpers (getPartTextContent, getToolName) to handle different plugin formats
- tool-result part type rendering to Dashboard MessageBubble

### Fixed

- Claude Code assistant output not displaying in Dashboard session viewer (fixes #7)
- MessageBubble component now properly extracts text from object formats (`{ text: "..." }` or `{ content: "..." }`)
- textContent fallback when parts have no displayable content
- Empty assistant messages on sessions with tool-calling chains (fixes #8)
- hasDisplayableParts/hasPartsContent now checks tool-call and tool-result content, not just type existence
- Applied fix across all 4 message rendering components (Dashboard, SessionViewer, Context, PublicSession)

### Changed

- Dashboard source badges now use centralized source utilities (FD shows orange badges)
- Context page source badges refactored to use source utilities
- Evals page SourceBadge component uses source utilities for consistent theming
- Settings API key description updated to mention droid-sync alongside other plugins

## [1.0.0] - 2025-01-21

### Added

- droid-sync community plugin to README Ecosystem (syncs Factory Droid sessions)
- AI Coding Agents settings section with two-column layout on Settings page
  - Plugin Setup on left column (existing)
  - AI Coding Agents on right column (new)
  - Checkbox list of 12 CLI tools: OpenCode, Claude Code, Factory Droid, Cursor, Codex CLI, Continue, Amp, Aider, Goose, Mentat, Cline, Kilo Code
  - Status badges: supported (green), community (blue), planned (amber), TBD (gray)
  - OpenCode and Claude Code enabled by default
  - Settings persist in database via enabledAgents field on users table
- Source filter dropdown now respects user's enabled agents
  - Dashboard and Evals pages filter dropdown options based on Settings preferences
  - Backward compatible: defaults to OpenCode and Claude Code for existing users
  - Disabling an agent hides it from dropdown but doesn't affect data
- "Syncs with" section on Login page showing supported CLI tools (OpenCode, Claude Code, Droid, Cursor)
  - Theme-aware icons that switch between dark/light variants
  - Cursor shown with "coming soon" badge
  - Icons: opencode-dark.svg, opencode-light.svg, claude.svg, factory-droid.svg added to public folder
- Reusable prompt template for adding CLI/npm packages to homepage (docs/add-package-to-home-prompt.md)
- GitHub Releases automation: changelog.md updates now auto-create GitHub Releases via GitHub Actions
- changelog.mdc cursor rule for consistent changelog format compatible with release automation
- Terms of Service and Privacy Policy modal links in homepage footer (left of theme switcher)
- Legal section in Settings Profile tab with Terms and Privacy buttons
- LegalModal component with dark mode styling, markdown rendering, ESC/X to close
- Full Privacy Policy and Terms of Service content embedded in app
- Custom themed source filter dropdown in Dashboard header (replaces native select)
  - Matches dark mode (zinc-900/zinc-800) and tan mode (cream/tan) design system
  - Click outside to close, Escape key support, chevron rotation animation
  - Proper hover and active states for both themes
- Docs page search with instant typeahead results and keyboard navigation
- Search indexes all sections, subsections, and keywords for quick lookup
- Cmd/Ctrl+K keyboard shortcut to focus search on Docs page
- Search navigates directly to section via hash anchor
- Search available in header (desktop) and sidebar (mobile)
- Real-time Platform Stats leaderboard on Login/homepage with Top Models and Top CLI boxes
- Top CLI shows sources (OpenCode, Claude Code, Cursor, Droid, Codex, Amp) sorted by session count
- No loading spinner (Convex real-time updates appear instantly)
- Public platform stats API query (publicPlatformStats, no auth required) for aggregate platform metrics
- Discord community icon in Login page footer (links to convex.dev/community)
- Support icon in Login page footer (links to GitHub issues page)
- Discussions icon in Login page footer (links to GitHub Discussions)
- Slide-over panel for Context search results (click result to preview session without navigating away)
- Session details panel with full message thread, syntax highlighting, copy/download actions
- Message highlighting when clicking message search results (scrolls to and highlights the specific message)
- "Open in Dashboard" button in slide-over to navigate to full dashboard view with session pre-selected
- Deep linking support in Dashboard: reads ?session= URL param to auto-select session and switch to Sessions tab
- Cmd/Ctrl+K keyboard shortcut on Dashboard navigates to Context search page
- Page-specific theme defaults configuration (PAGE_THEME_DEFAULTS) in theme.tsx
- usePageTheme hook to apply different default themes per page (login: dark, dashboard: tan)
- PageType type for type-safe page identifiers (login, dashboard, docs, settings, default)
- getPageDefaultTheme helper function for retrieving page-specific defaults
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

### Changed

- Homepage (/) is now public: logged-in users see "Go to Dashboard" button instead of auto-redirect
- Logged-in users can visit homepage while staying authenticated
- OAuth callback now redirects to /dashboard instead of / after sign-in
- Removed auto-redirect from LoginPage when authenticated
- Settings back link now navigates to /dashboard instead of homepage
- Removed user email from dropdown menus across all pages (Dashboard, Context, Evals, Header) for cleaner UX
- Removed search bar from Dashboard header, added search icon to Context link for cleaner UX
- Search functionality consolidated into dedicated Context page (/context)
- Login page now supports tan mode theme with icon-only theme switcher in bottom right footer
- Login page mockup updated: view tabs (overview/sessions/evals/analytics), 4 stats (sessions/tokens/cost/duration), OC/CC source badges on sessions
- Login page tagline now mentions eval datasets: "Build eval datasets across projects"
- Login page feature list updated: added Tag feature for eval organization, improved keyword colors for better contrast in dark mode
- Trust message and plugin link text improved for readability in dark mode (zinc-400 to zinc-100)
- Docs page sidebar and main content now use hidden scrollbar for cleaner UI
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

### Fixed

- Fixed production logout on page refresh by setting AuthKit devMode to true (avoids third-party cookie blocking)
- Simplified ProtectedRoute to use Convex auth as single source of truth
- Added 500ms spinner delay to avoid loading flash on fast auth checks
- Added 5-second timeout to handle Safari infinite loading issue
- Fixed write conflicts in messages:upsert, sessions:upsert, and embeddings:store mutations
- Added 5-10 second dedup windows to prevent rapid updates causing OCC conflicts
- Refactored messages:upsert to combine session patches into single write operation
- Added Promise.all for parallel parts deletion/insertion to reduce conflict windows
- Created batch mutations (batchUpsert) for sessions and messages to reduce /sync/batch conflicts
- Updated embeddings:store to use replace pattern instead of delete+insert
- Added idempotency checks with early returns when no meaningful changes detected
- Fixed provider display showing "unknown" for antigravity-oauth and anthropic-oauth sessions (fixes #2)
- Added OAuth provider normalization to inferProvider helper: antigravity-oauth maps to "google" (Google Antigravity platform), anthropic-oauth maps to "anthropic"
- Strips -oauth suffix from other OAuth provider names for cleaner display
- Applied provider inference consistently in providerStats, sessionsWithDetails query, and filter logic
- Fixed auth session persistence: users no longer need to sign in again on page refresh (fixes #1)
- Added dedicated CallbackHandler component for OAuth callback processing with 10s timeout
- Added return-to URL preservation so users are redirected to their intended route after sign-in
- Added devMode config to AuthKitProvider for proper production session handling
- Improved callback flow: waits for both WorkOS and Convex auth to complete before redirecting
- Added /dashboard route as alias to root dashboard
- Added /profile route that shows Settings page with profile tab auto-selected and expanded
- Fixed tan mode text contrast in Context search slide-over panel (explicit dark text colors for readability)
- Escape key and backdrop click to close slide-over panel
- Watch the demo link on Login page CTA section (links to X demo video)
- 100% local deployment instructions in OPENSYNC-SETUP.md docs (Convex local backend with Docker)
- 100% local deployment section in Docs page (/docs#requirements-local) with step-by-step instructions
- Links to opencode.ai and claude.ai in Docs page hero and plugin sections
- Trust message on Login page now mentions cloud version and links to local docs (/docs#requirements)
- install.md file for AI agent installation following installmd.org spec (self-hosting setup instructions)
- Collapsible Profile section in Settings page (collapsed by default for privacy during demos/recordings)
- Theme toggle (dark/tan mode) on public session page (/s/:slug)
- Mobile-optimized Dashboard: responsive header, filter bars, session rows with stacked layout on small screens
- Mobile Context icon in header nav (visible only on mobile for quick access to search)
- Fixed Getting Started section on Login page not showing on mobile (was hidden with dashboard preview)
- Fixed setup banner flash on dashboard refresh: banner now waits for data to load before showing
- Fixed delete account not removing Convex data: changed deletion order to delete Convex data first, then WorkOS
- Fixed delete account redirecting to WorkOS logout URL instead of homepage: replaced signOut() with direct redirect
- Fixed public sessions not showing all data: added content normalization helpers for multi-plugin support
- Fixed public sessions missing textContent fallback when parts array has no displayable content
- Added tool-result part type rendering to public sessions (was missing)
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

## [0.1.0] - 2025-01-17

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
- API key generation and authentication (osk\_ prefix)
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
