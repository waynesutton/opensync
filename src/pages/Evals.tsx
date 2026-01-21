import { useState } from "react";
import { useQuery, useAction } from "convex/react";
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
  Cpu,
  X,
  FileDown,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Folder,
} from "lucide-react";

// Source badge component (matches Dashboard)
function SourceBadge({ source, theme }: { source?: string; theme: "dark" | "tan" }) {
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded", getSourceColorClass(source, { theme }))}>
      {getSourceLabel(source, true)}
    </span>
  );
}

// Tag badge component
function TagBadge({ tag, theme }: { tag: string; theme: "dark" | "tan" }) {
  const isDark = theme === "dark";
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded",
        isDark ? "bg-zinc-700 text-zinc-300" : "bg-[#ebe9e6] text-[#6b6b6b]"
      )}
    >
      {tag}
    </span>
  );
}

// Export format type
type ExportFormat = "deepeval" | "openai" | "filesystem";

export function EvalsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // State
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  const [tagFilter, setTagFilter] = useState<string | undefined>();
  const [selectedSessions, setSelectedSessions] = useState<Set<Id<"sessions">>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("deepeval");
  const [exportOptions, setExportOptions] = useState({
    includeSystemPrompts: false,
    includeToolCalls: true,
    anonymizePaths: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const evalData = useQuery(api.evals.listEvalSessions, {
    source: sourceFilter,
    tags: tagFilter ? [tagFilter] : undefined,
  });
  const allTags = useQuery(api.evals.getEvalTags);
  const generateExport = useAction(api.evals.generateEvalExport);

  // Computed
  const sessions = evalData?.sessions || [];
  const stats = evalData?.stats || { total: 0, bySource: { opencode: 0, claudeCode: 0, factoryDroid: 0 }, totalTestCases: 0 };
  const hasActiveFilters = sourceFilter || tagFilter;

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

  const handleExport = async () => {
    if (sessions.length === 0) return;
    
    setIsExporting(true);
    try {
      const sessionIds = selectedSessions.size > 0 
        ? Array.from(selectedSessions) 
        : "all" as const;
      
      const result = await generateExport({
        sessionIds,
        format: exportFormat,
        options: exportOptions,
      });

      // Download the file
      const blob = new Blob([result.data], { type: "application/json" });
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
  };

  return (
    <div className={cn("h-screen flex flex-col", t.bgPrimary)}>
      {/* Header */}
      <header className={cn("h-12 border-b flex items-center px-4 gap-4", t.border, t.bgPrimary)}>
        <Link to="/" className={cn("font-normal text-sm tracking-tight", t.textSecondary)}>
          opensync
        </Link>

        {/* Back to Dashboard */}
        <button
          onClick={() => navigate("/")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors",
            t.textSubtle, t.bgHover
          )}
        >
          <ArrowLeft className="h-3 w-3" />
          Dashboard
        </button>

        {/* Page title */}
        <div className={cn("flex items-center gap-2 text-sm font-medium", t.textPrimary)}>
          <CheckCircle2 className="h-4 w-4" />
          Evals
        </div>

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn("p-2 rounded-md transition-colors", t.bgHover, t.textSubtle)}
          title={`Switch to ${theme === "dark" ? "tan" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          className={cn("p-2 rounded-md transition-colors", t.bgHover, t.textSubtle)}
        >
          <Settings className="h-4 w-4" />
        </Link>

        {/* User menu */}
        <div className="relative group">
          <button className={cn("flex items-center gap-2 px-2 py-1 rounded-md", t.bgHover)}>
            <User className={cn("h-4 w-4", t.textSubtle)} />
            <span className={cn("text-xs", t.textSubtle)}>
              {user?.firstName || "User"}
            </span>
          </button>
          <div
            className={cn(
              "absolute right-0 top-full mt-1 w-40 rounded-md border shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity",
              t.bgDropdown, t.border
            )}
          >
            <button
              onClick={() => signOut()}
              className={cn(
                "w-full px-3 py-2 text-left text-xs flex items-center gap-2 rounded-md",
                t.textSubtle, t.bgHover
              )}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Eval Sessions"
              value={stats.total}
              theme={theme}
            />
            <StatCard
              label="Test Cases"
              value={stats.totalTestCases}
              theme={theme}
            />
            <StatCard
              label="OpenCode"
              value={stats.bySource.opencode}
              theme={theme}
            />
            <StatCard
              label="Claude Code"
              value={stats.bySource.claudeCode}
              theme={theme}
            />
            <StatCard
              label="Factory Droid"
              value={stats.bySource.factoryDroid}
              theme={theme}
            />
          </div>

          {/* Filters and actions bar */}
          <div className={cn("flex items-center justify-between p-3 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex items-center gap-2">
              {/* Source filter */}
              <select
                value={sourceFilter || ""}
                onChange={(e) => setSourceFilter(e.target.value || undefined)}
                className={cn(
                  "text-xs px-2 py-1.5 rounded border",
                  t.bgInput, t.border, t.textPrimary
                )}
              >
                <option value="">All Sources</option>
                <option value="opencode">OpenCode</option>
                <option value="claude-code">Claude Code</option>
                <option value="factory-droid">Factory Droid</option>
              </select>

              {/* Tag filter */}
              {allTags && allTags.length > 0 && (
                <select
                  value={tagFilter || ""}
                  onChange={(e) => setTagFilter(e.target.value || undefined)}
                  className={cn(
                    "text-xs px-2 py-1.5 rounded border",
                    t.bgInput, t.border, t.textPrimary
                  )}
                >
                  <option value="">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className={cn("text-xs flex items-center gap-1", t.textSubtle, "hover:opacity-80")}
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Select all */}
              {sessions.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    "text-xs px-2 py-1.5 rounded border",
                    t.border, t.textSubtle, t.bgHover
                  )}
                >
                  {selectedSessions.size === sessions.length ? "Deselect All" : "Select All"}
                </button>
              )}

              {/* Export button */}
              <button
                onClick={() => setShowExportModal(true)}
                disabled={sessions.length === 0}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors",
                  sessions.length === 0
                    ? "opacity-50 cursor-not-allowed bg-zinc-700 text-zinc-400"
                    : isDark
                      ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                      : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                )}
              >
                <FileDown className="h-3.5 w-3.5" />
                Export for Evals
              </button>
            </div>
          </div>

          {/* Sessions list */}
          {sessions.length === 0 ? (
            <div className={cn("text-center py-16 rounded-lg border", t.bgCard, t.border)}>
              <CheckCircle2 className={cn("h-12 w-12 mx-auto mb-4", t.iconMuted)} />
              <p className={cn("text-sm font-medium mb-2", t.textPrimary)}>No eval sessions yet</p>
              <p className={cn("text-xs mb-4", t.textSubtle)}>
                Mark sessions as eval-ready from the Dashboard to see them here
              </p>
              <Link
                to="/"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded",
                  isDark
                    ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                    : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Go to Sessions
              </Link>
            </div>
          ) : (
            <div className={cn("rounded-lg border overflow-hidden", t.border)}>
              {/* Table header */}
              <div className={cn("grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium border-b", t.bgSecondary, t.border, t.textSubtle)}>
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSessions.size === sessions.length && sessions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </div>
                <div className="col-span-4">Session</div>
                <div className="col-span-1">Source</div>
                <div className="col-span-2">Model</div>
                <div className="col-span-1 text-right">Messages</div>
                <div className="col-span-2">Tags</div>
                <div className="col-span-1 text-right">Date</div>
              </div>

              {/* Table rows */}
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className={cn(
                    "grid grid-cols-12 gap-4 px-4 py-3 text-xs border-b last:border-b-0 transition-colors",
                    t.border,
                    selectedSessions.has(session._id) ? t.bgActive : t.bgHover
                  )}
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSessions.has(session._id)}
                      onChange={() => handleToggleSession(session._id)}
                      className="rounded"
                    />
                  </div>
                  <div className="col-span-4 flex flex-col gap-1">
                    <span className={cn("font-medium truncate", t.textPrimary)}>
                      {session.title || "Untitled Session"}
                    </span>
                    {session.projectName && (
                      <span className={cn("text-[10px] flex items-center gap-1", t.textSubtle)}>
                        <Folder className="h-3 w-3" />
                        {session.projectName}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center">
                    <SourceBadge source={session.source} theme={theme} />
                  </div>
                  <div className={cn("col-span-2 flex items-center truncate", t.textMuted)}>
                    <Cpu className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{session.model || "unknown"}</span>
                  </div>
                  <div className={cn("col-span-1 flex items-center justify-end", t.textMuted)}>
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {session.messageCount}
                  </div>
                  <div className="col-span-2 flex items-center gap-1 flex-wrap">
                    {session.evalTags?.slice(0, 2).map((tag) => (
                      <TagBadge key={tag} tag={tag} theme={theme} />
                    ))}
                    {(session.evalTags?.length || 0) > 2 && (
                      <span className={cn("text-[10px]", t.textSubtle)}>
                        +{(session.evalTags?.length || 0) - 2}
                      </span>
                    )}
                  </div>
                  <div className={cn("col-span-1 flex items-center justify-end", t.textSubtle)}>
                    {new Date(session.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowExportModal(false)}
        >
          <div className={cn("absolute inset-0", isDark ? "bg-black/60" : "bg-black/40", "backdrop-blur-sm")} />
          
          <div className={cn(
            "relative w-full max-w-md mx-4 rounded-lg border shadow-xl",
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-[#faf8f5] border-[#e6e4e1]"
          )}>
            {/* Header */}
            <div className={cn("flex items-center justify-between px-4 py-3 border-b", isDark ? "border-zinc-800" : "border-[#e6e4e1]")}>
              <h3 className={cn("text-sm font-medium", isDark ? "text-zinc-200" : "text-[#1a1a1a]")}>
                Export for Evals
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className={cn(
                  "p-1 rounded transition-colors",
                  isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-4">
              {/* Session count */}
              <div className={cn("text-xs", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                {selectedSessions.size > 0
                  ? `${selectedSessions.size} sessions selected`
                  : `All ${stats.total} eval-ready sessions`}
                {" "}({stats.totalTestCases} test cases)
              </div>

              {/* Format selection */}
              <div className="space-y-2">
                <label className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-[#1a1a1a]")}>
                  Export Format
                </label>
                <div className="space-y-2">
                  {([
                    { value: "deepeval" as const, label: "DeepEval JSON", desc: "Best for DeepEval framework" },
                    { value: "openai" as const, label: "OpenAI Evals JSONL", desc: "Compatible with OpenAI evals CLI" },
                    { value: "filesystem" as const, label: "Filesystem (Plain Text)", desc: "Individual text files for retrieval testing" },
                  ]).map((format) => (
                    <label
                      key={format.value}
                      className={cn(
                        "flex items-start gap-3 p-2 rounded border cursor-pointer transition-colors",
                        exportFormat === format.value
                          ? isDark
                            ? "border-zinc-600 bg-zinc-800/50"
                            : "border-[#8b7355] bg-[#ebe9e6]"
                          : isDark
                            ? "border-zinc-800 hover:border-zinc-700"
                            : "border-[#e6e4e1] hover:border-[#d6d4d1]"
                      )}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={exportFormat === format.value}
                        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className={cn("text-xs font-medium", isDark ? "text-zinc-200" : "text-[#1a1a1a]")}>
                          {format.label}
                        </div>
                        <div className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-[#6b6b6b]")}>
                          {format.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-[#1a1a1a]")}>
                  Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSystemPrompts}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeSystemPrompts: e.target.checked })}
                      className="rounded"
                    />
                    <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                      Include system prompts
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeToolCalls}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeToolCalls: e.target.checked })}
                      className="rounded"
                    />
                    <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                      Include tool calls and results
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.anonymizePaths}
                      onChange={(e) => setExportOptions({ ...exportOptions, anonymizePaths: e.target.checked })}
                      className="rounded"
                    />
                    <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                      Anonymize project paths
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={cn("flex items-center justify-end gap-2 px-4 py-3 border-t", isDark ? "border-zinc-800" : "border-[#e6e4e1]")}>
              <button
                onClick={() => setShowExportModal(false)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded transition-colors",
                  isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded font-medium transition-colors",
                  isExporting
                    ? "opacity-50 cursor-not-allowed"
                    : "",
                  isDark
                    ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                    : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                )}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Download Export
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
