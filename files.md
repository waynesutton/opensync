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
| `schema.ts` | Database schema: users, sessions, messages, parts, embeddings, apiLogs |
| `auth.config.ts` | WorkOS JWT validation configuration |
| `convex.config.ts` | Convex app configuration |
| `users.ts` | User queries/mutations: getOrCreate, me, stats, API key management |
| `sessions.ts` | Session CRUD: list, get, getPublic, setVisibility, remove, getMarkdown, upsert, listExternalIds |
| `messages.ts` | Message mutations: upsert with parts |
| `analytics.ts` | Analytics queries: dailyStats, modelStats, projectStats, providerStats, summaryStats, sessionsWithDetails |
| `search.ts` | Full-text and semantic search: searchSessions, searchMessages, semanticSearch, hybridSearch |
| `embeddings.ts` | Vector embedding generation for semantic search |
| `api.ts` | Internal API functions: listSessions, getSession, fullTextSearch, exportSession, getStats, semanticSearch, hybridSearch, getContext |
| `http.ts` | HTTP endpoints: /sync/* (session, message, batch, sessions/list), /api/*, /health |
| `rag.ts` | RAG retrieval functions for context engineering |
| `README.md` | Convex backend documentation |

## src/

React frontend application.

| File | Description |
|------|-------------|
| `main.tsx` | App entry point with providers (Convex, AuthKit, Router) |
| `App.tsx` | Route definitions and protected route wrapper |
| `index.css` | Global styles, Tailwind imports, dark theme tokens, chart utilities |
| `vite-env.d.ts` | Vite client type declarations for import.meta.env |

### src/pages/

| File | Description |
|------|-------------|
| `Login.tsx` | Login page with WorkOS AuthKit integration |
| `Dashboard.tsx` | Main dashboard with three views: Overview (stats, charts), Sessions (filterable list), Analytics (detailed breakdowns) |
| `Settings.tsx` | Tabbed settings: Usage (charts, stats), API Access (keys, endpoints), Profile (account info) |
| `Docs.tsx` | Interactive API documentation page |
| `PublicSession.tsx` | Public session viewer for shared sessions (/s/:slug) |

### src/components/

| File | Description |
|------|-------------|
| `Header.tsx` | Top navigation with search input and user menu |
| `Sidebar.tsx` | Session list sidebar with search results |
| `SessionViewer.tsx` | Session detail view with messages and actions |
| `Charts.tsx` | Reusable chart components: BarChart, AreaChart, DonutChart, Sparkline, ProgressBar, StatCard, DataTable, FilterPill |

### src/lib/

| File | Description |
|------|-------------|
| `auth.tsx` | Auth wrapper for WorkOS AuthKit with useAuth hook |
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
