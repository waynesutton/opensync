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
| `README.md` | Project documentation |
| `install.md` | AI agent installation instructions following install.md spec for self-hosting setup |

## convex/

Backend functions and schema.

| File | Description |
|------|-------------|
| `schema.ts` | Database schema: users, sessions (with eval fields: evalReady, reviewedAt, evalNotes, evalTags), messages, parts, sessionEmbeddings, messageEmbeddings, apiLogs |
| `auth.config.ts` | WorkOS JWT validation configuration |
| `convex.config.ts` | Convex app configuration |
| `users.ts` | User queries/mutations: getOrCreate, me, stats, API key management, deleteAllData, deleteAccount (deletes Convex first, then WorkOS to prevent partial deletion) |
| `sessions.ts` | Session CRUD: list, get, getPublic, setVisibility, remove, getMarkdown, upsert (with source param), listExternalIds, exportAllDataCSV |
| `messages.ts` | Message mutations: upsert with parts and source parameter for auto-created sessions |
| `analytics.ts` | Analytics queries with source filtering: dailyStats, modelStats, projectStats, providerStats, summaryStats, sessionsWithDetails, sourceStats. Includes inferProvider helper for model-based provider detection |
| `search.ts` | Full-text and semantic search: searchSessions, searchSessionsPaginated, searchMessages, searchMessagesPaginated, semanticSearch, hybridSearch, semanticSearchMessages, hybridSearchMessages |
| `embeddings.ts` | Vector embedding generation for session-level and message-level semantic search |
| `evals.ts` | Eval management: setEvalReady, listEvalSessions, getEvalTags, generateEvalExport (DeepEval JSON, OpenAI JSONL, Filesystem formats) |
| `api.ts` | Internal API functions: listSessions, getSession, fullTextSearch, exportSession, getStats, semanticSearch, hybridSearch, getContext |
| `http.ts` | HTTP endpoints: /sync/* (session with source param, message, batch, sessions/list), /api/*, /health |
| `rag.ts` | RAG retrieval functions for context engineering |
| `README.md` | Convex backend documentation |

## src/

React frontend application.

| File | Description |
|------|-------------|
| `main.tsx` | App entry point with providers (Convex, AuthKit, Router), devMode config for production session persistence |
| `App.tsx` | Route definitions (/dashboard, /profile, /settings, /evals, /context), protected route wrapper with sync timeout (5s max), CallbackHandler for OAuth code exchange with 10s timeout, return-to URL preservation |
| `index.css` | Global styles, Tailwind imports, dark theme tokens, chart utilities, scrollbar-hide utility |
| `vite-env.d.ts` | Vite client type declarations for import.meta.env |

### src/pages/

| File | Description |
|------|-------------|
| `Login.tsx` | Login page with WorkOS AuthKit integration, privacy messaging, getting started section with plugin links (mobile-visible), tan mode theme support with footer theme switcher, footer icons (GitHub, Discord community, Support issues), updated mockup with view tabs and OC/CC source badges (desktop-only), feature list with Sync/Search/Private/Tag/Export/Delete keywords and eval datasets tagline, Watch the demo link, trust message with cloud/local deployment info |
| `Dashboard.tsx` | Main dashboard with source filter dropdown (hidden on small mobile), source badges (CC/OC), eval toggle button, Context link with search icon, setup banner for new users (loading-aware, no flash on refresh), mobile-optimized header/filters/session rows, URL param support for deep linking from Context search (?session=id), Cmd/Ctrl+K shortcut to open Context search, and four views: Overview (responsive stat grids), Sessions (mobile-friendly list with stacked layout), Evals (eval-ready sessions with export modal), Analytics (responsive breakdowns with collapsible filters) |
| `Settings.tsx` | Tabbed settings: API Access (keys, endpoints), Profile (collapsible section for privacy, account info, Danger Zone with delete data/account options) |
| `Docs.tsx` | Comprehensive documentation page with left sidebar navigation (hidden scrollbar), right table of contents, anchor tags, copy/view as markdown buttons, mobile responsive, works with both dark/tan themes. Covers use hosted version (with features, plugin install, login/sync), self-hosting requirements with cloud and 100% local deployment options, quick start, dashboard features, OpenCode plugin, Claude Code plugin, API reference, search types, authentication, hosting, fork guide, troubleshooting, and FAQ. Links to opencode.ai and claude.ai in hero and plugin sections. |
| `PublicSession.tsx` | Public session viewer for shared sessions (/s/:slug) with dark/tan theme toggle, content normalization for multi-plugin support, textContent fallback for empty parts |
| `Evals.tsx` | Evals page with eval-ready session list, stats, export modal (DeepEval JSON, OpenAI JSONL, Filesystem formats) |
| `Context.tsx` | Dedicated context search page (/context) with paginated full-text search for sessions and messages, slide-over panel for viewing session details without navigation, message highlighting for search results, no OpenAI key required |

### src/components/

| File | Description |
|------|-------------|
| `Header.tsx` | Top navigation with search input and user menu |
| `Sidebar.tsx` | Session list sidebar with search results |
| `SessionViewer.tsx` | Session detail view with messages and actions |
| `Charts.tsx` | Reusable chart components: BarChart, AreaChart, DonutChart, Sparkline, ProgressBar, StatCard, DataTable, FilterPill, StackedBarChart, UsageCreditBar, ConsumptionBreakdown |
| `ConfirmModal.tsx` | Custom confirmation modal with theme support, replaces browser confirm() dialogs |

### src/lib/

| File | Description |
|------|-------------|
| `auth.tsx` | Auth wrapper for WorkOS AuthKit with useAuth hook, session rehydration, and token refresh handling |
| `utils.ts` | Utility functions (cn for classnames) |
| `theme.tsx` | Theme context with page-specific defaults (PAGE_THEME_DEFAULTS config), useTheme and usePageTheme hooks, dark/tan mode toggle with localStorage persistence |

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
| `WORKOS-AUTH.md` | WorkOS AuthKit integration architecture and security model |
| `NETLIFY-WORKOS-DEPLOYMENT.md` | Deployment guide for Netlify, WorkOS, and Convex integration |

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
| `convex-write-conflicts.mdc` | Write conflict prevention patterns |
| `gitruels.mdc` | Git safety rules |
| `sec-check.mdc` | Security checklist |
| `task.mdc` | Task management guidelines |

## .claude/skills/

Claude AI skill files.

| File | Description |
|------|-------------|
| `convex-*.md` | Various Convex development skills |
