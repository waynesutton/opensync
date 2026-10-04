# Documentation and issue review

Created: 2026-10-04 01:20 UTC
Status: In progress

## Goal
Update published documentation to match the deployed Convex static-hosting release. Review every existing issue and open PR against released code, published plugins and planned work. Fix confirmed regressions with compatibility tests; close only resolved reports with a short comment.

## Release boundary
- Production source: `bdb6ad0` on `codex/convex-static-hosting-release`.
- Docs source: GitHub main `af4ae24`; Mintlify publishes `/docs` from main.
- Main local checkout contains unrelated future work. Do not bulk commit, merge or deploy it.
- Isolated docs checkout: `/tmp/opensync-docs-publication`.
- Isolated app fix checkout: `/tmp/opensync-issue-fixes`.
- Do not send email, delete real user data, publish npm packages or enable planned product features during verification.
- Existing PRD completion marks are historical local claims, not evidence of deployment. Teams, evaluation leaderboard, moderation, knowledge graphs, unified CLI and Docker remain outside this release.

## Task list
- [x] Read all 22 app issues, their comments, both open PRs, and the two OpenCode plugin issues; Claude plugin has no issues.
- [x] Compare the old triage plan with release source and unpublished plugin changes.
- [ ] Publish audited docs and navigation; validate MDX, links and live output.
- [ ] Reproduce safe backend fixes with regression tests covering adjacent flows.
- [ ] Check build, backend types, targeted lint and full release test suite.
- [ ] Publish scoped fix branches for review; record deployment status explicitly.
- [ ] Comment on plugin-dependent and deferred reports; close verified resolved issues only.
- [ ] Record every changed file and final evidence here.

## Issue dependency map

| App issue | Evidence and relationship | Disposition |
| --- | --- | --- |
| #37 maintenance | Migration live; Discussion #38 confirms completion | Close after live health check |
| #34 SQLite | Reporter provides failed force-sync path; published reader expects JSON | Real plugin bug; keep open, requires plugin release |
| #29 dates/deletion | Single sync partly preserves createdAt; batch rejects timestamps; message updates change session date. Deletion traversal needs review | Real app + plugin dependency; keep open until end-to-end release |
| #18 plain sync | Published CLI does connectivity-only path | Real plugin bug; related #34/#29 |
| #16 usage | Duplicate assistant snapshots and context-vs-cumulative mismatch; cost/duration also reported | Keep open; do not replace usage totals with last context size |
| #14 task notifications | Requires source metadata to distinguish generated text safely | Plugin change; do not strip arbitrary user text in app |
| #13 mobile scroll | Fixed in d8c88bf and included in deployed release | Verify source and close |
| #12 subagents | Needs optional backend fields and plugin metadata together | Valid feature; defer coordinated release |
| #11 first message | Plugin one-shot dedup plus backend five-second drop/parts replacement | Real coupled bug; app regression tests, plugin release still needed |
| #10 untitled | Reporter confirms resync fixed older title bug; SQLite/metadata now separate #34 and plugin #3 | Close original after package/source check, retain follow-ups |
| #4 auth/models | Reporter confirms original auth and model fixes; extra graphs/project naming are future requests | Close original, preserve future scope |
| #25 teams | Future local code exists; owner console does not implement team membership/roles | Keep open; correct older plan's shipped claim |
| #32 closed | Session totals must not accumulate per-message usage | Regression guard for #16/#11 |
| #30/#17 closed | Batch account/data deletion; follow-up error in #29 | Recheck traversal/ownership without deleting real data |
| #28/#1 closed | Existing auth and callback behavior | Preserve unchanged, docs align actual integration |
| #21 closed | Cursor plugin exists; docs package name incorrect | Fix docs package name |
| #15/#2 closed | Provider metadata depends on plugin parser | Link plugin #3, preserve valid existing values |
| #8/#7 closed | Claude output/parts; #7 has unresolved follow-up reports | Keep tracked with #16, no false claim of new resolution |
| PR #35 | Configurable embedding model/base URL; dimensions and reindexing matter | Keep open for dedicated model-compatible migration |
| PR #31 | Alternative Docker packaging; Vite build config required | Keep open; not part of Convex static hosting release |
| OpenCode #3 | Missing directory/nested model/provider extraction | Valid; plugin release required |
| OpenCode #1 | JSONC supported, version-suffixed plugin registration still fails | Valid remaining bug; plugin release required |

## Safety checks
- Compare single and batch sync; preserve legacy payloads and token totals.
- Keep account ownership across identical external IDs and session boundaries.
- Preserve message parts when omitted; replace only explicit snapshots; accept rapid content growth.
- Date repair must preserve ordering, usage month attribution and repeated-sync idempotency.
- Deletion must progress beyond initial sessions and stay below transaction limits.
- Publishing docs must not deploy app code or delete Mintlify configuration/assets.
- Public leaderboard consent remains off by default; no private session data in public guides.

## Change and verification log
- 2026-10-04 01:20 UTC: created tracker; inventory saved in `/tmp/opensync-issues-audit.json`, `/tmp/opencode-issues-audit.json`, `/tmp/claude-issues-audit.json`. No issue is treated as spam without evidence; reports reviewed contain concrete repros or legitimate requests.

### Confirmed fixes and validation
- Docs-only commit `91eb411` published 27 files. Mintlify check succeeded; in-app browser verified `/hosting/static-hosting` and navigation. All 33 MDX pages parse; internal links and sidebar targets resolve. Evidence: `docs-issue-review-evidence/static-hosting-live.png`.
- App release fixes: `convex/messages.ts`, `convex/sessions.ts`, `convex/schema.ts`, `convex/syncCompatibility.test.ts`. Seven message regressions cover rapid content, omitted/explicit parts, owner isolation, duplicate IDs and exact retries; four session cases cover provider/cost/completion dedup. Existing 109 tests plus 11 new cases pass (120 total). Backend types, frontend build/typecheck and targeted control-flow lint pass.
- Plugin fixes: JSONC parser and versioned registration recognition; nested and flat model/provider fields; directory passthrough on idle sync. Five tests pass, including a built-plugin event with synthetic filesystem and mocked fetch. No real session read or upload. Plugin build/types and targeted lint pass.
- npm currently publishes OpenCode 0.3.7 while repository main says 0.3.6. Do not publish from that old package version. Reconcile npm/git and bump deliberately; SDK/SQLite work in the adjacent local checkout remains excluded.

### Future-work collision review
- `convex/messages.ts` in the dirty main workspace still has the old external-ID lookup and time-window dedup, plus future contentHash logic. Port the reviewed fix deliberately before releasing that branch; a bulk overwrite would either reintroduce this regression or discard future work.
- Date repair (#29/#18) changes monthly usage attribution. It needs single/batch/message timestamps tested together with ledger reconciliation and a compatible plugin release.
- Deletion traversal inspects only an initial subset of sessions/messages and can leave children behind. Its replacement needs bounded continuation and account-deletion retry/concurrency tests. No destructive live test was run.
- Claude usage (#16) must deduplicate repeated snapshots by request/message identity while preserving cumulative request usage. The last context-window size is not cumulative usage. Cost/duration need separate verification; closed #7 has unresolved follow-up comments.
- Subagents (#12) require optional backend fields and plugin metadata together. Teams (#25) remain planned. Neither is enabled by the owner console.
- PR #35 needs all embedding generation/search paths to agree on model and vector space (currently 1536 dimensions), with a reindex plan. PR #31 is legitimate alternative deployment work but needs public Vite values at build time; neither PR is spam or resolved by this migration.
