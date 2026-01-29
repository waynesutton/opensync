import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { getSourceLabel, getSourceColorClass } from "../lib/source";
import { useTheme, getThemeClasses } from "../lib/theme";
import { StatCard } from "../components/Charts";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Download,
  MessageSquare,
  X,
  FileDown,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Star,
  Check,
  XCircle,
  HelpCircle,
  Calendar,
  Filter,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// AI Coding Agents configuration
const AI_AGENTS_MAP: Record<string, string> = {
  opencode: "OpenCode",
  "claude-code": "Claude Code",
  "factory-droid": "Factory Droid",
  "cursor-sync": "Cursor",
  cursor: "Cursor",
  pi: "Pi",
  "codex-cli": "Codex CLI",
  continue: "Continue",
  amp: "Amp",
  aider: "Aider",
  goose: "Goose",
  mentat: "Mentat",
  cline: "Cline",
  "kilo-code": "Kilo Code",
};

const DEFAULT_ENABLED_AGENTS = ["opencode", "claude-code"];
const ITEMS_PER_PAGE = 50;

// Eval status configuration
type EvalStatus = "golden" | "correct" | "incorrect" | "needs_review";
const EVAL_STATUS_CONFIG: Record<
  EvalStatus,
  { label: string; icon: typeof Star; color: string }
> = {
  golden: { label: "Golden", icon: Star, color: "text-amber-500" },
  correct: { label: "Correct", icon: Check, color: "text-emerald-500" },
  incorrect: { label: "Incorrect", icon: XCircle, color: "text-red-500" },
  needs_review: { label: "Review", icon: HelpCircle, color: "text-blue-500" },
};

// Turn mode options
type TurnMode = "full" | "per_turn" | "final_only";
const TURN_MODE_OPTIONS: Array<{
  value: TurnMode;
  label: string;
  desc: string;
}> = [
  {
    value: "per_turn",
    label: "Per Turn",
    desc: "Each user-assistant pair as separate test case",
  },
  {
    value: "full",
    label: "Full Conversation",
    desc: "Entire session as one test case",
  },
  {
    value: "final_only",
    label: "Final Turn Only",
    desc: "Only the last exchange",
  },
];

// Export format type
type ExportFormat = "deepeval" | "openai" | "promptfoo" | "filesystem";

// Source badge component (compact)
function SourceBadge({
  source,
  theme,
}: {
  source?: string;
  theme: "dark" | "tan";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1 py-0.5 text-[9px] font-medium rounded",
        getSourceColorClass(source, { theme }),
      )}
    >
      {getSourceLabel(source, true)}
    </span>
  );
}

