# Documentation and issue review

Created: 2026-10-04 01:20 UTC
Status: Docs and issue review complete; app activation awaits index backfill; plugin release pending

## Goal
Update published documentation to match the deployed Convex static-hosting release. Review every existing issue and open PR against released code, published plugins and planned work. Fix confirmed regressions with compatibility tests; close only resolved reports with a short comment.

## Release boundary
- Production functions/static assets: `bdb6ad0`; additive staged-index snapshot: `ef0bdd2` on `codex/sync-index-stage`. Tested next app release: `1418d58` on `codex/sync-compatibility-fixes`.
- Docs source: GitHub main `030d4a5` (following audit commit `91eb411`); Mintlify publishes `/docs` from main.
- Main local checkout contains unrelated future work. Do not bulk commit, merge or deploy it.
- Isolated docs checkout: `/tmp/opensync-docs-publication`.
- Isolated app fix checkout: `/tmp/opensync-issue-fixes`.
- Do not send email, delete real user data, publish npm packages or enable planned product features during verification.
- Existing PRD completion marks are historical local claims, not evidence of deployment. Teams, evaluation leaderboard, moderation, knowledge graphs, unified CLI and Docker remain outside this release.

## Task list
- [x] Read all 22 app issues, their comments, both open PRs, and the two OpenCode plugin issues; Claude plugin has no issues.
- [x] Compare the old triage plan with release source and unpublished plugin changes.
- [x] Publish audited docs and navigation; validate MDX, links and live output.
- [x] Reproduce safe backend fixes with regression tests covering adjacent flows.
- [x] Check build, backend types, targeted lint and full release test suite.
- [x] Publish scoped fix branches for review; record deployment status explicitly.
- [x] Comment on plugin-dependent and deferred reports; close verified resolved issues only.
- [x] Record every changed file and final evidence here.
- [ ] Activate PR #39 after the message index is ready; verify live behavior.
- [ ] Reconcile plugin npm/git versions, then prepare a separately scoped package release.

## Issue dependency map

| App issue | Evidence and relationship | Disposition |
| --- | --- | --- |
| #37 maintenance | Migration live; Discussion #38 confirms completion | Closed after live health check |
| #34 SQLite | Reporter provides failed force-sync path; published reader expects JSON | Real plugin bug; keep open, requires plugin release |
| #29 dates/deletion | Single sync partly preserves createdAt; batch rejects timestamps; message updates change session date. Deletion traversal needs review | Real app + plugin dependency; keep open until end-to-end release |
| #18 plain sync | Published CLI checks connectivity and creates a test session; does not import history | Real plugin bug; related #34/#29 |
| #16 usage | Duplicate assistant snapshots and context-vs-cumulative mismatch; cost/duration also reported | Keep open; do not replace usage totals with last context size |
| #14 task notifications | Requires source metadata to distinguish generated text safely | Plugin change; do not strip arbitrary user text in app |
| #13 mobile scroll | Fixed in d8c88bf and included in deployed release | Closed; fix present in deployed source |
| #12 subagents | Needs optional backend fields and plugin metadata together | Valid feature; defer coordinated release |
| #11 first message | Plugin one-shot dedup plus backend five-second drop/parts replacement | Real coupled bug; app regression tests, plugin release still needed |
| #10 untitled | Reporter confirms resync fixed older title bug; SQLite/metadata now separate #34 and plugin #3 | Closed original; follow-ups retained |
| #4 auth/models | Reporter confirms original auth and model fixes; extra graphs/project naming are future requests | Closed original; future scope retained |
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

### Published reviews
- App PR: https://github.com/waynesutton/opensync/pull/39, commit `1418d58`, base `codex/convex-static-hosting-release`.
- Plugin PR: https://github.com/waynesutton/opencode-sync-plugin/pull/5, commit `3b3d156`. No npm publication.
- Production index-only staging succeeded. Activation is waiting for index backfill; old functions continue serving until the atomic deployment completes.
- Automatic approval initially blocked the deploy because a CLI warning suggested a Node runtime change. Read-only runtime inspection returned `nodeVersion: null`; local configuration has no override. Convex CLI 1.46.0 compares null to undefined and prints the blank difference. With this evidence, the review approved the narrowed deployment. No Node version was chosen or upgraded.


## Final publication and verification status

- 2026-10-04 02:18 UTC: Docs commits `91eb411` and `030d4a5` are on main; both Mintlify checks succeeded. In-app browser verified the new static-hosting sidebar and corrected REST API reference. All 33 MDX pages parse, sidebar/internal-link checks pass, and `git diff --check` passes.
- Reviewed all 22 app issues (including closed follow-ups), both pre-existing app PRs and both OpenCode issues. Claude plugin had no open issues. Four reports closed with short comments: #37, #13, #4, #10. Eight app issues remain open: #11, #12, #14, #16, #18, #25, #29, #34. Both plugin issues remain open until publication. No legitimate report was labeled spam.
- App PR #39: https://github.com/waynesutton/opensync/pull/39. Source fixes and 120 tests are ready; **not activated in production**. The additive staged index is building over roughly 11 million messages (about 5% at the latest check). The waiting CLI was stopped with Ctrl-C before finalization; the previously deployed staged index continues building.
- Current production staging is preserved in `ef0bdd2`, branch `codex/sync-index-stage`. Only `messages.by_session_external` was added with `staged: true`; no existing indexes, tables, functions or static assets were removed. No Node runtime upgrade was selected. The CLI's blank Node-version diff came from remote null versus local undefined; read-only evidence is saved below.
- OpenCode PR #5: https://github.com/waynesutton/opencode-sync-plugin/pull/5, commit `3b3d156`. Five tests/build/types/targeted lint pass. No npm package was published; do not tell users the parser fixes are available yet.
- Read-only live checks: frontend, dashboard, public leaderboard, API health and updated docs return 200; unauthenticated session API correctly returns 401. Signed-in dashboard renders usage charts and sessions; owner console renders Admin and People & usage. Frontend JS/CSS filenames remain unchanged. These checks do not prove every production workflow; no emails or destructive customer-data tests were run.
- Additional docs corrections: actual credential locations; plain OpenCode sync creates a connectivity test session; legacy JSON versus SQLite limitation; GET search route, session ID query, batch count/error response, export formats, context response, error strings, search ranking and unsupported quota claims. No private address or secret was published.

