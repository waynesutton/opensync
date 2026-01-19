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

## convex/

Backend functions and schema.

| File | Description |
|------|-------------|
| `schema.ts` | Database schema: users, sessions (with eval fields: evalReady, reviewedAt, evalNotes, evalTags), messages, parts, sessionEmbeddings, messageEmbeddings, apiLogs |
| `auth.config.ts` | WorkOS JWT validation configuration |
| `convex.config.ts` | Convex app configuration |
| `users.ts` | User queries/mutations: getOrCreate, me, stats, API key management, deleteAllData, deleteAccount (WorkOS API integration) |
| `sessions.ts` | Session CRUD: list, get, getPublic, setVisibility, remove, getMarkdown, upsert (with source param), listExternalIds, exportAllDataCSV |
| `messages.ts` | Message mutations: upsert with parts and source parameter for auto-created sessions |
| `analytics.ts` | Analytics queries with source filtering: dailyStats, modelStats, projectStats, providerStats, summaryStats, sessionsWithDetails, sourceStats |
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
| `main.tsx` | App entry point with providers (Convex, AuthKit, Router) |
| `App.tsx` | Route definitions, protected route wrapper with sync timeout (5s max, redirects to login on failure) |
| `index.css` | Global styles, Tailwind imports, dark theme tokens, chart utilities, scrollbar-hide utility |
| `vite-env.d.ts` | Vite client type declarations for import.meta.env |

### src/pages/

| File | Description |
|------|-------------|
| `Login.tsx` | Login page with WorkOS AuthKit integration, privacy messaging, getting started section with plugin links, tan mode theme support with footer theme switcher, GitHub icon link, updated mockup with view tabs and OC/CC source badges |
| `Dashboard.tsx` | Main dashboard with source filter dropdown, source badges (CC/OC), eval toggle button, Context link with search icon, setup banner for new users with plugin install links, and four views: Overview (stats, charts, setup banner), Sessions (filterable list with source badges), Evals (eval-ready sessions with export modal), Analytics (detailed breakdowns) |
| `Settings.tsx` | Tabbed settings: API Access (keys, endpoints), Profile (account info, Danger Zone with delete data/account options) |
| `Docs.tsx` | Comprehensive documentation page with left sidebar navigation, right table of contents, anchor tags, copy/view as markdown buttons, mobile responsive, works with both dark/tan themes. Covers use hosted version (with features, plugin install, login/sync), requirements, quick start, dashboard features, OpenCode plugin, Claude Code plugin, API reference, search types, authentication, hosting, fork guide, troubleshooting, and FAQ |
| `PublicSession.tsx` | Public session viewer for shared sessions (/s/:slug) |
| `Evals.tsx` | Evals page with eval-ready session list, stats, export modal (DeepEval JSON, OpenAI JSONL, Filesystem formats) |
| `Context.tsx` | Dedicated context search page (/context) with paginated full-text search for sessions and messages, no OpenAI key required |

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
| `theme.tsx` | Theme context and hook for dark/tan mode toggle with color palette definitions |

## docs/

Documentation files.

| File | Description |
|------|-------------|
| `SETUP.md` | Full deployment and configuration guide |
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