// Status badge component (compact)
function StatusBadge({ status }: { status?: EvalStatus }) {
  if (!status) return null;
  const config = EVAL_STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[9px] font-medium",
        config.color,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

// Status dropdown component (compact)
function StatusDropdown({
  value,
  onChange,
  theme,
}: {
  value?: EvalStatus;
  onChange: (status: EvalStatus | undefined) => void;
  theme: "dark" | "tan";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === "dark";

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] rounded border transition-colors",
          isDark
            ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            : "border-[#e6e4e1] bg-white hover:bg-[#f5f3f0]",
        )}
      >
        {value ? (
          <StatusBadge status={value} />
        ) : (
          <span className={isDark ? "text-zinc-500" : "text-[#999]"}>
            Status
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-2.5 w-2.5",
            isDark ? "text-zinc-500" : "text-[#999]",
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "absolute top-full left-0 mt-1 w-28 rounded-md border shadow-lg z-50",
              isDark
                ? "bg-zinc-800 border-zinc-700"
                : "bg-white border-[#e6e4e1]",
            )}
          >
            {(
              Object.entries(EVAL_STATUS_CONFIG) as [
                EvalStatus,
                (typeof EVAL_STATUS_CONFIG)[EvalStatus],
              ][]
            ).map(([status, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value === status ? undefined : status);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] transition-colors",
                    value === status
                      ? isDark
                        ? "bg-zinc-700"
                        : "bg-[#ebe9e6]"
                      : isDark
                        ? "hover:bg-zinc-700"
                        : "hover:bg-[#f5f3f0]",
                  )}
                >
                  <Icon className={cn("h-3 w-3", config.color)} />
                  <span className={isDark ? "text-zinc-200" : "text-[#1a1a1a]"}>
                    {config.label}
                  </span>
                </button>
              );
            })}
            {value && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] border-t transition-colors",
                  isDark
                    ? "border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                    : "border-[#e6e4e1] text-[#6b6b6b] hover:bg-[#f5f3f0]",
                )}
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function EvalsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // Filter state
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  const [tagFilter, setTagFilter] = useState<string | undefined>();
  const [modelFilter, setModelFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<EvalStatus | undefined>();
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination state
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Selection state
  const [selectedSessions, setSelectedSessions] = useState<Set<Id<"sessions">>>(
    new Set(),
  );

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("deepeval");
  const [turnMode, setTurnMode] = useState<TurnMode>("per_turn");
  const [exportOptions, setExportOptions] = useState({
    includeSystemPrompts: false,
    includeToolCalls: true,
    anonymizePaths: true,
    codeBlocksOnly: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const currentUser = useQuery(api.users.me);
  const enabledAgents = currentUser?.enabledAgents ?? DEFAULT_ENABLED_AGENTS;

  // Convert date strings to timestamps
  const dateFromTs = dateFromFilter
    ? new Date(dateFromFilter).getTime()
    : undefined;
  const dateToTs = dateToFilter
    ? new Date(dateToFilter + "T23:59:59").getTime()
    : undefined;

  const evalData = useQuery(api.evals.listEvalSessions, {
    source: sourceFilter,
    tags: tagFilter ? [tagFilter] : undefined,
    model: modelFilter,
    dateFrom: dateFromTs,
    dateTo: dateToTs,
    evalStatus: statusFilter,
  });
  const allTags = useQuery(api.evals.getEvalTags);
  const allModels = useQuery(api.evals.getEvalModels);

  // Preview data for export modal
  const previewData = useQuery(
    api.evals.previewExport,
    showExportModal
      ? {
          sessionIds:
            selectedSessions.size > 0 ? Array.from(selectedSessions) : "all",
          source: sourceFilter,
          model: modelFilter,
          dateFrom: dateFromTs,
          dateTo: dateToTs,
          evalStatus: statusFilter,
        }
      : "skip",
  );

  // Mutations
  const updateEvalStatus = useMutation(api.evals.updateEvalStatus);
  const bulkUpdateEvalStatus = useMutation(api.evals.bulkUpdateEvalStatus);
  const generateExport = useAction(api.evals.generateEvalExport);

  // Computed
  const allSessions = evalData?.sessions || [];
  const sessions = allSessions.slice(0, displayCount);
  const hasMore = allSessions.length > displayCount;
  const stats = evalData?.stats || {
    total: 0,
    bySource: {
      opencode: 0,
      claudeCode: 0,
      factoryDroid: 0,
      codexCli: 0,
      cursor: 0,
    },
    byStatus: { golden: 0, correct: 0, incorrect: 0, needsReview: 0, unset: 0 },
    totalTestCases: 0,
  };

  const hasActiveFilters =
    sourceFilter ||
    tagFilter ||
    modelFilter ||
    statusFilter ||
    dateFromFilter ||
    dateToFilter;

  // Handlers
  const handleSelectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(sessions.map((s) => s._id)));
    }
  };

  const handleToggleSession = (sessionId: Id<"sessions">) => {
    const newSet = new Set(selectedSessions);
    if (newSet.has(sessionId)) {
      newSet.delete(sessionId);
    } else {
      newSet.add(sessionId);
    }
    setSelectedSessions(newSet);
  };

  const handleStatusChange = async (
    sessionId: Id<"sessions">,
    status: EvalStatus | undefined,
  ) => {
    await updateEvalStatus({ sessionId, evalStatus: status });
  };

  const handleBulkStatusChange = async (status: EvalStatus | undefined) => {
    if (selectedSessions.size === 0) return;
    await bulkUpdateEvalStatus({
      sessionIds: Array.from(selectedSessions),
      evalStatus: status,
    });
    setSelectedSessions(new Set());
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleExport = async () => {
    if (allSessions.length === 0) return;

    setIsExporting(true);
    try {
      const sessionIds =
        selectedSessions.size > 0
          ? Array.from(selectedSessions)
          : ("all" as const);

      const result = await generateExport({
        sessionIds,
        format: exportFormat,
        options: {
          ...exportOptions,
          turnMode,
        },
      });

      // Download the file
      const mimeType =
        exportFormat === "openai" || exportFormat === "promptfoo"
          ? "application/jsonl"
          : "application/json";
      const blob = new Blob([result.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSourceFilter(undefined);
    setTagFilter(undefined);
    setModelFilter(undefined);
    setStatusFilter(undefined);
    setDateFromFilter("");
    setDateToFilter("");
    setDisplayCount(ITEMS_PER_PAGE);
  };

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden", t.bgPrimary)}>
      {/* Header */}
      <header
        className={cn(
          "h-11 border-b flex items-center px-3 gap-3 shrink-0",
          t.border,
          t.bgPrimary,
        )}
      >
        <Link
          to="/"
          className={cn("font-normal text-sm tracking-tight", t.textSecondary)}
        >
          opensync
        </Link>

        <button
          onClick={() => navigate("/")}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded transition-colors",
            t.textSubtle,
            t.bgHover,
          )}
        >
          <ArrowLeft className="h-2.5 w-2.5" />
          Back
        </button>

        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            t.textPrimary,
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Evals
        </div>

        <div className="flex-1" />

        <button
          onClick={toggleTheme}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            t.bgHover,
            t.textSubtle,
          )}
          title={`Switch to ${theme === "dark" ? "tan" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>

        <Link
          to="/settings"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            t.bgHover,
            t.textSubtle,
          )}
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>

        <div className="relative group">
          <button
            className={cn(
              "flex items-center gap-1.5 px-1.5 py-0.5 rounded-md",
              t.bgHover,
            )}
          >
            <User className={cn("h-3.5 w-3.5", t.textSubtle)} />
            <span className={cn("text-[10px]", t.textSubtle)}>
              {user?.firstName || "User"}
            </span>
          </button>
          <div
            className={cn(
              "absolute right-0 top-full mt-1 w-32 rounded-md border shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity",
              t.bgDropdown,
              t.border,
            )}
          >
            <button
              onClick={() => signOut()}
              className={cn(
                "w-full px-2 py-1.5 text-left text-[10px] flex items-center gap-1.5 rounded-md",
                t.textSubtle,
                t.bgHover,
              )}
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content - hidden scrollbar */}
      <main
        className="flex-1 overflow-auto p-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        <div className="max-w-5xl mx-auto space-y-3">
          {/* Compact stats row */}
          <div className="grid grid-cols-5 gap-2">
            <StatCard label="Sessions" value={stats.total} theme={theme} />
            <StatCard
              label="Test Cases"
              value={stats.totalTestCases}
              theme={theme}
            />
            <StatCard
              label="Golden"
              value={stats.byStatus.golden}
              theme={theme}
            />
            <StatCard
              label="Correct"
              value={stats.byStatus.correct}
              theme={theme}
            />
            <StatCard
              label="Review"
              value={stats.byStatus.needsReview + stats.byStatus.unset}
              theme={theme}
            />
          </div>

          {/* Compact filters bar */}
          <div className={cn("p-2 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Source filter */}
              <select
                value={sourceFilter || ""}
                onChange={(e) => setSourceFilter(e.target.value || undefined)}
                className={cn(
                  "text-[10px] px-1.5 py-1 rounded border",
                  t.bgInput,
                  t.border,
                  t.textPrimary,
                )}
              >
                <option value="">Source</option>
                {enabledAgents.map((agentId) => (
                  <option key={agentId} value={agentId}>
                    {AI_AGENTS_MAP[agentId] || agentId}
                  </option>
                ))}
              </select>

              {/* Model filter */}
              {allModels && allModels.length > 0 && (
                <select
                  value={modelFilter || ""}
                  onChange={(e) => setModelFilter(e.target.value || undefined)}
                  className={cn(
                    "text-[10px] px-1.5 py-1 rounded border max-w-[100px]",
                    t.bgInput,
                    t.border,
                    t.textPrimary,
                  )}
                >
                  <option value="">Model</option>
                  {allModels.map((model) => (
                    <option key={model} value={model}>
                      {model.length > 15 ? model.slice(0, 15) + "..." : model}
                    </option>
                  ))}
                </select>
              )}

              {/* Status filter */}
              <select
                value={statusFilter || ""}
                onChange={(e) =>
                  setStatusFilter(
                    (e.target.value || undefined) as EvalStatus | undefined,
                  )
                }
                className={cn(
                  "text-[10px] px-1.5 py-1 rounded border",
                  t.bgInput,
                  t.border,
                  t.textPrimary,
                )}
              >
                <option value="">Status</option>
                <option value="golden">Golden</option>
                <option value="correct">Correct</option>
                <option value="incorrect">Incorrect</option>
                <option value="needs_review">Review</option>
              </select>

              {/* Tag filter */}
              {allTags && allTags.length > 0 && (
                <select
                  value={tagFilter || ""}
                  onChange={(e) => setTagFilter(e.target.value || undefined)}
                  className={cn(
                    "text-[10px] px-1.5 py-1 rounded border max-w-[80px]",
                    t.bgInput,
                    t.border,
                    t.textPrimary,
                  )}
                >
                  <option value="">Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              )}

              {/* More filters */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-1 text-[10px] rounded border transition-colors",
                  showAdvancedFilters
                    ? isDark
                      ? "border-zinc-600 bg-zinc-700"
                      : "border-[#8b7355] bg-[#ebe9e6]"
                    : t.border,
                  t.textSubtle,
                  t.bgHover,
                )}
              >
                <Filter className="h-2.5 w-2.5" />
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className={cn(
                    "text-[10px] flex items-center gap-0.5",
                    t.textSubtle,
                    "hover:opacity-80",
                  )}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}

              <div className="flex-1" />

              {/* Bulk actions */}
              {selectedSessions.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-[10px]", t.textSubtle)}>
                    {selectedSessions.size}
                  </span>
                  <StatusDropdown
                    value={undefined}
                    onChange={(status) => handleBulkStatusChange(status)}
                    theme={theme}
                  />
                </div>
              )}

              {/* Select all */}
              {sessions.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    "text-[10px] px-1.5 py-1 rounded border",
                    t.border,
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  {selectedSessions.size === sessions.length ? "None" : "All"}
                </button>
              )}

              {/* Export button */}
              <button
                onClick={() => setShowExportModal(true)}
                disabled={allSessions.length === 0}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors",
                  allSessions.length === 0
                    ? "opacity-50 cursor-not-allowed bg-zinc-700 text-zinc-400"
                    : isDark
                      ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                      : "bg-[#1a1a1a] text-white hover:bg-[#333]",
                )}
              >
                <FileDown className="h-3 w-3" />
                Export
              </button>
            </div>

            {/* Advanced filters row */}
            {showAdvancedFilters && (
              <div
                className={cn(
                  "flex items-center gap-2 pt-2 mt-2 border-t",
                  t.border,
                )}
              >
                <Calendar className={cn("h-3 w-3", t.textSubtle)} />
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    t.bgInput,
                    t.border,
                    t.textPrimary,
                  )}
                />
                <span className={cn("text-[10px]", t.textSubtle)}>to</span>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    t.bgInput,
                    t.border,
                    t.textPrimary,
                  )}
                />
              </div>
            )}
          </div>

          {/* Sessions list */}
          {sessions.length === 0 ? (
            <div
              className={cn(
                "text-center py-12 rounded-lg border",
                t.bgCard,
                t.border,
              )}
            >
              <CheckCircle2
                className={cn("h-10 w-10 mx-auto mb-3", t.iconMuted)}
              />
              <p className={cn("text-xs font-medium mb-1", t.textPrimary)}>
                No eval sessions yet
              </p>
              <p className={cn("text-[10px] mb-3", t.textSubtle)}>
                Mark sessions as eval-ready from Dashboard
              </p>
              <Link
                to="/"
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded",
                  isDark
                    ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                    : "bg-[#1a1a1a] text-white hover:bg-[#333]",
                )}
              >
                <ArrowLeft className="h-3 w-3" />
                Sessions
              </Link>
            </div>
          ) : (
            <div className={cn("rounded-lg border overflow-hidden", t.border)}>
              {/* Table header - compact */}
              <div
                className={cn(
                  "flex items-center px-2 py-1.5 text-[10px] font-medium border-b gap-2",
                  t.bgSecondary,
                  t.border,
                  t.textSubtle,
                )}
              >
                <div className="w-5 shrink-0">
                  <input
                    type="checkbox"
                    checked={
                      selectedSessions.size === sessions.length &&
                      sessions.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded h-3 w-3"
                  />
                </div>
                <div className="flex-1 min-w-0">Session</div>
                <div className="w-10 text-center shrink-0">Src</div>
                <div className="w-20 shrink-0 hidden sm:block">Model</div>
                <div className="w-8 text-center shrink-0">Msg</div>
                <div className="w-16 shrink-0">Status</div>
                <div className="w-12 text-right shrink-0">Date</div>
              </div>

              {/* Table rows - compact CRM style */}
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className={cn(
                    "flex items-center px-2 py-1.5 text-[10px] border-b last:border-b-0 gap-2 transition-colors",
                    t.border,
                    selectedSessions.has(session._id)
                      ? t.bgActive
                      : "hover:bg-opacity-50",
                  )}
                >
                  <div className="w-5 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedSessions.has(session._id)}
                      onChange={() => handleToggleSession(session._id)}
                      className="rounded h-3 w-3"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "font-medium truncate block",
                        t.textPrimary,
                      )}
                      title={session.title || "Untitled"}
                    >
                      {session.title
                        ? session.title.length > 40
                          ? session.title.slice(0, 40) + "..."
                          : session.title
                        : "Untitled"}
                    </span>
                  </div>
                  <div className="w-10 shrink-0 flex justify-center">
                    <SourceBadge source={session.source} theme={theme} />
                  </div>
                  <div
                    className={cn(
                      "w-20 shrink-0 truncate hidden sm:block",
                      t.textMuted,
                    )}
                    title={session.model || "unknown"}
                  >
                    {session.model
                      ? session.model.length > 12
                        ? session.model.slice(0, 12) + "..."
                        : session.model
                      : "-"}
                  </div>
                  <div
                    className={cn(
                      "w-8 text-center shrink-0 flex items-center justify-center gap-0.5",
                      t.textMuted,
                    )}
                  >
                    <MessageSquare className="h-2.5 w-2.5" />
                    {session.messageCount}
                  </div>
                  <div className="w-16 shrink-0">
                    <StatusDropdown
                      value={session.evalStatus as EvalStatus | undefined}
                      onChange={(status) =>
                        handleStatusChange(session._id, status)
                      }
                      theme={theme}
                    />
                  </div>
                  <div className={cn("w-12 text-right shrink-0", t.textSubtle)}>
                    {new Date(session.createdAt).toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}

              {/* Load more button */}
              {hasMore && (
                <div className={cn("px-2 py-2 border-t", t.border)}>
                  <button
                    onClick={handleLoadMore}
                    className={cn(
                      "w-full py-1.5 text-[10px] font-medium rounded transition-colors",
                      isDark
                        ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        : "bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e0deda]",
                    )}
                  >
                    Load more ({allSessions.length - displayCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Count indicator */}
          {sessions.length > 0 && (
            <div className={cn("text-[10px] text-center", t.textSubtle)}>
              Showing {sessions.length} of {allSessions.length} sessions
            </div>
          )}
        </div>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) =>
            e.target === e.currentTarget && setShowExportModal(false)
          }
        >
          <div
            className={cn(
              "absolute inset-0",
              isDark ? "bg-black/60" : "bg-black/40",
              "backdrop-blur-sm",
            )}
          />

          <div
            className={cn(
              "relative w-full max-w-md mx-3 rounded-lg border shadow-xl max-h-[85vh] overflow-auto",
              isDark
                ? "bg-zinc-900 border-zinc-800"
                : "bg-[#faf8f5] border-[#e6e4e1]",
            )}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 border-b sticky top-0",
                isDark
                  ? "border-zinc-800 bg-zinc-900"
                  : "border-[#e6e4e1] bg-[#faf8f5]",
              )}
            >
              <h3
                className={cn(
                  "text-xs font-medium",
                  isDark ? "text-zinc-200" : "text-[#1a1a1a]",
                )}
              >
                Export for Evals
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className={cn(
                  "p-1 rounded transition-colors",
                  isDark
                    ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                    : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]",
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-3 py-3 space-y-3">
              {/* Preview stats */}
              {previewData && (
                <div
                  className={cn(
                    "p-2 rounded-lg border",
                    isDark
                      ? "border-zinc-800 bg-zinc-800/50"
                      : "border-[#e6e4e1] bg-[#f5f3f0]",
                  )}
                >
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div
                        className={cn(
                          "text-base font-semibold",
                          isDark ? "text-zinc-100" : "text-[#1a1a1a]",
                        )}
                      >
                        {previewData.sessionCount}
                      </div>
                      <div
                        className={cn(
                          "text-[9px]",
                          isDark ? "text-zinc-500" : "text-[#6b6b6b]",
                        )}
                      >
                        Sessions
                      </div>
                    </div>
                    <div>
                      <div
                        className={cn(
                          "text-base font-semibold",
                          isDark ? "text-zinc-100" : "text-[#1a1a1a]",
                        )}
                      >
                        {previewData.testCaseCount}
                      </div>
                      <div
                        className={cn(
                          "text-[9px]",
                          isDark ? "text-zinc-500" : "text-[#6b6b6b]",
                        )}
                      >
                        Tests
                      </div>
                    </div>
                    <div>
                      <div
                        className={cn(
                          "text-base font-semibold",
                          isDark ? "text-zinc-100" : "text-[#1a1a1a]",
                        )}
                      >
                        {previewData.byModel.length}
                      </div>
                      <div
                        className={cn(
                          "text-[9px]",
                          isDark ? "text-zinc-500" : "text-[#6b6b6b]",
                        )}
                      >
                        Models
                      </div>
                    </div>
                  </div>

                  {previewData.warnings.length > 0 && (
                    <div
                      className={cn(
                        "mt-2 pt-2 border-t space-y-0.5",
                        isDark ? "border-zinc-700" : "border-[#e6e4e1]",
                      )}
                    >
                      {previewData.warnings.map((warning, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1.5 text-[9px] text-amber-500"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0 mt-0.5" />
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Format selection */}
              <div className="space-y-1.5">
                <label
                  className={cn(
                    "text-[10px] font-medium",
                    isDark ? "text-zinc-300" : "text-[#1a1a1a]",
                  )}
                >
                  Format
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      {
                        value: "deepeval" as const,
                        label: "DeepEval",
                        desc: "JSON",
                      },
                      {
                        value: "openai" as const,
                        label: "OpenAI",
                        desc: "JSONL",
                      },
                      {
                        value: "promptfoo" as const,
                        label: "Promptfoo",
                        desc: "JSONL",
                      },
                      {
                        value: "filesystem" as const,
                        label: "Files",
                        desc: "TXT",
                      },
                    ] as const
                  ).map((format) => (
                    <label
                      key={format.value}
                      className={cn(
                        "flex items-center gap-1.5 p-1.5 rounded border cursor-pointer transition-colors",
                        exportFormat === format.value
                          ? isDark
                            ? "border-zinc-600 bg-zinc-800/50"
                            : "border-[#8b7355] bg-[#ebe9e6]"
                          : isDark
                            ? "border-zinc-800 hover:border-zinc-700"
                            : "border-[#e6e4e1] hover:border-[#d6d4d1]",
                      )}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={exportFormat === format.value}
                        onChange={(e) =>
                          setExportFormat(e.target.value as ExportFormat)
                        }
                        className="h-3 w-3"
                      />
                      <div>
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            isDark ? "text-zinc-200" : "text-[#1a1a1a]",
                          )}
                        >
                          {format.label}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] ml-1",
                            isDark ? "text-zinc-500" : "text-[#6b6b6b]",
                          )}
                        >
                          {format.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Turn mode */}
              {(exportFormat === "deepeval" ||
                exportFormat === "promptfoo") && (
                <div className="space-y-1.5">
                  <label
                    className={cn(
                      "text-[10px] font-medium",
                      isDark ? "text-zinc-300" : "text-[#1a1a1a]",
                    )}
                  >
                    Turn Mode
                  </label>
                  <div className="space-y-1">
                    {TURN_MODE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "flex items-center gap-1.5 p-1.5 rounded border cursor-pointer transition-colors",
                          turnMode === option.value
                            ? isDark
                              ? "border-zinc-600 bg-zinc-800/50"
                              : "border-[#8b7355] bg-[#ebe9e6]"
                            : isDark
                              ? "border-zinc-800 hover:border-zinc-700"
                              : "border-[#e6e4e1] hover:border-[#d6d4d1]",
                        )}
                      >
                        <input
                          type="radio"
                          name="turnMode"
                          value={option.value}
                          checked={turnMode === option.value}
                          onChange={(e) =>
                            setTurnMode(e.target.value as TurnMode)
                          }
                          className="h-3 w-3"
                        />
                        <div>
                          <span
                            className={cn(
                              "text-[10px] font-medium",
                              isDark ? "text-zinc-200" : "text-[#1a1a1a]",
                            )}
                          >
                            {option.label}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] ml-1",
                              isDark ? "text-zinc-500" : "text-[#6b6b6b]",
                            )}
                          >
                            {option.desc}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-1.5">
                <label
                  className={cn(
                    "text-[10px] font-medium",
                    isDark ? "text-zinc-300" : "text-[#1a1a1a]",
                  )}
                >
                  Options
                </label>
                <div className="space-y-1">
                  {[
                    { key: "includeSystemPrompts", label: "System prompts" },
                    { key: "includeToolCalls", label: "Context from turns" },
                    { key: "anonymizePaths", label: "Anonymize paths" },
                    { key: "codeBlocksOnly", label: "Code blocks only" },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={
                          exportOptions[opt.key as keyof typeof exportOptions]
                        }
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            [opt.key]: e.target.checked,
                          })
                        }
                        className="rounded h-3 w-3"
                      />
                      <span
                        className={cn(
                          "text-[10px]",
                          isDark ? "text-zinc-400" : "text-[#6b6b6b]",
                        )}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className={cn(
                "flex items-center justify-end gap-2 px-3 py-2 border-t sticky bottom-0",
                isDark
                  ? "border-zinc-800 bg-zinc-900"
                  : "border-[#e6e4e1] bg-[#faf8f5]",
              )}
            >
              <button
                onClick={() => setShowExportModal(false)}
                className={cn(
                  "px-2 py-1 text-[10px] rounded transition-colors",
                  isDark
                    ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]",
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={
                  isExporting || !previewData || previewData.sessionCount === 0
                }
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-[10px] rounded font-medium transition-colors",
                  isExporting || !previewData || previewData.sessionCount === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "",
                  isDark
                    ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                    : "bg-[#1a1a1a] text-white hover:bg-[#333]",
                )}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Exporting
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3" />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