## Next steps and release guard

1. Check `messages.by_session_external` in the production Convex dashboard. Wait until backfill finishes; do not delete or recreate the index. Do not redeploy the old release checkout's schema, which lacks the staged index.
2. From the clean `codex/sync-compatibility-fixes` branch, inspect a fresh dry run against **only** `reminiscent-gull-645`. Confirm activation of the additive index and the reviewed sync functions. Then deploy, without uploading a new frontend bundle. Check dashboard/admin, health, sync error logs and idempotency evidence. Update #11 and this PRD after live verification.
3. Before releasing future main-workspace changes, port the reviewed message/session fixes into the split modules and contentHash logic. Reconcile this docs publication with the planned in-app docs work rather than overwriting either tree. Preserve Mintlify until a separate docs-hosting migration is released.
4. Reconcile OpenCode source 0.3.6 with published npm 0.3.7. Release the tested JSONC/metadata fixes only after the version and distribution contents are checked. SQLite, custom-domain login validation, streamed first-message handling and timestamp changes need their own compatible plugin tests.
5. Handle deletion traversal, timestamp/usage attribution and Claude duplicate token snapshots with dedicated regression fixtures before production changes. Keep teams, subagents, Docker and configurable embedding migrations separate from this patch.
6. Follow-up found during docs review: `/api/export/evals` invokes public auth-dependent eval queries from an API-key HTTP action. Add a regression test for this identity boundary before promising API-key eval export or changing authorization. Dashboard export remains the documented path. This suspected defect was not live-tested with private data.

### Exact deployment selector

Use an env file containing only `CONVEX_DEPLOYMENT=prod:reminiscent-gull-645`, with the existing authorized CLI login. From the clean fix checkout run the normal `convex deploy --dry-run --env-file <selector-file>` first, then `convex deploy --env-file <selector-file>` after checking the diff. Do not run from the dirty main workspace or use dev `dapper-raven-705`.

## Evidence

- `docs-issue-review-evidence/static-hosting-live.png` and `api-reference-live.png`: public docs browser proof.
- `docs-issue-review-evidence/live-checks.json`: final public URL checks and unchanged asset filenames.
- `docs-issue-review-evidence/issue-status.json`, `plugin-issue-status.json`, `posted-comments.json`: public issue status and short comment results.
- `docs-issue-review-evidence/node-runtime.json`: read-only runtime comparison evidence, no credentials.
- `docs-issue-review-evidence/changed-files.json`: complete scoped file manifest, separated by checkout. Existing dirty future-work files are excluded.

## Changed-file manifest

### docs published

- `docs/api/authentication.mdx`
- `docs/api/endpoints.mdx`
- `docs/api/errors.mdx`
- `docs/archive/v1/netlify.mdx`
- `docs/auth/workos.mdx`
- `docs/dashboard/admin.mdx`
- `docs/dashboard/context.mdx`
- `docs/dashboard/overview.mdx`
- `docs/dashboard/usage-leaderboard.mdx`
- `docs/docs.json`
- `docs/fork/guide.mdx`
- `docs/getting-started/hosted.mdx`
- `docs/getting-started/quick-start.mdx`
- `docs/getting-started/requirements.mdx`
- `docs/hosting/convex.mdx`
- `docs/hosting/env.mdx`
- `docs/hosting/netlify.mdx`
- `docs/hosting/static-hosting.mdx`
- `docs/index.mdx`
- `docs/plugins/claude-code-sync.mdx`
- `docs/plugins/codex-sync.mdx`
- `docs/plugins/cursor-sync.mdx`
- `docs/plugins/opencode-sync.mdx`
- `docs/search/fulltext.mdx`
- `docs/search/hybrid.mdx`
- `docs/search/semantic.mdx`
- `docs/troubleshooting/common-issues.mdx`
- `docs/troubleshooting/faq.mdx`

### app fix review

- `changelog.md`
- `convex/messages.ts`
- `convex/schema.ts`
- `convex/sessions.ts`
- `convex/syncCompatibility.test.ts`
- `files.md`
- `prds/docs-and-issue-review-2026-10-03.md`
- `task.md`

### plugin fix review

- `changelog.md`
- `files.md`
- `package-lock.json`
- `package.json`
- `prds/verification-and-metadata-fixes.md`
- `src/cli.ts`
- `src/compatibility.ts`
- `src/index.ts`
- `task.md`
- `tests/compatibility.test.ts`
- `tests/live-metadata.test.ts`

### production index stage

- `convex/schema.ts`
- `prds/sync-index-stage.md`

### local tracking

- `prds/docs-and-issue-review-2026-10-03.md`
- `prds/opensync_issue_triage_fixes_1434c6e3.plan.md`
- `prds/issue-triage-fixes-2026-07.md`
- `changelog.md`
- `task.md`
- `files.md`
- `prds/docs-issue-review-evidence/`
