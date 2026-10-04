# Convex static-hosting release baseline

Created: 2026-10-04 00:53 UTC (October 3 PDT)
Status: Live; focused source ready for Git handoff

## Delivered
- Convex static hosting and custom API/client domains, retaining existing endpoints.
- Owner-only administration, saved email drafts and guarded single-recipient workflow; routine test mode remains enabled.
- Indexed user usage search/sorting, model history, activity/join-date sorting and 100-row pagination.
- Optional public usage leaderboard and Profile consent. Dashboard links to the board beside Wrapped; homepage does not promote it.
- Shared headline typography and persistent no-eyebrow design rules.
- Plugin HTTP URL defaults to api.opensync.dev; Convex client URL is app.opensync.dev. Published OpenCode/Claude Code logins retain a compatibility URL.
- Temporary migration notice removed; missing-configuration setup warning preserved.

Latest static deployment: `1ab1ee49-8056-4581-b5d1-37783625992e`; assets `index-tFpc-Ego.js` / `index-YkCikWk3.css`.

## Verification and limits
109 tests pass, frontend/backend TypeScript pass, scoped frontend lint passes, production build succeeds. Live banner removal, setup URL and dashboard Wrapped/Leaderboard links verified. Existing bundle-size/Browserslist warnings remain. Historical usage indexing is still in progress and clearly labeled. No customer email sent during feature QA. Authenticated plugin sync was not performed; existing endpoints retained.

## Release boundary
This branch is based on the previously published baseline e700419. It captures the isolated deployed code, not the larger dirty main workspace. Teams, newer evaluations, marketplace, knowledge/graph and other planned product work remain excluded. No main-workspace reset or stash. Docs-site publication and plugin package updates are separate tasks.

The migration announcement is Discussion #38, published and closed as resolved: https://github.com/waynesutton/opensync/discussions/38

## Follow-up
- [ ] Verify historical usage backfill completion and final totals.
- [ ] Complete actual mobile and authenticated plugin-sync QA.
- [ ] Review this branch before merging; reconcile the separate local future-feature checkout carefully.
- [ ] Publish updated public docs separately and fix published plugin custom-domain validation.
