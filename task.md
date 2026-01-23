# Tasks

Current development tasks and feature backlog for OpenSync.

OpenSync supports two AI coding tools: **OpenCode** and **Claude Code**.

## Active Tasks

- [ ] (add next task here)

## Recently Completed (Docs Page codex-sync Updates)

- [x] Updated Docs.tsx with codex-sync plugin documentation
  - Added codex-sync npm link to sidebar alongside opencode-sync-plugin and claude-code-sync
  - Added Codex CLI card (purple CX badge) to hosted version "Install Plugins" section
  - Added codex-sync login command to "Login and Sync" section
  - Added Codex CLI card to Quick Start "Install a Plugin" section
  - Updated Sessions View description to include CX (Codex CLI) badge
  - Updated markdown content with codex-sync install and login commands
  - Updated markdown export string to include codex-sync
  - Build passes netlify build check

## Recently Completed (Codex CLI Plugin Integration)

- [x] codex-sync plugin integration for syncing OpenAI Codex CLI sessions
  - Added codex-sync to README Ecosystem table and Quick Start section
  - Updated Codex CLI in AI_AGENTS to status: supported with npm URL
  - Added codex-sync to Plugin Setup section with npm/GitHub links
  - Added codex-sync to Quick Setup install commands
  - Added Codex CLI icon (OpenAI logo) to homepage "Syncs with" section
  - Added codex-sync package link to homepage "Getting started" section
  - Added codex-cli to getSourceDisplayName helper
  - Added codex-cli to SourceType union in source.ts
  - Added CX short label and Codex CLI full label to getSourceLabel
  - Added purple theme colors to getSourceColorClass for codex-cli
  - Added Codex CLI Plugin search index entries to Docs.tsx
  - Added Codex CLI Plugin navigation entry to Docs sidebar
  - Added full Codex CLI Plugin documentation section
  - Added codex-sync to Resources markdown export
  - Updated inferProvider to recognize Codex models as openai
- [x] Created docs/ADD-NEW-PLUGIN-TEMPLATE.md for adding future plugins
  - Comprehensive checklist with 10 file locations
  - Testing checklist for verification
  - Color and status options reference

## Recently Completed (Delete All Data Fix - Issue #17)

