import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { usePaginatedQuery, useQuery } from "convex/react";
import { ArrowLeft, ArrowUpRight, Moon, Sun, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../lib/theme";
import { exactUsage, formatUsage, UsageGauge } from "../components/UsageGauge";
import "../styles/usage-directory.css";

export function UsageLeaderboardPage() {
  const { theme, toggleTheme } = useTheme();
  const [ordering, setOrdering] = useState("tokens-desc");
  const [modelInput, setModelInput] = useState("");
  const [model, setModel] = useState("");
  const sort = ordering.startsWith("name")
    ? ("name" as const)
    : ("tokens" as const);
  const direction = ordering.endsWith("asc")
    ? ("asc" as const)
    : ("desc" as const);
  const {
    results: entries,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.usageDirectory.publicPage,
    { sort, direction, model: model || undefined },
    { initialNumItems: 100 },
  );
  const maxTokens = entries.reduce(
    (max, person) => Math.max(max, person.totalTokens),
    0,
  );
  const showRank = sort === "tokens" && direction === "desc" && !model;
  function applyModel(event: FormEvent) {
    event.preventDefault();
    setModel(modelInput.trim());
  }
  const indexing = useQuery(api.usageDirectory.publicStatus, {});
  return (
    <div className="usage-directory usage-public-page" data-usage-theme={theme}>
      <header className="usage-public-header">
        <Link to="/" className="usage-text-link">
          <ArrowLeft size={15} aria-hidden="true" /> OpenSync
        </Link>
        <button
          type="button"
          className="usage-icon-button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      <main className="usage-public-main">
        <div className="usage-board-heading">
          <div>
            <h1 className="app-display-title">
              A little usage.
              <br />A lot of building.
            </h1>
          </div>
          <div className="usage-board-intro">
            <p>
              See how the community uses AI. A simple, opt-in leaderboard of
              recorded token usage and favorite models.
            </p>
            <Link to="/profile" className="usage-button usage-button-primary">
              Choose to join <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="usage-board-meta">
          <h2>Usage leaderboard</h2>
          <span>All time · 100 at a time · Updates live</span>
        </div>
        <div className="usage-public-controls">
          <label className="usage-field">
            Sort leaderboard
            <select
              value={ordering}
              onChange={(event) => setOrdering(event.target.value)}
            >
              <option value="tokens-desc">Tokens · highest first</option>
              <option value="tokens-asc">Tokens · lowest first</option>
              <option value="name-asc">First name · A–Z</option>
              <option value="name-desc">First name · Z–A</option>
            </select>
          </label>
          <form onSubmit={applyModel} className="usage-model-filter">
            <label className="usage-field">
              Exact top model
              <input
                value={modelInput}
                onChange={(event) => setModelInput(event.target.value)}
                maxLength={160}
                placeholder="Enter a model name"
              />
            </label>
            <button className="usage-button" type="submit">
              Apply filter
            </button>
            {model && (
              <button
                className="usage-text-link"
                type="button"
                onClick={() => {
                  setModel("");
                  setModelInput("");
                }}
              >
                Clear filter
              </button>
            )}
          </form>
        </div>
        <p className="usage-table-context">
          {showRank
            ? "Ranked by recorded tokens across all opted-in users."
            : "Position in this sorted or filtered view; not a global rank."}
          {model && ` Top model: ${model}.`}
        </p>
        {indexing?.ready === false && (
          <p className="usage-index-status" role="status">
            Historical usage is being indexed. Token totals and rankings are
            incomplete until indexing finishes.
          </p>
        )}
        {status === "LoadingFirstPage" ? (
          <div className="usage-empty" role="status">
            Loading the leaderboard…
          </div>
        ) : entries.length === 0 ? (
          <div className="usage-empty usage-board-empty">
            <Users size={26} aria-hidden="true" />
            <h3>
              {status !== "Exhausted"
                ? "No eligible entries in this batch."
                : model
                  ? "No matches for this model."
                  : "The board starts with a choice."}
            </h3>
            <p>
              {status !== "Exhausted"
                ? "Load more to continue through the leaderboard."
                : model
                  ? "Try another exact model name or clear the filter."
                  : "No public entries yet. Opt in and sync a session to appear."}
            </p>
            {model ? (
              <button
                type="button"
                className="usage-text-link"
                onClick={() => {
                  setModel("");
                  setModelInput("");
                }}
              >
                Clear filter
              </button>
            ) : (
              <Link className="usage-text-link" to="/profile">
                Open your preferences{" "}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
        ) : (
          <div
            className="usage-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Public usage leaderboard"
          >
            <table className="usage-table usage-public-table">
              <thead>
                <tr>
                  <th scope="col">{showRank ? "Rank" : "Position"}</th>
                  <th scope="col">First name</th>
                  <th scope="col" className="usage-number">
                    Tokens
                  </th>
                  <th scope="col">Top model</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((person, index) => (
                  <tr key={index}>
                    <td className="usage-rank">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <th scope="row">{person.firstName}</th>
                    <td className="usage-number">
                      <div
                        className="usage-token-cell"
                        title={`${exactUsage(person.totalTokens)} recorded tokens`}
                      >
                        <UsageGauge
                          value={person.totalTokens}
                          maximum={maxTokens}
                          label={`${exactUsage(person.totalTokens)} tokens, relative to the highest loaded token total`}
                        />
                        <span>{formatUsage(person.totalTokens)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="usage-model-label">
                        {person.topModel || "No model yet"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="usage-table-footer">
          <p role="status">
            {status === "LoadingFirstPage"
              ? "Loading entries…"
              : `${exactUsage(entries.length)} public entries loaded`}
            {status === "Exhausted" ? " · End of results" : ""}
          </p>
          {(status === "CanLoadMore" || status === "LoadingMore") && (
            <button
              className="usage-button"
              type="button"
              disabled={status === "LoadingMore"}
              onClick={() => loadMore(100)}
            >
              {status === "LoadingMore" ? "Loading…" : "Load 100 more"}
            </button>
          )}
        </div>
        <footer className="usage-board-footer">
          <p>
            Only first name, rank, token total, and top model are public.
            Sessions, prompts, and email addresses stay private. You can opt out
            at any time in Profile settings.
          </p>
          <p>
            Tokens are reported by syncing clients. This is a usage summary, not
            a billing total or a measure of skill. Gauges compare each person
            with the highest token total currently loaded.
          </p>
        </footer>
      </main>
    </div>
  );
}
