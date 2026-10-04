import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTheme, getThemeClasses } from "../lib/theme";
import { cn } from "../lib/utils";

export type EmailRecipient = { _id: Id<"users">; email: string; name?: string };

// Search stays owner-only on the server; selecting a result never sends mail.
export function RecipientPicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: EmailRecipient | null;
  onSelect: (recipient: EmailRecipient | null) => void;
  disabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const tooManyTerms =
    search
      .trim()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean).length > 16;
  const results = useQuery(
    api.broadcasts.searchRecipients,
    !selected && !tooManyTerms && search.trim().length >= 2
      ? { search: search.trim() }
      : "skip",
  );
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  return (
    <section
      aria-label="Choose one recipient"
      className={cn("rounded border p-3 space-y-2", t.border)}
    >
      {selected ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm break-all">
            To: <strong>{selected.email}</strong>
            {selected.name && ` · ${selected.name}`}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onSelect(null);
              setSearch("");
            }}
            className="text-sm underline"
          >
            Change recipient
          </button>
        </div>
      ) : (
        <>
          <label htmlFor="recipient-search" className="block text-sm">
            Search accounts by name or email
          </label>
          <input
            id="recipient-search"
            type="search"
            autoComplete="off"
            maxLength={254}
            value={search}
            disabled={disabled}
            onChange={(e) => setSearch(e.target.value)}
            aria-describedby="recipient-search-help"
            className={cn(
              "w-full px-3 py-2 rounded border bg-transparent text-sm",
              t.border,
              t.textPrimary,
            )}
          />
          <p id="recipient-search-help" className={cn("text-xs", t.textMuted)}>
            Enter at least 2 characters. Select one existing account.
            Unsubscribed or suppressed accounts cannot receive product updates.
          </p>
          <div role="status" className={cn("text-xs", t.textMuted)}>
            {tooManyTerms
              ? "Use a shorter name or email search."
              : search.trim().length >= 2 &&
                (results === undefined
                  ? "Searching…"
                  : results.recipients.length === 0
                    ? "No matching accounts"
                    : results.hasMore
                      ? "More matches may be available. Refine your search."
                      : `${results.recipients.length} matching accounts`)}
          </div>
          {results && (
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {results.recipients.map((person) => (
                <li key={person._id}>
                  <button
                    type="button"
                    disabled={disabled || !person.eligible}
                    onClick={() => onSelect(person)}
                    aria-label={`Select ${person.email || person.name || "account"}`}
                    className={cn(
                      "w-full text-left rounded p-2 text-sm disabled:opacity-50",
                      t.bgHover,
                    )}
                  >
                    <span className="block break-all">
                      {person.email || "No email address"}
                    </span>
                    {person.name && (
                      <span className={cn("block text-xs", t.textMuted)}>
                        {person.name}
                      </span>
                    )}
                    {person.reason && (
                      <span className="block text-xs">{person.reason}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
