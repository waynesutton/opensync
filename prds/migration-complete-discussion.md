# Migration complete: OpenSync now uses Convex static hosting

Published: 2026-10-04 00:52 UTC
Discussion: https://github.com/waynesutton/opensync/discussions/38
Status: Closed as resolved

The migration is complete. OpenSync now runs on **Convex static hosting**, with the frontend and backend hosted on Convex.

Learn more in the [Convex static-hosting documentation](https://www.convex.dev/components/static-hosting).

For setup, use these custom URLs:

- **Plugin HTTP API:** https://api.opensync.dev
- **Convex client and live connections:** https://app.opensync.dev

Your existing plugin configuration and API key keep working. The setup page includes a compatibility URL for the currently published OpenCode and Claude Code login commands, which still require a Convex URL.

The public usage leaderboard is **opt-in**. Open it from Dashboard or Profile, and choose whether to participate in Profile. Only your first name, rank, recorded token usage, and top model become public; your sessions, prompts, and email stay private.

The migration notice has been removed. Thanks for your patience while we made the move.
