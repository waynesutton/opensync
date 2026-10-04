# Sync index staging

Created: 2026-10-04 02:17 UTC

This branch records the index-only production deployment preceding PR #39. The only application change from bdb6ad0 is the additive staged messages.by_session_external index. Existing functions and static assets remain unchanged.

The index is backfilling a table of about 11 million messages. The activation deploy was interrupted while waiting, before function finalization. Do not deploy the older release schema without this staged index: that would discard backfill progress.

After the Convex dashboard reports the index ready, deploy the tested codex/sync-compatibility-fixes branch (PR #39) to reminiscent-gull-645, then verify health, authenticated dashboard and sync logs. Do not deploy the unrelated dirty main workspace. No frontend upload is required.
