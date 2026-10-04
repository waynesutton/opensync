import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { ArrowUpRight, Check, Shield } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../lib/theme";
import { exactUsage } from "./UsageGauge";
import "../styles/usage-directory.css";

export function UsageLeaderboardPreferences() {
  const preference = useQuery(api.usageDirectory.myPreference, {});
  const { theme } = useTheme();
  return (
    <section
      className="usage-directory usage-preferences"
      data-usage-theme={theme}
      aria-labelledby="usage-profile-title"
    >
      <div className="usage-section-heading">
        <div>
          <h2 id="usage-profile-title">Usage leaderboard</h2>
        </div>
        <Shield size={18} aria-hidden="true" />
      </div>
      {preference === undefined ? (
        <p className="usage-muted" role="status">
          Loading your privacy preference…
        </p>
      ) : (
        <PreferenceForm
          key={`${preference.optedIn}:${preference.firstName}`}
          preference={preference}
        />
      )}
    </section>
  );
}

function PreferenceForm({
  preference,
}: {
  preference: {
    optedIn: boolean;
    firstName: string;
    totalTokens: number;
    topModel: string;
  };
}) {
  const savePreference = useMutation(api.usageDirectory.setPreference);
  const [optedIn, setOptedIn] = useState(preference.optedIn);
  const [firstName, setFirstName] = useState(preference.firstName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const changed =
    optedIn !== preference.optedIn ||
    (optedIn && firstName.trim() !== preference.firstName);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await savePreference({ optedIn, firstName: firstName.trim() });
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof ConvexError && typeof cause.data === "string"
          ? cause.data
          : "Your preference could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void save(event)}>
      <label className="usage-opt-in">
        <input
          type="checkbox"
          checked={optedIn}
          disabled={busy}
          onChange={(event) => {
            setOptedIn(event.target.checked);
            setSaved(false);
          }}
          aria-describedby="usage-privacy-copy"
        />
        <span>Opt in to the public leaderboard</span>
      </label>
      <p id="usage-privacy-copy" className="usage-muted usage-privacy-copy">
        Only your first name, rank, all-time synced token total (including past
        sessions), and top model become public. Sessions, prompts, and email
        stay private. Opting out removes you from the board when you save.
      </p>
      <div className="usage-profile-fields">
        <label className="usage-field">
          Public first name
          <input
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              setSaved(false);
            }}
            maxLength={40}
            autoComplete="given-name"
            disabled={busy || !optedIn}
            required={optedIn}
            aria-describedby="usage-first-name-help"
          />
        </label>
        <p id="usage-first-name-help" className="usage-muted">
          Use only the first name you want people to see (up to 40 characters).
        </p>
      </div>
      {optedIn && (
        <div className="usage-profile-preview">
          <span className="usage-preview-label">
            Public preview · rank assigned after opting in
          </span>
          <div>
            <strong>{firstName.trim() || "Add your first name"}</strong>
            <span>{exactUsage(preference.totalTokens)} tokens</span>
            <span>{preference.topModel || "No model yet"}</span>
          </div>
        </div>
      )}
      <div className="usage-form-actions">
        <button
          className="usage-button usage-button-primary"
          type="submit"
          disabled={busy || !changed || (optedIn && !firstName.trim())}
        >
          {busy ? "Saving…" : "Save preference"}
        </button>
        <Link className="usage-text-link" to="/usage-leaderboard">
          View public leaderboard <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <p className="usage-muted" role="status">
        {saved ? (
          <>
            <Check size={14} aria-hidden="true" /> Preference saved.
          </>
        ) : !changed ? (
          preference.optedIn ? (
            "You are opted in. Your usage summary is public."
          ) : (
            "You are private. Nothing appears on the public board."
          )
        ) : (
          "You have unsaved changes."
        )}
      </p>
      {error && (
        <p role="alert" className="usage-error">
          {error}
        </p>
      )}
    </form>
  );
}
