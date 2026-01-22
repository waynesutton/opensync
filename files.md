# Files

Codebase file structure and descriptions.

## Root

| File | Description |
|------|-------------|
| `index.html` | Vite entry point HTML file |
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Vite bundler configuration |
| `tsconfig.json` | TypeScript configuration |
| `tsconfig.node.json` | TypeScript config for Node tooling |
| `tailwind.config.js` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS configuration |
| `netlify.toml` | Netlify deployment config with SPA redirect rules |
| `README.md` | Project documentation with Ecosystem table (official + community plugins) |
| `install.md` | AI agent installation instructions following install.md spec for self-hosting setup |

## convex/

Backend functions and schema.

| File | Description |
|------|-------------|
| `schema.ts` | Database schema: users (with enabledAgents for CLI tool preferences), sessions (with eval fields: evalReady, reviewedAt, evalNotes, evalTags), messages, parts, sessionEmbeddings, messageEmbeddings, apiLogs, dailyWrapped (for Daily Sync Wrapped feature with 24h expiry) |
| `auth.config.ts` | WorkOS JWT validation configuration |
| `convex.config.ts` | Convex app configuration |
| `users.ts` | User queries/mutations: getOrCreate, me (returns enabledAgents), stats, API key management, updateEnabledAgents, deleteAllData, deleteAccount (deletes Convex first, then WorkOS to prevent partial deletion) |
| `sessions.ts` | Session CRUD: list, get, getPublic, setVisibility, remove, getMarkdown, upsert (with 10s dedup window, idempotency), batchUpsert, listExternalIds, exportAllDataCSV |
| `messages.ts` | Message mutations: upsert (with 5s dedup, combined session patch, parallel parts ops), batchUpsert for bulk sync |
| `analytics.ts` | Analytics queries with source filtering: dailyStats, modelStats, projectStats, providerStats, summaryStats, sessionsWithDetails, sourceStats, publicPlatformStats (no auth, for homepage leaderboard). Includes inferProvider helper with OAuth provider normalization (antigravity-oauth to google, anthropic-oauth to anthropic) and model-based provider detection |
| `search.ts` | Full-text and semantic search: searchSessions, searchSessionsPaginated, searchMessages, searchMessagesPaginated, semanticSearch, hybridSearch, semanticSearchMessages, hybridSearchMessages |
| `embeddings.ts` | Vector embedding generation with idempotency checks and replace pattern for session-level and message-level semantic search |
| `evals.ts` | Eval management: setEvalReady, listEvalSessions (with factoryDroid stats), getEvalTags, generateEvalExport (DeepEval JSON, OpenAI JSONL, Filesystem formats) |
| `api.ts` | Internal API functions: listSessions, getSession, fullTextSearch, exportSession, getStats, semanticSearch, hybridSearch, getContext |
| `http.ts` | HTTP endpoints: /sync/* (session, message, batch using batchUpsert mutations, sessions/list), /api/*, /health |
| `rag.ts` | RAG retrieval functions for context engineering |
| `wrapped.ts` | Daily Wrapped queries and mutations: getTodayWrapped, getWrappedStats, get24HourStats, getCountdownInfo queries; createWrapped, deleteExpired, getActiveUsers mutations |
| `wrappedActions.ts` | Daily Wrapped Node.js actions: generateWrappedImage (Google Imagen API), generateForUser, generateAllWrapped |
| `crons.ts` | Scheduled jobs: daily wrapped generation at 9:30 AM PT, cleanup every 6 hours |
| `README.md` | Convex backend documentation |

## src/

React frontend application.

| File | Description |
|------|-------------|
| `main.tsx` | App entry point with providers (Convex, AuthKit, Router), devMode=true for localStorage tokens (avoids third-party cookie blocking in production) |
| `App.tsx` | Route definitions: public routes (/, /login, /docs, /s/:slug), protected routes (/dashboard, /profile, /settings, /evals, /context). ProtectedRoute with delayed spinner (500ms) and Safari timeout (5s), CallbackHandler for OAuth code exchange, return-to URL preservation |
| `index.css` | Global styles, Tailwind imports, dark theme tokens, chart utilities, scrollbar-hide utility |
| `vite-env.d.ts` | Vite client type declarations for import.meta.env |

### src/pages/

| File | Description |
|------|-------------|
| `Login.tsx` | Public homepage with WorkOS AuthKit integration. Shows "Go to Dashboard" button when logged in (no auto-redirect), "Sign in" when logged out. Includes privacy messaging, "Syncs with" section showing supported CLI tools (OpenCode, Claude Code, Droid, Cursor with coming soon badge), getting started section with plugin links (mobile-visible), tan mode theme support with footer (theme switcher, Terms/Privacy links), footer icons (GitHub, Discord, Support, Discussions), updated mockup with view tabs and OC/CC source badges (desktop-only), feature list with Sync/Search/Private/Tag/Export/Delete keywords and eval datasets tagline, Watch the demo link, trust message with cloud/local deployment info, real-time Platform Stats leaderboard (Top Models, Top CLI) above Open Source footer link |
| `Dashboard.tsx` | Main dashboard with custom themed source filter dropdown (filters by user's enabled agents from Settings, dark/tan mode support, click-outside close, escape key close), source badges (CC/OC/FD), eval toggle button, Context link with search icon, setup banner for new users with 3-column plugin cards (OpenCode, Claude Code, Factory Droid), mobile-optimized header/filters/session rows, URL param support for deep linking from Context search (?session=id), Cmd/Ctrl+K shortcut to open Context search, MessageBubble with content normalization helpers (getPartTextContent, getToolName) for multi-plugin format support, and five views: Overview (responsive stat grids), Sessions (mobile-friendly list with stacked layout), Evals (eval-ready sessions with export modal), Analytics (responsive breakdowns with collapsible filters), Wrapped (Daily Sync Wrapped visualization) |
| `Settings.tsx` | Tabbed settings: API Access (two-column layout with Plugin Setup and AI Coding Agents sections, keys, endpoints with droid-sync link), Profile (collapsible section for privacy, account info, Legal section with Terms/Privacy links, Danger Zone with delete data/account options). AI Coding Agents section lets users enable/disable CLI tools for the source filter dropdown (OpenCode, Claude Code, Factory Droid, Cursor, Codex CLI, Continue, Amp, Aider, Goose, Mentat, Cline, Kilo Code). Back link navigates to /dashboard |
| `Docs.tsx` | Comprehensive documentation page with instant typeahead search (Cmd/Ctrl+K shortcut), left sidebar navigation (hidden scrollbar), right table of contents, anchor tags, copy/view as markdown buttons, mobile responsive, works with both dark/tan themes. Search indexes all sections with keywords for quick navigation to any topic via hash anchor. Covers use hosted version (with features, plugin install, login/sync), self-hosting requirements with cloud and 100% local deployment options, quick start, dashboard features, OpenCode plugin, Claude Code plugin, API reference, search types, authentication, hosting, fork guide, troubleshooting, and FAQ. Links to opencode.ai and claude.ai in hero and plugin sections. |
| `PublicSession.tsx` | Public session viewer for shared sessions (/s/:slug) with dark/tan theme toggle, content normalization for multi-plugin support, textContent fallback for empty parts |
| `Evals.tsx` | Evals page with eval-ready session list, stats (including Factory Droid count), export modal (DeepEval JSON, OpenAI JSONL, Filesystem formats), source filter respects user's enabled agents from Settings |
| `Context.tsx` | Dedicated context search page (/context) with paginated full-text search for sessions and messages, slide-over panel for viewing session details without navigation, message highlighting for search results, source badges using centralized utilities, no OpenAI key required |

### src/components/

| File | Description |
|------|-------------|
| `Header.tsx` | Top navigation with search input and user menu |
| `Sidebar.tsx` | Session list sidebar with search results |
| `SessionViewer.tsx` | Session detail view with messages and actions |
| `Charts.tsx` | Reusable chart components: BarChart, AreaChart, DonutChart, Sparkline, ProgressBar, StatCard, DataTable, FilterPill, StackedBarChart, UsageCreditBar, ConsumptionBreakdown |
| `ConfirmModal.tsx` | Custom confirmation modal with theme support, replaces browser confirm() dialogs |
| `LegalModal.tsx` | Dark mode modal for displaying Terms of Service and Privacy Policy with markdown rendering, ESC/X to close |
| `WrappedView.tsx` | Daily Wrapped component with countdown timer, download PNG (675x1200 9:16 portrait) using hidden off-screen export container for clean captures (rotate design button commented out for production) |
| `WrappedTemplates.tsx` | 10 CSS template designs for wrapped (9:16 portrait 675x1200px) showing tokens, messages, sessions (not cost), with large readable fonts |

### src/lib/

| File | Description |
|------|-------------|
| `auth.tsx` | Auth wrapper for WorkOS AuthKit with useAuth hook, session rehydration, and token refresh handling |
| `utils.ts` | Utility functions (cn for classnames) |
| `theme.tsx` | Theme context with page-specific defaults (PAGE_THEME_DEFAULTS config), useTheme and usePageTheme hooks, dark/tan mode toggle with localStorage persistence |
| `source.ts` | Source utilities: getSourceLabel (OC/CC/FD labels), getSourceColorClass (themed badge colors for OpenCode/Claude Code/Factory Droid) |

## docs/

Documentation files.

| File | Description |
|------|-------------|
| `OPENSYNC-SETUP.md` | Full deployment and configuration guide with cloud and 100% local self-hosting options |
| `API.md` | API endpoint reference with examples |
| `OPENCODE-PLUGIN.md` | OpenCode plugin installation and usage (API Key auth) |
| `CLAUDE-CODE-PLUGIN.md` | Claude Code plugin installation and hooks (API Key auth) |
| `PLUGIN-AUTH-PRD.md` | Plugin authentication specification (API Key vs WorkOS OAuth) |
| `PRD-FEATURES.md` | Product requirements: Eval Suite, Marketplace, Context Library, Analytics |
| `SYNC-FOR-EVALS-PRD.md` | Detailed PRD for eval export system with DeepEval/OpenAI Evals support |
| `workosfix.md` | WorkOS troubleshooting notes |
| `add-package-to-home-prompt.md` | Reusable prompt template for adding CLI/npm packages to homepage Getting Started section |
| `WORKOS-AUTH.md` | WorkOS AuthKit integration architecture and security model |
| `NETLIFY-WORKOS-DEPLOYMENT.md` | Deployment guide for Netlify, WorkOS, and Convex integration |
| `fix-blank-sessions.md` | Tracking document for empty session messages fix (Issues #7, #8) |

## public/

Static assets.

| File | Description |
|------|-------------|
| `_redirects` | Netlify SPA fallback rules for client-side routing |
| `favicon.png` | PNG favicon |
| `favicon.svg` | SVG favicon |
| `convex.svg` | Convex logo |
| `workos.svg` | WorkOS logo |
| `netlify-logo.svg` | Netlify logo |
| `opencode-dark.svg` | OpenCode logo for dark theme |
| `opencode-light.svg` | OpenCode logo for light theme |
| `claude.svg` | Claude Code logo (uses currentColor) |
| `factory-droid.svg` | Factory Droid logo (uses currentColor) |
| `llms.txt` | AI assistant documentation file with project overview, features, API reference, and setup instructions |

## .cursor/rules/

Cursor IDE rules for AI assistance.

| File | Description |
|------|-------------|
| `dev2.mdc` | Main development guidelines |
| `help.mdc` | Problem-solving workflow |
| `write.mdc` | Writing style guide |
| `convex2.mdc` | Convex best practices |
| `rulesforconvex.mdc` | Additional Convex guidelines |
| `convex-write-conflicts.mdc` | Write conflict prevention patterns with OpenSync-specific sync patterns (dedup windows, batch mutations, replace pattern) |
| `changelog.mdc` | Changelog format rules for GitHub Releases automation |
| `gitruels.mdc` | Git safety rules |
| `sec-check.mdc` | Security checklist |
| `task.mdc` | Task management guidelines |

## .claude/skills/

Claude AI skill files.

| File | Description |
|------|-------------|
| `convex-*.md` | Various Convex development skills |
