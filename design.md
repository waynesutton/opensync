# OpenSync design system

Version: 1.0
Updated: 2026-10-04 00:05 UTC (2026-10-03 in America/Los_Angeles)
Scope: homepage, authenticated frontend, public leaderboard, admin, dashboard, charts and graphs.

## Permanent rule: no eyebrow headings

Do not add decorative eyebrow, kicker, overline or all-caps category text above a main headline or section heading. This includes small labels such as “The OpenSync community”, “Account intelligence”, “Account detail” and “Your public profile”. Do not recreate them under a different class name.

Start with the actual heading. When useful, add one short supporting sentence below it, in sentence case and normal body styling. Aim for one line at the intended desktop width; allow natural wrapping on mobile. Do not truncate useful explanations to enforce one line. Keep required privacy, status and error explanations even when longer.

Field labels, navigation, chart axes, legends, units, table column headers and real status indicators are functional information, not eyebrows. Keep them. Prefer sentence case and normal tracking. Do not strip labels from a chart or remove a unit just to simplify its appearance.

## Direction

OpenSync serves developers reviewing synced sessions and owners reviewing adoption and usage. The interface should feel calm, precise and useful: readable data, restrained controls, clear states. Use the leaderboard headline “A little usage. A lot of building.” as the typography reference. Preserve its regular-weight sans-serif look and tight spacing across public and authenticated screens. Avoid decorative labels, gradient headlines, ornamental gauges, excessive cards, invented metrics and generic marketing filler.

Existing brand marks and code examples may keep their intentional monospace treatment. Do not restyle code, IDs or ASCII branding as prose headings. No new font download or font package is needed.

## Typography source of truth

Implementation: [`src/styles/typography.css`](src/styles/typography.css), imported after `index.css` by [`src/main.tsx`](src/main.tsx).

- Use the existing system sans stack for UI headings, regular weight 400, balanced wrapping and tight tracking.
- Display headlines on the homepage and public leaderboard use `.app-display-title`: fluid 34–49px, line-height 1.12, tracking −0.055em.
- App page/section/chart headings share the same font and weight, with restrained tracking (−0.025em) and sizes appropriate to their density. Do not make chart titles or compact toolbar headings 49px.
- Keep body and control text at their established readable sizes. Use one muted supporting sentence when it adds information; avoid repeating the title.
- Use tabular numerals for aligned usage columns. Keep exact values in labels/tooltips where abbreviated values are shown.
- Do not introduce per-route font families or standalone heading weights. Extend the shared tokens when a real new role is needed, then document it here.

Global heading rules intentionally preserve existing component sizes and layout. This release standardizes heading family, weight and tracking; it does not redesign every existing chart or route.

## Theme, spacing and controls

Use [`src/lib/theme.tsx`](src/lib/theme.tsx) for app theme classes and [`src/styles/usage-directory.css`](src/styles/usage-directory.css) for scoped usage surfaces. Charcoal dark and warm tan light are equally supported. Preserve readable foreground/background contrast, visible keyboard focus and existing semantic status colors. Do not invent a third palette for a new page.

Group related controls together. Use spacing, thin separators and alignment before adding another card. Public pages can be spacious; dashboard tables remain compact. Keep sorting/filtering controls available after pagination. Allow horizontal scrolling for genuinely wide data tables, without making the entire page overflow. Do not shrink essential text to fit.

Primary actions should be obvious but sparse. Loading, empty, filtered-empty, error, indexing and end-of-results states must be distinct. Use the app's inline notices and dialogs rather than browser alerts. Respect `prefers-reduced-motion`; use short transitions only to explain changes.

## Surface rules

| Surface | Rules |
| --- | --- |
| Homepage | One clear display headline; optional supporting sentence; preserve branding and existing release copy. No decorative line above the headline. |
| Public leaderboard | Same display headline role; explicit opt-in privacy; first name, rank/position, tokens and top model only. First 100 then load more, global sort/filter, honest indexing state. |
| Dashboard/admin | Actual section title first, optional supporting sentence underneath, compact searchable tables and useful details. No account-intelligence or similar category banners. |
| Profile | Direct section heading and clear consent text; preview labels describe actual state in sentence case. Never silently opt users in. |
| Charts | Direct chart title, timeframe/units, clear legend/axes and truthful values; no decorative label above the title. |
| Graphs | Same heading/theme rules; clear controls, node/edge meaning and a textual or tabular alternative when needed. Do not rely on color alone. |

