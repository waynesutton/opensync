# Product Requirements Document

## OpenCode Sync: Evals, Marketplace, RAG, and Analytics Features

| Document | Value |
|----------|-------|
| Version | 1.0 |
| Date | January 2026 |
| Author | Product Team |
| Status | Draft |

---

## Executive Summary

This PRD outlines four new features for the OpenCode Sync web application. These features extend the existing session synchronization and search capabilities to support model evaluation, data monetization, contextual retrieval, and performance analytics. All four features build on the existing Convex backend, WorkOS authentication, and React frontend architecture.

## Background

OpenCode Sync currently provides real-time session synchronization from the OpenCode CLI to a Convex-powered backend. Users can search their sessions using full-text and semantic search, export in multiple formats, and share sessions publicly. The existing infrastructure includes:

- Session and message storage with embeddings for semantic search
- WorkOS authentication with API key generation
- Export endpoints supporting JSON, JSONL, and Markdown formats
- Usage statistics tracking tokens, cost, and time per session

The four proposed features leverage this foundation to create additional value from stored session data.

---

## Feature 1: Personal Eval Suite

### Overview

Enable users to export their successful coding sessions as evaluation datasets compatible with popular LLM evaluation frameworks. Users can then run these evals locally against different models to measure which performs best on their actual coding tasks.

### User stories

- As a developer, I want to export my successful sessions as an eval dataset so I can test new models against my real-world coding patterns.
- As a developer, I want to filter which sessions become eval cases so I only include high-quality examples.
- As a developer, I want the export format to work with DeepEval and OpenAI Evals so I can use industry-standard tooling.

### Functional requirements

#### Session qualification UI

- Add a session detail view toggle to mark a session as "eval-ready"
- Display qualification criteria checklist:
  - Session completed successfully (not abandoned)
  - Contains at least one user prompt and one assistant response
  - User has reviewed and confirmed the assistant output was correct
- Store eval_ready boolean and reviewed_at timestamp on session record

#### Eval export configuration

- New export option in dashboard: "Export for Evals"
- Configuration modal with options:
  - Format selection: DeepEval JSON, OpenAI Evals JSONL, Generic JSONL
  - Include/exclude system prompts
  - Include/exclude tool calls and results
  - Anonymize project paths (replace with placeholders)
- Batch export of all eval-ready sessions or selected subset

#### Export format specifications

**DeepEval format:**
- input: User prompt text
- actual_output: Assistant response text
- expected_output: Same as actual_output (since user verified correctness)
- context: Array of tool results and file contents from session

**OpenAI Evals JSONL format:**
- One JSON object per line
- Fields: input, ideal, metadata (model, tokens, timestamp)

### API endpoints

| Endpoint | Description |
|----------|-------------|
| `PATCH /api/sessions/:id/eval-ready` | Mark session as eval-ready with review timestamp |
| `GET /api/export/evals` | Export eval-ready sessions in specified format |
| `GET /api/sessions/eval-ready` | List all eval-ready sessions with metadata |

### Schema changes

Add to sessions table:

- `evalReady`: boolean (default false)
- `reviewedAt`: timestamp (optional)
- `evalNotes`: string (optional user notes about the eval case)

### UI components

- **EvalReadyToggle**: Switch component in session detail view
- **EvalExportModal**: Configuration dialog for export options
- **EvalSessionList**: Filtered view of eval-ready sessions in sidebar
- **EvalStats**: Count of eval-ready sessions and total available for export

---

## Feature 2: Training Data Marketplace

### Overview

Allow users to list their anonymized session data for sale to other users or organizations seeking training data. Buyers can browse, preview, and purchase session bundles. This feature establishes the data structures, listing flow, and discovery UI. Payment processing is not included in this scope.

### User stories

- As a seller, I want to list my coding sessions for sale so I can monetize my data.
- As a seller, I want to set pricing and licensing terms for my listings.
- As a buyer, I want to browse available datasets by domain, language, and quality metrics.
- As a buyer, I want to preview a sample before purchasing.

### Functional requirements

#### Listing creation

- New "Sell Data" section in dashboard
- Listing wizard with steps:
  - Select sessions to include (multi-select from session list)
  - Set metadata: title, description, tags/categories
  - Choose anonymization level: paths only, all identifiers, custom rules
  - Set price (stored as integer cents) and license type
  - Generate preview sample (first 3 exchanges, anonymized)
- Listings require minimum 10 sessions
- Auto-calculate and display bundle statistics: total tokens, session count, date range, languages detected

#### Listing discovery

- Public marketplace page (no auth required to browse)
- Filter and sort options:
  - Category/domain tags
  - Programming language
  - Price range
  - Session count
  - Average session quality score
- Search by keyword in title and description
- Listing cards show: title, price, session count, preview button, seller rating

#### Preview and purchase flow

- Preview modal shows:
  - Sample of 3 anonymized prompt/response pairs
  - Aggregate statistics
  - License terms
  - Seller profile link
- Purchase button (disabled with message: "Connect payment provider in settings")
- After purchase: buyer gets download access via secure signed URL

### Note on payments

