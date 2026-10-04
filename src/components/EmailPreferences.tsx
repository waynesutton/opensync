import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme, getThemeClasses } from "../lib/theme";
import { cn } from "../lib/utils";
// Changing a preference never queues an email.
export function EmailPreferences() {
  const optedOut = useQuery(api.broadcasts.getEmailUpdatesOptOut);
  const setPreference = useMutation(api.broadcasts.setEmailUpdatesOptOut);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  async function change(optOut: boolean) {
    setBusy(true); setError(null);
    try { await setPreference({ optOut }); }
    catch { setError("Could not save your preference. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className={cn("mt-8 p-4 border rounded-lg", t.border, t.bgCard)}>
    <h2 className={cn("text-sm mb-2", t.textPrimary)}>Product update emails</h2>
    <label className={cn("flex gap-3 items-center text-sm", t.textMuted)}><input type="checkbox" checked={optedOut === false} disabled={optedOut === undefined || busy} onChange={e => void change(!e.target.checked)} />Receive occasional OpenSync product updates</label>
    <p className={cn("text-xs mt-2", t.textMuted)}>You can unsubscribe here or from any product update email.</p>
    {error && <p role="alert" className="text-sm text-red-500 mt-2">{error}</p>}
  </section>;
}
