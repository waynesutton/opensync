import { useDeferredValue, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { usePaginatedQuery, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  ChevronRight,
  Columns3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "../lib/theme";
import { exactUsage, formatUsage, UsageGauge } from "./UsageGauge";
import "../styles/usage-directory.css";

type SortKey = "tokens" | "sessions" | "name" | "model" | "activity" | "joined";
type Visibility = "all" | "public" | "private";
type DirectoryPerson = {
  _id: Id<"users">;
  name: string;
  email: string;
  totalTokens: number;
  sessionCount: number;
  topModel: string;
  lastActiveAt: number;
  joinedAt: number;
  publicOptIn: boolean;
  updatedAt: number;
};
const columnLabels = {
  sessions: "Sessions",
  model: "Top model",
  visibility: "Visibility",
  activity: "Last active",
  joined: "Joined",
};
type OptionalColumn = keyof typeof columnLabels;
const shortDate = (timestamp: number) =>
  timestamp > 0
    ? new Date(timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export function AdminUsageUsers() {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [sort, setSort] = useState<SortKey>("tokens");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [modelInput, setModelInput] = useState("");
  const [model, setModel] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);
  const [columns, setColumns] = useState<Record<OptionalColumn, boolean>>({
    sessions: true,
    model: true,
    visibility: true,
    activity: true,
    joined: true,
  });
  const tooManyTerms =
    deferredSearch.split(/[^\p{L}\p{N}]+/u).filter(Boolean).length > 16;
  const { results, status, loadMore } = usePaginatedQuery(
    api.usageDirectory.list,
    tooManyTerms
      ? "skip"
      : {
          search: deferredSearch,
          sort,
          direction,
          publicOnly:
            visibility === "all" ? undefined : visibility === "public",
          model: model || undefined,
        },
    { initialNumItems: 100 },
  );
  const selected = results.find((person) => person._id === selectedId) ?? null;
  const indexing = useQuery(api.usageDirectory.status, {});
  const maxTokens = results.reduce(
    (max, person) => Math.max(max, person.totalTokens),
    0,
  );
  const searching = Boolean(deferredSearch);
  const firstLoading = status === "LoadingFirstPage";
  const refreshing = search.trim() !== deferredSearch;
  const colSpan = 3 + Object.values(columns).filter(Boolean).length;
  const activeFilters = (visibility !== "all" ? 1 : 0) + (model ? 1 : 0);
  function sortBy(key: SortKey) {
    if (searching) return;
    setDirection(
      sort === key
        ? direction === "desc"
          ? "asc"
          : "desc"
        : key === "name" || key === "model"
          ? "asc"
          : "desc",
    );
    setSort(key);
  }
  function topUsers() {
    setSearch("");
    setSort("tokens");
    setDirection("desc");
    setVisibility("all");
    setModel("");
    setModelInput("");
  }
  function applyModel(event: FormEvent) {
    event.preventDefault();
    setModel(modelInput.trim());
  }
  function filterModel(value: string) {
    setModel(value);
    setModelInput(value);
    setShowFilters(true);
  }
  function sortHeading(key: SortKey, label: string) {
    return (
      <button
        className="usage-sort"
        type="button"
        onClick={() => sortBy(key)}
        disabled={searching}
        title={
          searching
            ? "Clear search to sort all accounts"
            : key === "activity"
              ? "Sort by latest synced session activity; accounts without activity show —"
              : key === "joined"
                ? "Sort by account join date"
                : `Sort by ${label.toLowerCase()}`
        }
      >
        {label}
        {sort === key && !searching ? (
          direction === "desc" ? (
            <ArrowDown size={12} aria-hidden="true" />
          ) : (
            <ArrowUp size={12} aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown size={12} aria-hidden="true" />
        )}
      </button>
    );
  }
  const ariaSort = (key: SortKey) =>
    !searching && sort === key
      ? direction === "asc"
        ? ("ascending" as const)
        : ("descending" as const)
      : ("none" as const);
  return (
    <section
      className="usage-directory"
      data-usage-theme={theme}
      aria-labelledby="usage-users-title"
    >
      <div className="usage-section-heading">
        <div>
          <h2 id="usage-users-title">People & usage</h2>
          <p className="usage-muted">
            Find an account. Understand the usage behind it.
          </p>
        </div>
        <Link to="/usage-leaderboard" className="usage-text-link">
          Public board <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
      {indexing && indexing.phase !== "complete" && (
        <div className="usage-index-status" role="status">
          Preparing historical usage · {exactUsage(indexing.processedUsers)}{" "}
          accounts · {exactUsage(indexing.processedSessions)} sessions
          processed. Totals may be incomplete while this finishes.
        </div>
      )}
      <div className="usage-toolbar">
        <label className="usage-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">
            Search users by first name, last name, full name, or email
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={120}
            placeholder="Search name or email…"
            autoComplete="off"
            aria-describedby="usage-search-help"
          />
        </label>
        <div className="usage-toolbar-actions">
          <button
            className="usage-button"
            type="button"
            onClick={topUsers}
            aria-pressed={
              !search &&
              sort === "tokens" &&
              direction === "desc" &&
              !activeFilters
            }
          >
            Top users
          </button>
          <button
            className="usage-button"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="usage-filter-panel"
          >
            <SlidersHorizontal size={14} aria-hidden="true" /> Filters
            {activeFilters > 0 && (
              <span className="usage-count">{activeFilters}</span>
            )}
          </button>
          <details className="usage-columns">
            <summary className="usage-button">
              <Columns3 size={14} aria-hidden="true" /> Columns
            </summary>
            <fieldset className="usage-columns-menu">
              <legend className="sr-only">Visible table columns</legend>
              {(Object.keys(columnLabels) as OptionalColumn[]).map((key) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={columns[key]}
                    onChange={(event) =>
                      setColumns({ ...columns, [key]: event.target.checked })
                    }
                  />
                  {columnLabels[key]}
                </label>
              ))}
            </fieldset>
          </details>
        </div>
      </div>
      {showFilters && (
        <div id="usage-filter-panel" className="usage-filter-panel">
          <label className="usage-field">
            Leaderboard visibility
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as Visibility)
              }
            >
              <option value="all">All accounts</option>
              <option value="public">Opted in</option>
              <option value="private">Private</option>
            </select>
          </label>
          <form onSubmit={applyModel} className="usage-model-filter">
            <label className="usage-field">
              Exact top model
              <input
                value={modelInput}
                onChange={(event) => setModelInput(event.target.value)}
                maxLength={160}
                placeholder="Select a model below, or enter its name"
              />
            </label>
            <button className="usage-button" type="submit">
              Apply
            </button>
          </form>
          {activeFilters > 0 && (
            <button
              className="usage-text-link"
              type="button"
              onClick={() => {
                setVisibility("all");
                setModel("");
                setModelInput("");
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      )}
      <div className="usage-table-context">
        <p id="usage-search-help">
          {tooManyTerms
            ? "Use a shorter name or email search (up to 16 terms)."
            : searching
              ? "Search results use relevance order. Clear search to sort all accounts."
              : "All-time recorded usage. Select an account to explore its models."}
        </p>
        {model && (
          <button
            type="button"
            className="usage-filter-chip"
            onClick={() => {
              setModel("");
              setModelInput("");
            }}
            aria-label={`Remove top model filter ${model}`}
          >
            {model}
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>
      <div
        className="usage-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Searchable user usage table"
        aria-busy={firstLoading || refreshing}
      >
        <table className="usage-table">
          <thead>
            <tr>
              <th scope="col" className="usage-row-number">
                #
              </th>
              <th scope="col" aria-sort={ariaSort("name")}>
                {sortHeading("name", "Account")}
              </th>
              <th
                scope="col"
                aria-sort={ariaSort("tokens")}
                className="usage-number"
              >
                {sortHeading("tokens", "Tokens")}
              </th>
              {columns.sessions && (
                <th
                  scope="col"
                  aria-sort={ariaSort("sessions")}
                  className="usage-number"
                >
                  {sortHeading("sessions", "Sessions")}
                </th>
              )}
              {columns.model && (
                <th scope="col" aria-sort={ariaSort("model")}>
                  {sortHeading("model", "Top model")}
                </th>
              )}
              {columns.visibility && <th scope="col">Visibility</th>}
              {columns.activity && (
                <th scope="col" aria-sort={ariaSort("activity")}>
                  {sortHeading("activity", "Last active")}
                </th>
              )}
              {columns.joined && (
                <th scope="col" aria-sort={ariaSort("joined")}>
                  {sortHeading("joined", "Joined")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {tooManyTerms ? (
              <tr>
                <td colSpan={colSpan} className="usage-empty">
                  Shorten your search to see matching users.
                </td>
              </tr>
            ) : firstLoading ? (
              <tr>
                <td colSpan={colSpan} className="usage-empty" role="status">
                  Loading accounts…
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="usage-empty">
                  <strong>No accounts in this view.</strong>
                  <span>
                    {search || activeFilters
                      ? "Try another name or clear the filters."
                      : "Accounts appear here after their first sign-in."}
                  </span>
                </td>
              </tr>
            ) : (
              results.map((person, index) => (
                <tr
                  key={person._id}
                  data-selected={selected?._id === person._id || undefined}
                >
                  <td className="usage-row-number">{index + 1}</td>
                  <th scope="row">
                    <button
                      className="usage-person"
                      type="button"
                      onClick={() =>
                        setSelectedId(
                          selectedId === person._id ? null : person._id,
                        )
                      }
                      aria-expanded={selected?._id === person._id}
                      aria-controls="usage-account-details"
                    >
                      <span className="usage-person-initial" aria-hidden="true">
                        {(person.name || person.email || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      <span>
                        <strong>{person.name || "Unnamed account"}</strong>
                        <span>{person.email || "No email address"}</span>
                      </span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </th>
                  <td className="usage-number">
                    <div
                      className="usage-token-cell"
                      title={`${exactUsage(person.totalTokens)} recorded tokens`}
                    >
                      <UsageGauge
                        value={person.totalTokens}
                        maximum={maxTokens}
                        label={`${exactUsage(person.totalTokens)} tokens, relative to the highest loaded account`}
                      />
                      <span>{formatUsage(person.totalTokens)}</span>
                    </div>
                  </td>
                  {columns.sessions && (
                    <td className="usage-number">
                      {exactUsage(person.sessionCount)}
                    </td>
                  )}
                  {columns.model && (
                    <td>
                      {person.topModel ? (
                        <button
                          type="button"
                          className="usage-model-chip"
                          onClick={() => filterModel(person.topModel)}
                          title={`Filter to accounts whose top model is ${person.topModel}`}
                        >
                          {person.topModel}
                        </button>
                      ) : (
                        <span className="usage-muted">—</span>
                      )}
                    </td>
                  )}
                  {columns.visibility && (
                    <td>
                      <span
                        className={`usage-visibility ${person.publicOptIn ? "is-public" : ""}`}
                      >
                        <span aria-hidden="true" />
                        {person.publicOptIn ? "Opted in" : "Private"}
                      </span>
                    </td>
                  )}
                  {columns.activity && (
                    <td className="usage-date">
                      {shortDate(person.lastActiveAt)}
                    </td>
                  )}
                  {columns.joined && (
                    <td className="usage-date">{shortDate(person.joinedAt)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="usage-table-footer">
        <p role="status">
          {firstLoading
            ? "Loading…"
            : `${exactUsage(results.length)} accounts loaded`}
          {status === "Exhausted" && results.length > 0
            ? " · End of results"
            : ""}
        </p>
        {status === "CanLoadMore" || status === "LoadingMore" ? (
          <button
            className="usage-button"
            type="button"
            onClick={() => loadMore(100)}
            disabled={status === "LoadingMore"}
          >
            {status === "LoadingMore" ? "Loading…" : "Load 100 more accounts"}
          </button>
        ) : null}
      </div>
      <p className="usage-data-note">
        Gauges compare tokens with the highest account currently loaded; they
        are not quotas. Tokens are reported by syncing clients and may differ
        from provider billing. Account details and emails are visible only to
        authorized owners.
      </p>
      {selected && (
        <UserDetails
          person={selected}
          onClose={() => setSelectedId(null)}
          onFilterModel={filterModel}
        />
      )}
    </section>
  );
}

function UserDetails({
  person,
  onClose,
  onFilterModel,
}: {
  person: DirectoryPerson;
  onClose: () => void;
  onFilterModel: (model: string) => void;
}) {
  const details = useQuery(api.usageDirectory.details, {
    userId: person._id,
    month: new Date().toISOString().slice(0, 7),
  });
  const [period, setPeriod] = useState<"all" | "recent">("all");
  const maxTokens =
    details?.models.reduce((max, item) => Math.max(max, item.tokens), 0) ?? 0;
  return (
    <section
      className="usage-details"
      id="usage-account-details"
      aria-labelledby="usage-detail-title"
    >
      <div className="usage-section-heading">
        <div>
          <h3 id="usage-detail-title">{person.name || "Unnamed account"}</h3>
          <p className="usage-muted">{person.email || "No email address"}</p>
        </div>
        <button
          className="usage-icon-button"
          type="button"
          onClick={onClose}
          aria-label="Close account details"
        >
          <X size={18} />
        </button>
      </div>
      <div className="usage-detail-tabs" aria-label="Model usage period">
        <button
          type="button"
          className="usage-button"
          aria-pressed={period === "all"}
          onClick={() => setPeriod("all")}
        >
          Top 10 models · all time
        </button>
        <button
          type="button"
          className="usage-button"
          aria-pressed={period === "recent"}
          onClick={() => setPeriod("recent")}
        >
          Recent 6 months
        </button>
      </div>
      {details === undefined ? (
        <p className="usage-empty" role="status">
          Loading model usage…
        </p>
      ) : period === "all" ? (
        details.models.length === 0 ? (
          <p className="usage-empty">No model usage recorded yet.</p>
        ) : (
          <div className="usage-model-list">
            {details.models.map((item) => (
              <div key={item.model} className="usage-model-item">
                <UsageGauge
                  value={item.tokens}
                  maximum={maxTokens}
                  label={`${exactUsage(item.tokens)} tokens, relative to this account’s top model`}
                />
                <button
                  type="button"
                  className="usage-text-link"
                  onClick={() => onFilterModel(item.model)}
                  title="Filter directory by this top model"
                >
                  {item.model || "Unknown model"}
                </button>
                <span>{exactUsage(item.tokens)} tokens</span>
                <span className="usage-muted">
                  {exactUsage(item.sessions)} sessions
                </span>
              </div>
            ))}
          </div>
        )
      ) : details.months.length === 0 ? (
        <p className="usage-empty">No usage in the past six months.</p>
      ) : (
        <div className="usage-months">
          {details.months.map((month) => (
            <section key={month.month}>
              <h4>
                {new Date(`${month.month}-01T00:00:00Z`).toLocaleDateString(
                  undefined,
                  { month: "long", year: "numeric", timeZone: "UTC" },
                )}
              </h4>
              {month.models.length === 0 && (
                <p className="usage-muted">No sessions started.</p>
              )}
              {month.models.map((item) => (
                <div key={item.model} className="usage-month-model">
                  <span>{item.model || "Unknown model"}</span>
                  <span>{formatUsage(item.tokens)} tokens</span>
                  <span className="usage-muted">
                    {exactUsage(item.sessions)} sessions
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
      <p className="usage-data-note">
        Up to 10 models per period, ordered by tokens. Model totals use each
        session’s recorded model. Monthly history groups sessions by creation
        month, not the date each token was used. Select a model to filter the
        directory.
      </p>
    </section>
  );
}