Payment processing is intentionally excluded from this PRD. The marketplace UI will include placeholder buttons and messaging directing users to integrate the Convex Stripe component (convex-helpers/stripe or similar) for payment handling. The schema includes price fields to support future payment integration. Implementers should reference the Convex documentation for Stripe integration patterns.

### Schema changes

**New listings table:**

- `_id`: Id<"listings">
- `sellerId`: Id<"users">
- `title`: string
- `description`: string
- `tags`: string[]
- `sessionIds`: Id<"sessions">[]
- `priceInCents`: number
- `licenseType`: "personal" | "commercial" | "research"
- `anonymizationLevel`: "paths" | "full" | "custom"
- `previewData`: string (JSON of sample exchanges)
- `stats`: object (tokenCount, sessionCount, dateRange, languages)
- `status`: "draft" | "active" | "sold" | "archived"
- `createdAt`: timestamp
- `updatedAt`: timestamp

**New purchases table:**

- `_id`: Id<"purchases">
- `listingId`: Id<"listings">
- `buyerId`: Id<"users">
- `paidAmountInCents`: number
- `paymentRef`: string (for future Stripe integration)
- `downloadUrl`: string (signed URL)
- `downloadExpiresAt`: timestamp
- `createdAt`: timestamp

### API endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/listings` | Create new listing |
| `GET /api/listings` | List all active listings (public) |
| `GET /api/listings/:id` | Get listing details with preview |
| `PATCH /api/listings/:id` | Update listing (seller only) |
| `DELETE /api/listings/:id` | Archive listing (seller only) |
| `GET /api/listings/mine` | Get seller's own listings |
| `POST /api/purchases` | Record purchase (placeholder for payment integration) |
| `GET /api/purchases/mine` | Get buyer's purchases with download links |

### UI components

- **ListingWizard**: Multi-step form for creating listings
- **MarketplaceBrowser**: Public grid/list view of listings
- **ListingCard**: Summary card with key metrics
- **ListingDetail**: Full listing page with preview modal
- **SellerDashboard**: Manage own listings, view stats
- **PurchaseHistory**: Buyer's purchased datasets

---

## Feature 3: RAG Context Library

### Overview

Expose the existing semantic search capability as a dedicated "Context Library" interface. Users can query their past sessions to retrieve relevant code snippets, solutions, and patterns for use in new coding tasks. The UI emphasizes copy-to-clipboard workflows and context window optimization.

### User stories

- As a developer, I want to search my past solutions by describing my current problem so I can reuse proven approaches.
- As a developer, I want to copy retrieved context directly into my prompt or editor.
- As a developer, I want to see token counts so I know how much context I'm adding.
- As a developer, I want to save frequent searches as bookmarks for quick access.

### Functional requirements

#### Context search interface

- Dedicated "Context Library" tab in main navigation
- Large search input with placeholder: "Describe what you're trying to solve..."
- Search type selector: Semantic (default), Full-text, Hybrid
- Results limit slider: 3, 5, 10, 20 results
- Token budget input: Target max tokens for combined results

#### Search results display

- Results as expandable cards showing:
  - Session title and date
  - Relevance score (percentage)
  - Token count for this result
  - Preview of matching content (truncated)
- Expand to show full message content
- Checkbox to select results for batch copy
- Running total of selected tokens displayed

#### Copy and export actions

- Copy single result button on each card
- Copy all selected button with format options:
  - Plain text
  - Markdown with source attribution
  - XML tags format (for Claude-style context)
- Toast confirmation on copy with token count

#### Saved searches

- Save current search as bookmark with custom name
- Bookmarks sidebar showing saved searches
- One-click to re-run saved search
- Edit and delete bookmarks

### Schema changes

**New savedSearches table:**

- `_id`: Id<"savedSearches">
- `userId`: Id<"users">
- `name`: string
- `query`: string
- `searchType`: "semantic" | "fulltext" | "hybrid"
- `limit`: number
- `tokenBudget`: number (optional)
- `createdAt`: timestamp
- `lastUsedAt`: timestamp

### API endpoints

Existing `/api/context` endpoint is sufficient. Add:

| Endpoint | Description |
|----------|-------------|
| `POST /api/saved-searches` | Create saved search |
| `GET /api/saved-searches` | List user's saved searches |
| `DELETE /api/saved-searches/:id` | Delete saved search |
| `PATCH /api/saved-searches/:id/use` | Update lastUsedAt timestamp |

### UI components

- **ContextLibrary**: Main page container
- **ContextSearchBar**: Search input with type selector and limit controls
- **ContextResultCard**: Expandable result with copy actions
- **ContextResultList**: List of results with batch selection
- **TokenCounter**: Running total of selected content
- **SavedSearchSidebar**: Bookmarks list with quick actions
- **CopyFormatModal**: Format selection for batch copy

---

## Feature 4: Model Comparison Dashboard

### Overview

Provide analytics comparing model performance across the user's sessions. Users can see which models they use most, relative costs, token efficiency, and success patterns. This helps users make informed decisions about model selection.

### User stories

