// Banner shown when required environment variables are missing
// Helps users who one-click deployed but haven't completed backend setup
// Also shows a temporary maintenance notice on every page when setup is complete

import { AlertTriangle, ExternalLink } from "lucide-react";

// Temporary maintenance notice. Remove this constant, the URL, and the block below when maintenance is done.
const MAINTENANCE_MESSAGE =
  "OpenSync will have downtime this week for maintenance and upgrades. Apologies for the inconvenience.";
const MAINTENANCE_URL = "https://github.com/waynesutton/opensync/discussions/36";

export function SetupIncompleteBanner() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  const workosClientId = import.meta.env.VITE_WORKOS_CLIENT_ID;

  const missing: string[] = [];
  if (!convexUrl) missing.push("VITE_CONVEX_URL");
  if (!workosClientId) missing.push("VITE_WORKOS_CLIENT_ID");

  // All required env vars are set: show the maintenance notice instead
  if (missing.length === 0) {
    return (
      <div role="status" className="bg-amber-400 px-4 py-2 text-neutral-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-center">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{MAINTENANCE_MESSAGE}</span>
          <a
            href={MAINTENANCE_URL}
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-neutral-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Details
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
        <span className="text-yellow-500">
          Setup incomplete: Missing {missing.join(", ")}.
        </span>
        <a
          href="https://github.com/waynesutton/opensync/blob/main/ONE-CLICK-DEPLOY.md"
          className="inline-flex items-center gap-1 text-yellow-500 hover:text-yellow-400 underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Complete setup
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