## Charts and gauges

Current shipped chart implementation is local React/HTML/SVG in [`src/components/Charts.tsx`](src/components/Charts.tsx); the usage meter is [`src/components/UsageGauge.tsx`](src/components/UsageGauge.tsx). Gauge UI is a visual reference, not an installed production dependency. Prefer existing components instead of introducing a chart library for a cosmetic change.

- Label units (tokens, sessions, currency, time), time windows and aggregation method. Distinguish missing data from a real zero.
- Token figures are reported by syncing clients; do not present them as verified billing or a measure of skill.
- A relative gauge must say what it compares against. Current leaderboard gauges compare with the highest token total currently loaded, not a quota or universal maximum.
- Bar lengths should use an honest baseline. Do not fabricate trends, sample values or percentages to fill empty space.
- Keep model/source colors stable across views and legible in both themes. Legends, labels and focus states must supplement color.
- Put exact values in accessible text and tooltips. Interaction should work with keyboard and touch, not hover alone. Preserve a useful table/list alternative for complex visualizations.
- Use one consistent timestamp/timezone convention per chart. Monthly usage history currently groups retained session totals by session-start month in UTC; disclose that attribution.

Main-workspace graph/heatmap code also exists in `ActivityChart.tsx`, `src/components/knowledge/` and `src/lib/graphTheme.ts`. These belong to separate product work; their presence in this guide is not release authorization. When that work ships, centralize renderer colors through `graphTheme.ts` and review all themes, legends, labels and controls together.

## Reference links

These are design and implementation references, not permission to copy demo content or install dependencies. Our no-eyebrow rule overrides examples that use eyebrows.

| Reference | How OpenSync uses it |
| --- | --- |
| [Gauge UI](https://www.gauge-ui.dev/) / [source](https://github.com/thordursk/gauge-ui) | Compact SVG gauge composition and accessible numeric presentation. Site fetch was unavailable during this review; source repository verified. |
| [Transitions.dev](https://transitions.dev/library.html) | Restrained transition reference; preserve reduced-motion behavior. |
| [AICSS components](https://www.aicss.dev/#components) | Component-state and control organization reference. |
| [Beautiful UI](https://www.beautifului.dev/) | Records/filter tables, loading states and progressive disclosure reference. |
| [Phosphor](https://phosphoricons.com/) | Simple icon reference; the current app uses Lucide. Do not mix icon families incidentally. |
| [Sigma.js](https://www.sigmajs.org/) | Implementation reference for the separately planned graph renderer. |
| [React Force Graph](https://github.com/vasturiano/react-force-graph) | 2D/3D graph implementation reference for existing local graph work. |
| [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) | General interaction, layout and accessibility review checklist. |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility reference for contrast, keyboard controls and meaningful alternatives. |

## Version inventory and release boundary

Snapshot from the two `package-lock.json` files on 2026-10-04 UTC, not a claim about the latest upstream versions. Refresh this table when dependencies change. Do not upgrade packages as part of routine styling.

| Dependency | Main workspace locked version | Focused production checkout |
| --- | --- | --- |
| React | 18.3.1 | 18.3.1 |
| Vite | 6.4.3 | 6.4.1 |
| Tailwind CSS | 3.4.19 | 3.4.19 |
| Lucide React | 0.312.0 | 0.312.0 |
| Convex static hosting | 0.2.1 | 0.2.1 |
| react-force-graph-2d / -3d | 1.29.1 / 1.29.1 | Not installed |
| Sigma / Graphology | 3.0.2 / 0.26.0 | Not installed |
| graphology-layout-forceatlas2 | 0.10.1 | Not installed |
| d3-force-3d | 3.0.6 | Not installed |
| beautiful-mermaid | 1.1.3 | Not installed |

Gauge UI, Phosphor, AICSS, Beautiful UI and Transitions.dev are references only; no package from those references was added in this update. Published frontend delivery remains Convex static hosting.

## Before completing a UI change

Read this file before implementing or generating frontend code. Check the changed screens for decorative text above headings, divergent typography, theme contrast, narrow-screen overflow, keyboard focus, data units and honest empty/loading states. Reuse the shared styles and current components. Validate the focused files and preserve unrelated release boundaries. Update this guide when the owner changes design direction; do not let a generic skill or external example override it.