- As a developer, I want to see which models I use most frequently.
- As a developer, I want to compare cost per session across different models.
- As a developer, I want to see token usage patterns by model.
- As a developer, I want to identify which models work best for different task types.

### Functional requirements

#### Overview dashboard

- Summary cards at top:
  - Total sessions
  - Total tokens (prompt + completion)
  - Total estimated cost
  - Most used model
- Date range selector: Last 7 days, 30 days, 90 days, All time, Custom
- Model filter: Multi-select to compare specific models

#### Usage breakdown charts

- Pie chart: Sessions by model
- Pie chart: Tokens by model
- Pie chart: Cost by model
- Bar chart: Sessions over time, stacked by model

#### Model comparison table

- Sortable columns:
  - Model name
  - Provider
  - Session count
  - Total tokens
  - Avg tokens per session
  - Total cost
  - Avg cost per session
  - Avg session duration
- Click row to see detailed breakdown for that model

#### Model detail view

- Sessions list filtered to selected model
- Token distribution histogram
- Cost over time line chart
- Common project paths using this model
- Quick filter to eval-ready sessions for this model

#### Efficiency metrics

- Tokens per message by model (lower may indicate more concise responses)
- Messages per session by model (higher may indicate more back-and-forth)
- Cost per 1000 tokens by model (normalized comparison)

### Schema changes

No new tables required. Existing sessions table already stores model, provider, promptTokens, completionTokens, and cost. Add indexes:

- Index on model field for efficient grouping
- Index on createdAt for time-range queries
- Compound index on (userId, model, createdAt) for user-specific model analytics

### API endpoints

Extend existing `/api/stats` endpoint or add:

| Endpoint | Description |
|----------|-------------|
| `GET /api/analytics/overview` | Summary stats with date range filter |
| `GET /api/analytics/by-model` | Aggregated stats grouped by model |
| `GET /api/analytics/model/:id` | Detailed stats for specific model |
| `GET /api/analytics/trends` | Time-series data for charts |

### UI components

- **AnalyticsDashboard**: Main page container
- **StatsCards**: Summary metric cards
- **DateRangeSelector**: Dropdown with preset and custom options
- **ModelFilter**: Multi-select for model comparison
- **UsagePieChart**: Recharts pie with model breakdown
- **UsageBarChart**: Recharts stacked bar for time series
- **ModelComparisonTable**: Sortable data table
- **ModelDetailPanel**: Expanded view for single model
- **EfficiencyMetrics**: Derived metric displays

---

## Technical Considerations

### Shared infrastructure

All four features use the existing Convex backend, WorkOS authentication, and React/Vite frontend. No new infrastructure is required. The features share:

- Session and message data models
- User authentication and API key system
- Embedding generation for semantic search
- Export utilities for format conversion

### Performance considerations

- Analytics queries should use Convex indexes to avoid full table scans
- Marketplace listing previews should be pre-generated and cached
- Context library searches should respect token budget on server side to minimize data transfer
- Large exports should use streaming or chunked responses

### Security considerations

- Marketplace listings must only include sessions owned by the seller
- Anonymization must run server-side before preview generation
- Purchase download URLs must be signed and time-limited
- Analytics endpoints must scope queries to authenticated user

### Migration path

New schema fields on existing tables (evalReady, reviewedAt) should default to null/false to avoid migration issues. New tables (listings, purchases, savedSearches) can be created empty.

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

- Schema changes for all four features
- API endpoints for eval export and saved searches
- Basic UI for eval-ready toggle and context library search

### Phase 2: Analytics (Week 3)

- Analytics aggregation queries
- Dashboard charts and comparison table
- Model detail view

### Phase 3: Marketplace (Week 4-5)

- Listing creation wizard
- Anonymization utilities
- Marketplace browse and preview UI
- Placeholder purchase flow

### Phase 4: Polish (Week 6)

- Saved searches with bookmarks
- Batch copy with format options
- Export format refinements
- Documentation and help content

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Eval Suite | Sessions marked eval-ready | 20% of completed sessions |
| Eval Suite | Eval exports per month | 50+ exports |
| Marketplace | Active listings | 100+ listings in 3 months |
| Marketplace | Preview views per listing | 10+ views average |
| Context Library | Searches per user per week | 5+ searches |
| Context Library | Saved searches created | 2+ per active user |
| Analytics | Dashboard views per week | 3+ views per user |
| Analytics | Users comparing 2+ models | 40% of active users |

---

## Out of Scope

- Payment processing (defer to Convex Stripe component)
- Seller payout management
- Tax calculation and reporting
- Automated quality scoring of sessions
- Integration with external eval frameworks (users run locally)
- Real-time collaborative features
- Mobile-specific UI optimizations

---

## Appendix: Stripe Integration Note

When implementing the marketplace purchase flow, developers should integrate the Convex Stripe component for payment handling. The recommended approach:

- Use convex-helpers or a similar Convex Stripe integration
- Create a Stripe Checkout session when user clicks "Purchase"
- Handle webhook for successful payment to update purchases table
- Generate signed download URL upon payment confirmation

Reference: https://docs.convex.dev for current component patterns and https://stripe.com/docs for Checkout integration.