- [x] Fixed deleteAllData mutation failing with Server Error (GitHub #17)
  - Added missing messageEmbeddings table deletion
  - Added missing dailyWrapped table deletion
  - Converted sequential deletes to parallel using Promise.all
  - Updated return validators to include sessionEmbeddings, messageEmbeddings, dailyWrapped
  - Renamed `embeddings` to `sessionEmbeddings` in return type for clarity

## Recently Completed (Session Transition Fix)

- [x] Fixed session panel flashing when switching between sessions in Dashboard
  - Added lastValidSessionRef to cache last valid session data
  - Updated activeSession logic: selectedSession || displaySession || lastValidSessionRef.current
  - Replaced full-screen loading overlay with subtle corner spinner (no content blocking)
  - Added optional chaining for safer property access during transitions
  - Content stays visible during transitions (Convex real-time without flash)

## Recently Completed (Wrapped Image Fixes)

- [x] Fixed Daily Sync Wrapped image dimensions for social media
  - Changed from 1080x1920 to 675x1200 (9:16 portrait)
  - Updated html2canvas export settings for exact pixel dimensions
  - Updated preview container with correct aspect ratio (9/16)
- [x] Increased font sizes across all 10 wrapped templates
  - Headlines: text-5xl to text-8xl
  - Stats numbers: text-4xl to text-7xl  
  - Labels: text-lg to text-2xl
  - All templates redesigned for vertical portrait layout
- [x] Removed share buttons from Wrapped view
  - Removed Twitter/X share button
  - Removed LinkedIn share button
  - Kept download PNG and rotate design buttons only
- [x] Fixed wrapped image export capturing extra gray space
  - Created hidden off-screen export container (position: absolute, left: -9999px)
  - html2canvas now captures clean container without CSS transforms
  - Preview uses scaled version, export uses full-size hidden container
- [x] Fixed Template 5 (vinyl record style)
  - Removed center hole/dot completely
  - Enlarged circle from 288px to 420px diameter
  - Increased all text sizes (8xl tokens, 3xl labels)
  - All content now fits inside the circle
- [x] Fixed Template 6 (orange gradient)
  - Enlarged stat numbers from 4xl to 6xl
  - Enlarged labels from 2xl to 3xl
  - Increased padding and spacing throughout
- [x] Fixed Template 9 (color shapes)
  - Moved all decorative shapes (triangle, square, diamond, circle) to right side
  - Content left-aligned with max-w-85% to prevent overlap
  - Increased headline sizes to 7xl
- [x] Replaced cost with sessions count on all 10 wrapped templates
  - Cost is sensitive/personal info people may not want to share
  - Sessions count is more shareable and shows engagement
  - Added sessionCount to wrappedStatsValidator (optional for backward compatibility)
  - Updated get24HourStats and getWrappedStats to return recentSessions.length
- [x] Commented out Rotate Design button and design info for production
  - Removed "Design X of 10" text from wrapped view
  - Removed Rotate Design button from action buttons
  - Code preserved with comments for easy re-enabling during testing
  - Current wrapped image still displays based on date-based design index

## Recently Completed (Daily Sync Wrapped - v1.2.0)

- [x] Daily Sync Wrapped feature for visualizing past 24-hour coding activity
  - Added Wrapped tab in Dashboard (5th view mode alongside Overview, Sessions, Evals, Analytics)
  - Created 10 CSS template designs inspired by modern visual styles
  - Google Imagen API integration for AI-generated wrapped images (requires GOOGLE_AI_API_KEY)
  - CSS fallback templates when AI generation unavailable or no API key
  - 24-hour countdown timer showing time until next generation (9:30 AM PT daily)
  - Download as PNG button using html2canvas library
  - Share to Twitter/X and LinkedIn buttons with pre-filled text
  - Rotate Design test button for cycling through all 10 templates (marked for removal)
  - Dark/tan theme support using useTheme and getThemeClasses
  - User-specific data only (queries filter by authenticated user ID)
  - No data state shows "No Activity Yet" message with countdown
  - New Convex files: wrapped.ts, wrappedActions.ts, crons.ts
  - New React components: WrappedView.tsx, WrappedTemplates.tsx
  - New dailyWrapped table in schema with indexes (by_user_date, by_user, by_expires)
  - Daily cron job at 9:30 AM PT generates wrapped for all active users
  - Automatic cleanup of expired wrapped records every 6 hours

## Recently Completed (Empty Sessions Fix - Issue #7, #8)

- [x] Fixed Claude Code assistant output not displaying in Dashboard (GitHub #7)
  - MessageBubble component was rendering object content directly instead of extracting text
  - Added getPartTextContent helper to extract text from string, `{ text: "..." }`, or `{ content: "..." }` formats
  - Added getToolName helper to extract tool names from `name` or `toolName` properties
  - Added hasDisplayableParts check to detect if parts have actual content
  - Added textContent fallback when parts are empty
  - Added tool-result part type rendering (was missing from MessageBubble)

- [x] Fixed empty assistant messages on sessions with tool-calling chains (GitHub #8)
  - hasDisplayableParts/hasPartsContent was only checking part TYPE, not content
  - Now validates tool-call parts have extractable name (content.name or content.toolName)
  - Now validates tool-result parts have extractable result (content.result, content.output, or content itself)
  - Applied fix to all 4 message rendering components: Dashboard.tsx, SessionViewer.tsx, Context.tsx, PublicSession.tsx
  - Created docs/fix-blank-sessions.md tracking document

## Recently Completed (Factory Droid Full Integration)

- [x] Full Factory Droid support as third sync source
  - Created src/lib/source.ts with getSourceLabel and getSourceColorClass utilities
  - Added factoryDroid stats tracking in convex/evals.ts (bySource.factoryDroid)
  - Updated Context.tsx to use source utilities for badges
  - Added Factory Droid plugin card in Dashboard setup banner (3-column grid)
  - Refactored Dashboard source badges to use utilities (FD shows orange)
  - Added Factory Droid stat card on Evals page
  - Added droid-sync link in Settings Plugin Setup section
  - Updated API key description to mention droid-sync

## Recently Completed (Ecosystem)

- [x] Added droid-sync community plugin to README Ecosystem table
  - Links to GitHub repo (yemyat/droid-sync-plugin) and npm package (droid-sync)
  - Marked as community-built plugin for Factory Droid sessions

## Recently Completed (AI Coding Agents Settings)

- [x] AI Coding Agents section in Settings page
  - Two-column layout: Plugin Setup (left) + AI Coding Agents (right)
  - Added enabledAgents field to users table in schema
  - Added updateEnabledAgents mutation
  - Updated me query to return enabledAgents
  - Checkbox list with 12 CLI tools grouped by status (supported, community, planned, TBD)
  - Status badges with theme-aware colors
  - OpenCode and Claude Code enabled by default for backward compatibility
- [x] Source filter dropdown respects user's enabled agents
  - Dashboard SourceDropdown filters options based on enabledAgents
  - Evals page source filter respects enabledAgents
  - Defaults to ["opencode", "claude-code"] for existing users without preference

## Recently Completed (Syncs With Section)

- [x] Added "Syncs with" section on Login page above Getting Started
  - OpenCode icon with dark/light theme switching
  - Claude Code icon (inline SVG with currentColor)
  - Factory Droid icon (inline SVG with currentColor)
  - Cursor icon with "coming soon" badge on top for alignment
  - All icons adapt to dark/tan theme

## Recently Completed (Prompt Templates)

- [x] Added reusable prompt template for adding CLI/npm packages to homepage Getting Started section
  - Template file: docs/add-package-to-home-prompt.md
  - Supports badge types: npm (default), community, cli
  - Pattern follows existing plugin links structure in Login.tsx

## Completed

- [x] Custom themed source filter dropdown in Dashboard (replaces native select with dark/tan mode support)

- [x] Fix production logout on page refresh (devMode=true, simplified ProtectedRoute with Convex auth)
- [x] Settings back link navigates to /dashboard instead of homepage
- [x] Terms of Service and Privacy Policy modals in homepage footer and Settings page
- [x] Public homepage: logged-in users stay on homepage with "Go to Dashboard" button, no auto-redirect
- [x] Docs page search with typeahead (client-side, instant results, Cmd+K shortcut, hash navigation)
- [x] Fix filter UI alignment
- [x] Add API rename and Claude API config
- [x] Notifications UI match existing design
- [x] Dedicated context search page (/context) system
- [x] Search results highlighting
- [x] Pagination for large session lists
- [x] update docs
- [x] Delete user data and profile option

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

## Recently Completed (Write Conflict Fixes)

- [x] Fixed write conflicts in Convex mutations causing OCC retries
  - Added 5-second dedup window to messages:upsert for idempotency
  - Added 10-second dedup window to sessions:upsert for idempotency
  - Refactored messages:upsert to combine multiple session patches into single write
  - Added Promise.all for parallel parts deletion and insertion
  - Added idempotency checks to embeddings:store and storeMessageEmbedding (replace pattern)
  - Created sessions:batchUpsert mutation for bulk session sync
  - Created messages:batchUpsert mutation for bulk message sync
  - Updated /sync/batch endpoint to use batch mutations instead of loops
  - Updated convex-write-conflicts.mdc with OpenSync-specific patterns

## Recently Completed (Platform Stats Leaderboard)

- [x] Real-time Platform Stats leaderboard on Login/homepage
  - Top 5 models by total tokens used
  - Token breakdown (prompt vs completion with visual progress bar)
  - Total messages count across all sessions
  - Positioned above Open Source footer link
  - Shows 0 values when database is empty (no hiding)
  - Updates in real-time via Convex when data syncs
  - Supports both dark and tan themes
  - publicPlatformStats query (no auth required)

## Recently Completed (Footer Icons)

- [x] Added Discord and Support icons to Login page footer
  - Discord icon links to convex.dev/community
  - Support icon (MessageCircleQuestion) links to GitHub issues page
  - Icons placed next to existing GitHub icon in bottom left footer

## Recently Completed (Provider Display Fix)

- [x] Fixed provider display showing "unknown" for antigravity-oauth and anthropic-oauth sessions (GitHub #2)
  - Updated inferProvider helper function in convex/analytics.ts with OAuth provider normalization
  - OAuth provider mapping: antigravity-oauth to "google" (Google Antigravity platform), anthropic-oauth to "anthropic"
  - Strips -oauth suffix from other OAuth providers for cleaner display
  - Falls through to model-based inference when provider field is missing (anthropic, openai, google, mistral, cohere, meta, deepseek, groq)
  - Applied consistently in providerStats query, sessionsWithDetails filtering, and session list return values
  - Filter dropdown and provider chart now show correct provider names

## Recently Completed (Auth Session Persistence)

- [x] Fixed auth session persistence issue (GitHub #1)
  - Users no longer need to sign in again on page refresh
  - Direct navigation to protected routes now works
  - Added dedicated CallbackHandler for OAuth code processing
  - Added return-to URL preservation in sessionStorage
  - Added devMode config for production session handling
  - 10-second timeout on callback processing to prevent stuck states
  - Added /dashboard route (alias to /)
  - Added /profile route (shows Settings with profile tab selected)

## Recently Completed

- [x] Context search slide-over panel for better UX
  - Click search results to preview session in slide-over panel (no navigation)
  - Full session details with message thread and syntax highlighting
  - Copy/Download/Public Link actions in panel header
  - "Open in Dashboard" button for full view (deep links to Sessions tab with session selected)
  - Message highlighting when clicking message search results
  - Escape key and backdrop click to close
  - Dashboard now reads ?session= URL param to auto-select session and switch to Sessions tab
  - Cmd/Ctrl+K on Dashboard navigates to Context search
  - Fixed tan mode prose styling (prose-zinc for proper text colors)

- [x] Documentation updates for local deployment and external links
  - Added Watch the demo link on Login page CTA (links to X demo video)
  - Added 100% local deployment section in Docs page (/docs#requirements-local)
  - Added 100% local deployment instructions in OPENSYNC-SETUP.md
  - Trust message on Login page now mentions cloud version with link to local docs
  - Added links to opencode.ai and claude.ai in Docs page hero and plugin sections

- [x] Mobile optimization for Login and Dashboard pages
  - Fixed Getting Started section on Login page (was hidden on mobile with the dashboard preview)
  - Dashboard header: smaller padding, source dropdown hidden on small mobile, scrollable view toggles
  - Sessions filter bar: wrapping layout, icon-only filter button on mobile, hidden timeline view
  - Session rows: stacked mobile layout vs 12-column desktop grid
  - Analytics filter bar: responsive search input, hidden advanced filters on mobile
  - Footer: condensed text on mobile
  - Added mobile Context icon in header nav

- [x] Fixed public sessions not showing all data and missing theme toggle
  - Added dark/tan theme toggle button (Sun/Moon icons) to public session header
  - Added content normalization helpers (getTextContent, getToolCallDetails, getToolResult)
  - Added textContent fallback when message.parts has no displayable content
  - Added tool-result part type rendering (was missing)
  - Updated all styling to use theme-aware classes

- [x] Added install.md for AI agent installation (follows installmd.org spec for self-hosting setup)

- [x] Fixed setup banner flash on dashboard refresh (banner now checks loading state before rendering)

- [x] Collapsible Profile section in Settings (collapsed by default, hides email for video demos)

- [x] Removed user email from dropdown menus (Dashboard, Context, Evals, Header) for cleaner UX

- [x] Page-specific theme defaults configuration
  - Added PAGE_THEME_DEFAULTS config object in theme.tsx
  - Added usePageTheme hook to apply different defaults per page
  - Login page defaults to dark, dashboard/docs/settings default to tan
  - User preferences in localStorage always take priority over page defaults

- [x] Fixed delete account partial deletion and redirect issues
  - Changed deleteAccount action to delete Convex data first, then WorkOS
  - Prevents partial deletion when WorkOS deletion triggers session invalidation
  - Fixed redirect to homepage instead of WorkOS logout URL after deletion
  - Removed signOut() call which caused browser redirect interruption

- [x] Login page feature list improvements
  - Updated tagline to mention eval datasets
  - Added Tag feature bullet for eval organization
  - Improved keyword colors for better dark mode contrast
  - Improved trust message and plugin link readability
  - Hidden scrollbar added to Docs sidebar and main content

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
- [x] Write conflict prevention (dedup windows, batch mutations, idempotency checks)

## Plugin Repos

| Repo | Purpose | Language | Auth | Status |
|------|---------|----------|------|--------|
| [opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin) | npm package for OpenCode CLI | TypeScript | API Key (osk_*) | Published |
| [claude-code-sync](https://www.npmjs.com/package/claude-code-sync) | npm package for Claude Code | TypeScript | API Key (osk_*) | Published |
| [codex-sync](https://www.npmjs.com/package/codex-sync) | npm package for Codex CLI | TypeScript | API Key (osk_*) | Published |

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
