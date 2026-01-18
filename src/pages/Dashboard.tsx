import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";
import { StatCard, BarChart, AreaChart, DonutChart, FilterPill, ProgressBar } from "../components/Charts";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Search,
  Settings,
  FileText,
  User,
  LogOut,
  Command,
  ChevronDown,
  Folder,
  MessageSquare,
  Cpu,
  Clock,
  Coins,
  Globe,
  Lock,
  Copy,
  Check,
  Download,
  Trash2,
  ExternalLink,
  Filter,
  Bot,
  Sun,
  Moon,
} from "lucide-react";

// View modes
type ViewMode = "overview" | "sessions" | "analytics";
type SortField = "updatedAt" | "createdAt" | "totalTokens" | "cost" | "durationMs";
type SortOrder = "asc" | "desc";

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<Id<"sessions"> | null>(null);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterModel, setFilterModel] = useState<string | undefined>();
  const [filterProject, setFilterProject] = useState<string | undefined>();
  const [filterProvider, setFilterProvider] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Ensure user exists
  const getOrCreate = useMutation(api.users.getOrCreate);
  useEffect(() => {
    getOrCreate();
  }, [getOrCreate]);

  // Fetch data
  const summaryStats = useQuery(api.analytics.summaryStats);
  const dailyStats = useQuery(api.analytics.dailyStats, { days: 30 });
  const modelStats = useQuery(api.analytics.modelStats);
  const projectStats = useQuery(api.analytics.projectStats);
  const providerStats = useQuery(api.analytics.providerStats);
  const sessionsData = useQuery(api.analytics.sessionsWithDetails, {
    limit: 100,
    sortBy: sortField,
    sortOrder,
    filterModel,
    filterProject,
    filterProvider,
  });

  // Search results
  const searchResults = useQuery(
    api.search.searchSessions,
    searchQuery.trim() ? { query: searchQuery, limit: 20 } : "skip"
  );

  // Selected session details
  const selectedSession = useQuery(
    api.sessions.get,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const models = new Set<string>();
    const projects = new Set<string>();
    const providers = new Set<string>();
    
    sessionsData?.sessions.forEach((s) => {
      if (s.model) models.add(s.model);
      if (s.projectName) projects.add(s.projectName);
      else if (s.projectPath) projects.add(s.projectPath);
      if (s.provider) providers.add(s.provider);
    });

    return {
      models: Array.from(models).sort(),
      projects: Array.from(projects).sort(),
      providers: Array.from(providers).sort(),
    };
  }, [sessionsData]);

  const displaySessions = searchQuery.trim()
    ? searchResults || []
    : sessionsData?.sessions || [];

  const hasActiveFilters = !!(filterModel || filterProject || filterProvider);

  const clearFilters = () => {
    setFilterModel(undefined);
    setFilterProject(undefined);
    setFilterProvider(undefined);
  };

  return (
    <div className={cn("h-screen flex flex-col", t.bgPrimary)}>
      {/* Header */}
      <header className={cn("h-12 border-b flex items-center px-4 gap-4", t.border, t.bgPrimary)}>
        <Link to="/" className={cn("font-normal text-sm tracking-tight", t.textSecondary)}>
          opensync
        </Link>

        {/* View toggles */}
        <div className={cn("flex items-center gap-1 rounded-md p-0.5 border", t.bgToggle, t.border)}>
          {(["overview", "sessions", "analytics"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors capitalize",
                viewMode === mode
                  ? cn(t.bgToggleActive, t.textPrimary)
                  : cn(t.textSubtle, "hover:opacity-80")
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="w-64">
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5", t.iconMuted)} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className={cn(
                "w-full h-8 pl-9 pr-16 rounded-md border text-sm focus:outline-none transition-colors",
                t.bgInput, t.borderInput, t.textSecondary, t.textPlaceholder, t.borderFocus
              )}
            />
            <div className={cn("absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none", t.iconMuted)}>
              <Command className="h-3 w-3" />
              <span className="text-[10px]">K</span>
            </div>
          </div>
        </div>

        {/* Right nav */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
            title={theme === "dark" ? "Switch to tan mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/docs"
            className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
            title="Documentation"
          >
            <FileText className="h-4 w-4" />
          </Link>
          <Link
            to="/settings"
            className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <div className="relative group ml-1">
            <button className={cn("flex items-center gap-2 p-1 rounded transition-colors", t.bgHover)}>
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", t.bgSecondary)}>
                  <User className={cn("h-3 w-3", t.textSubtle)} />
                </div>
              )}
            </button>
            <div className={cn("absolute right-0 top-full mt-1 w-48 py-1 border rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50", t.bgDropdown, t.border)}>
              <div className={cn("px-3 py-2 border-b", t.border)}>
                <p className={cn("text-sm font-normal", t.textSecondary)}>{user?.firstName} {user?.lastName}</p>
                <p className={cn("text-xs", t.textDim)}>{user?.email}</p>
              </div>
              <Link to="/settings" className={cn("flex items-center gap-2 px-3 py-2 text-sm transition-colors", t.textMuted, t.bgHover)}>
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
              <button
                onClick={signOut}
                className={cn("flex items-center gap-2 px-3 py-2 text-sm w-full text-left text-red-400/80 transition-colors", t.bgHover)}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {viewMode === "overview" && (
          <OverviewView
            summaryStats={summaryStats}
            dailyStats={dailyStats || []}
            modelStats={modelStats || []}
            projectStats={projectStats || []}
            sessions={displaySessions}
            onSelectSession={(id) => {
              // Navigate to sessions view when clicking a session in overview
              setSelectedSessionId(id);
              if (id) setViewMode("sessions");
            }}
            selectedSessionId={selectedSessionId}
            theme={theme}
          />
        )}

        {viewMode === "sessions" && (
          <SessionsView
            sessions={displaySessions}
            total={sessionsData?.total || 0}
            onSelectSession={setSelectedSessionId}
            selectedSession={selectedSession}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={(field) => {
              if (field === sortField) {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortField(field);
                setSortOrder("desc");
              }
            }}
            filterOptions={filterOptions}
            filterModel={filterModel}
            filterProject={filterProject}
            filterProvider={filterProvider}
            onFilterModel={setFilterModel}
            onFilterProject={setFilterProject}
            onFilterProvider={setFilterProvider}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            theme={theme}
          />
        )}

        {viewMode === "analytics" && (
          <AnalyticsView
            summaryStats={summaryStats}
            dailyStats={dailyStats || []}
            modelStats={modelStats || []}
            projectStats={projectStats || []}
            providerStats={providerStats || []}
            theme={theme}
          />
        )}
      </main>
    </div>
  );
}

// Overview View - Dashboard home
function OverviewView({
  summaryStats,
  dailyStats,
  modelStats,
  projectStats,
  sessions,
  onSelectSession,
  selectedSessionId,
  theme,
}: {
  summaryStats: any;
  dailyStats: any[];
  modelStats: any[];
  projectStats: any[];
  sessions: any[];
  onSelectSession: (id: Id<"sessions"> | null) => void;
  selectedSessionId: Id<"sessions"> | null;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  // Get trend data for sparklines
  const tokenTrend = dailyStats.map((d) => d.totalTokens);
  const sessionTrend = dailyStats.map((d) => d.sessions);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard
            label="Sessions"
            value={summaryStats?.totalSessions.toLocaleString() || "0"}
            trend={sessionTrend}
            trendColor={theme === "dark" ? "#22c55e" : "#EB5601"}
            icon={<MessageSquare className="h-4 w-4" />}
            theme={theme}
          />
          <StatCard
            label="Total Tokens"
            value={formatNumber(summaryStats?.totalTokens || 0)}
            subValue={`${formatNumber(summaryStats?.promptTokens || 0)} in / ${formatNumber(summaryStats?.completionTokens || 0)} out`}
            trend={tokenTrend}
            trendColor={theme === "dark" ? "#3b82f6" : "#EB5601"}
            icon={<Cpu className="h-4 w-4" />}
            theme={theme}
          />
          <StatCard
            label="Total Cost"
            value={`$${(summaryStats?.totalCost || 0).toFixed(2)}`}
            subValue={`$${(summaryStats?.avgCostPerSession || 0).toFixed(4)}/session`}
            icon={<Coins className="h-4 w-4" />}
            theme={theme}
          />
          <StatCard
            label="Duration"
            value={formatDuration(summaryStats?.totalDurationMs || 0)}
            icon={<Clock className="h-4 w-4" />}
            theme={theme}
          />
          <StatCard
            label="Models"
            value={summaryStats?.uniqueModels || 0}
            icon={<Bot className="h-4 w-4" />}
            theme={theme}
          />
          <StatCard
            label="Projects"
            value={summaryStats?.uniqueProjects || 0}
            icon={<Folder className="h-4 w-4" />}
            theme={theme}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily usage chart */}
          <div className={cn("lg:col-span-2 p-4 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn("text-xs font-normal", t.textMuted)}>Token Usage (30 days)</h3>
              <div className={cn("flex items-center gap-3 text-[10px]", t.textDim)}>
                <span className="flex items-center gap-1">
                  <span className={cn("w-2 h-2 rounded-full", theme === "dark" ? "bg-blue-500" : "bg-[#EB5601]")} />
                  Prompt
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Completion
                </span>
              </div>
            </div>
            <div className="h-32">
              <BarChart
                data={dailyStats.slice(-14).map((d) => ({
                  label: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
                  value: d.totalTokens,
                  color: theme === "dark" ? "bg-gradient-to-t from-blue-600 to-blue-500" : "bg-gradient-to-t from-[#EB5601] to-[#f59e0b]",
                }))}
                height={128}
                formatValue={(v) => formatNumber(v)}
              />
            </div>
          </div>

          {/* Model distribution */}
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <h3 className={cn("text-xs font-normal mb-4", t.textMuted)}>Model Distribution</h3>
            <div className="flex items-center justify-center">
              <DonutChart
                size={100}
                thickness={10}
                data={modelStats.slice(0, 5).map((m, i) => ({
                  label: m.model,
                  value: m.totalTokens,
                  color: theme === "dark" ? MODEL_COLORS[i % MODEL_COLORS.length] : TAN_MODEL_COLORS[i % TAN_MODEL_COLORS.length],
                }))}
              />
            </div>
            <div className="mt-4 space-y-1.5">
              {modelStats.slice(0, 4).map((m, i) => (
                <div key={m.model} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme === "dark" ? MODEL_COLORS[i % MODEL_COLORS.length] : TAN_MODEL_COLORS[i % TAN_MODEL_COLORS.length] }}
                    />
                    <span className={cn("truncate max-w-[120px]", t.textMuted)}>{m.model}</span>
                  </span>
                  <span className={t.textDim}>{formatNumber(m.totalTokens)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent sessions and projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent sessions */}
          <div className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}>
            <div className={cn("px-4 py-3 border-b flex items-center justify-between", t.border)}>
              <h3 className={cn("text-xs font-normal", t.textMuted)}>Recent Sessions</h3>
              <span className={cn("text-[10px]", t.textDim)}>{sessions.length} total</span>
            </div>
            <div className={t.divide}>
              {sessions.slice(0, 8).map((session) => (
                <SessionRow
                  key={session._id}
                  session={session}
                  isSelected={selectedSessionId === session._id}
                  onClick={() => onSelectSession(session._id)}
                  theme={theme}
                />
              ))}
              {sessions.length === 0 && (
                <div className={cn("px-4 py-8 text-center text-sm", t.textDim)}>
                  No sessions yet
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}>
            <div className={cn("px-4 py-3 border-b", t.border)}>
              <h3 className={cn("text-xs font-normal", t.textMuted)}>Projects</h3>
            </div>
            <div className="p-4 space-y-3">
              {projectStats.slice(0, 6).map((p) => (
                <div key={p.project} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm truncate max-w-[200px]", t.textSecondary)}>{p.project}</span>
                    <span className={cn("text-xs", t.textDim)}>{formatNumber(p.totalTokens)} tokens</span>
                  </div>
                  <ProgressBar
                    value={p.totalTokens}
                    max={projectStats[0]?.totalTokens || 1}
                    showPercentage={false}
                    color={theme === "dark" ? "bg-zinc-600" : "bg-[#8b7355]"}
                  />
                </div>
              ))}
              {projectStats.length === 0 && (
                <div className={cn("py-4 text-center text-sm", t.textDim)}>
                  No projects yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sessions View - Table with filters
function SessionsView({
  sessions,
  total,
  onSelectSession,
  selectedSession,
  sortField,
  sortOrder,
  onSortChange,
  filterOptions,
  filterModel,
  filterProject,
  filterProvider,
  onFilterModel,
  onFilterProject,
  onFilterProvider,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  theme,
}: {
  sessions: any[];
  total: number;
  onSelectSession: (id: Id<"sessions"> | null) => void;
  selectedSession: any;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
  filterOptions: { models: string[]; projects: string[]; providers: string[] };
  filterModel?: string;
  filterProject?: string;
  filterProvider?: string;
  onFilterModel: (v?: string) => void;
  onFilterProject: (v?: string) => void;
  onFilterProvider: (v?: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters?: boolean;
  onClearFilters: () => void;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  const deleteSession = useMutation(api.sessions.remove);
  const setVisibility = useMutation(api.sessions.setVisibility);
  const markdown = useQuery(
    api.sessions.getMarkdown,
    selectedSession?.session?._id ? { sessionId: selectedSession.session._id } : "skip"
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (markdown) {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (markdown && selectedSession?.session) {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedSession.session.title || "session"}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Sessions list - hidden on mobile when session selected */}
      <div className={cn(
        "flex flex-col border-r",
        t.border,
        selectedSession ? "hidden lg:flex lg:w-1/2" : "w-full"
      )}>
        {/* Filters bar */}
        <div className={cn("px-4 py-3 border-b flex items-center gap-3", t.border)}>
          <button
            onClick={onToggleFilters}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
              showFilters || hasActiveFilters
                ? cn(t.bgToggleActive, t.textSecondary)
                : cn(t.textSubtle, t.bgHover)
            )}
          >
            <Filter className="h-3 w-3" />
            Filters
            {hasActiveFilters && <span className={cn("w-1.5 h-1.5 rounded-full", theme === "dark" ? "bg-blue-500" : "bg-[#EB5601]")} />}
          </button>

          {hasActiveFilters && (
            <>
              {filterModel && (
                <FilterPill label="Model" value={filterModel} active onClear={() => onFilterModel(undefined)} />
              )}
              {filterProject && (
                <FilterPill label="Project" value={filterProject} active onClear={() => onFilterProject(undefined)} />
              )}
              {filterProvider && (
                <FilterPill label="Provider" value={filterProvider} active onClear={() => onFilterProvider(undefined)} />
              )}
              <button onClick={onClearFilters} className={cn("text-xs", t.textSubtle)}>
                Clear all
              </button>
            </>
          )}

          <div className="flex-1" />

          <span className={cn("text-xs", t.textDim)}>{sessions.length} of {total}</span>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className={cn("px-4 py-3 border-b flex items-center gap-4", t.border, t.bgSecondary)}>
            <FilterDropdown
              label="Model"
              options={filterOptions.models}
              value={filterModel}
              onChange={onFilterModel}
              theme={theme}
            />
            <FilterDropdown
              label="Project"
              options={filterOptions.projects}
              value={filterProject}
              onChange={onFilterProject}
              theme={theme}
            />
            <FilterDropdown
              label="Provider"
              options={filterOptions.providers}
              value={filterProvider}
              onChange={onFilterProvider}
              theme={theme}
            />
          </div>
        )}

        {/* Sort header */}
        <div className={cn("grid grid-cols-12 gap-2 px-4 py-2 border-b text-[10px] uppercase tracking-wider", t.borderLight, t.textDim)}>
          <div className="col-span-5">Title</div>
          <SortHeader label="Tokens" field="totalTokens" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2 text-right" theme={theme} />
          <SortHeader label="Cost" field="cost" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2 text-right" theme={theme} />
          <SortHeader label="Duration" field="durationMs" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2 text-right" theme={theme} />
          <div className="col-span-1" />
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <SessionTableRow
              key={session._id}
              session={session}
              isSelected={selectedSession?.session?._id === session._id}
              onClick={() => onSelectSession(session._id)}
              theme={theme}
            />
          ))}
          {sessions.length === 0 && (
            <div className={cn("px-4 py-12 text-center text-sm", t.textDim)}>
              No sessions found
            </div>
          )}
        </div>
      </div>

      {/* Session detail - full width on mobile */}
      {selectedSession && (
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Detail header */}
          <div className={cn("px-4 py-3 border-b flex items-center justify-between", t.border)}>
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button - mobile only */}
              <button
                onClick={() => onSelectSession(null)}
                className={cn("lg:hidden p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="min-w-0">
                <h2 className={cn("text-sm font-normal truncate", t.textPrimary)}>
                  {selectedSession.session.title || "Untitled Session"}
                </h2>
                <div className={cn("flex items-center gap-3 mt-0.5 text-xs", t.textDim)}>
                  {selectedSession.session.model && <span>{selectedSession.session.model}</span>}
                  <span>{formatNumber(selectedSession.session.totalTokens)} tokens</span>
                  <span>${selectedSession.session.cost.toFixed(4)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
                title="Copy as Markdown"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setVisibility({ sessionId: selectedSession.session._id, isPublic: !selectedSession.session.isPublic })}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  selectedSession.session.isPublic ? "text-emerald-500" : t.textSubtle,
                  t.bgHover
                )}
                title={selectedSession.session.isPublic ? "Make Private" : "Make Public"}
              >
                {selectedSession.session.isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              </button>
              {selectedSession.session.isPublic && selectedSession.session.publicSlug && (
                <a
                  href={`/s/${selectedSession.session.publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
                  title="Open Public Link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                onClick={async () => {
                  if (confirm("Delete this session?")) {
                    await deleteSession({ sessionId: selectedSession.session._id });
                  }
                }}
                className={cn("p-1.5 rounded transition-colors hover:text-red-400", t.textSubtle, t.bgHover)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedSession.messages.map((msg: any) => (
              <MessageBubble key={msg._id} message={msg} theme={theme} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics View - Charts and insights
function AnalyticsView({
  summaryStats,
  dailyStats,
  modelStats,
  projectStats,
  providerStats,
  theme,
}: {
  summaryStats: any;
  dailyStats: any[];
  modelStats: any[];
  projectStats: any[];
  providerStats: any[];
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <p className={cn("text-xs mb-1", t.textSubtle)}>Prompt Tokens</p>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{formatNumber(summaryStats?.promptTokens || 0)}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              {summaryStats?.totalSessions ? Math.round(summaryStats.promptTokens / summaryStats.totalSessions).toLocaleString() : 0} avg/session
            </p>
          </div>
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <p className={cn("text-xs mb-1", t.textSubtle)}>Completion Tokens</p>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{formatNumber(summaryStats?.completionTokens || 0)}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              {summaryStats?.totalSessions ? Math.round(summaryStats.completionTokens / summaryStats.totalSessions).toLocaleString() : 0} avg/session
            </p>
          </div>
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <p className={cn("text-xs mb-1", t.textSubtle)}>Messages</p>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{(summaryStats?.totalMessages || 0).toLocaleString()}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              {summaryStats?.totalSessions ? (summaryStats.totalMessages / summaryStats.totalSessions).toFixed(1) : 0} avg/session
            </p>
          </div>
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <p className={cn("text-xs mb-1", t.textSubtle)}>Avg Duration</p>
            <p className={cn("text-2xl font-light", t.textPrimary)}>
              {summaryStats?.totalSessions
                ? formatDuration(summaryStats.totalDurationMs / summaryStats.totalSessions)
                : "0s"}
            </p>
            <p className={cn("text-xs mt-1", t.textDim)}>per session</p>
          </div>
        </div>

        {/* Model and Provider breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Models */}
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <h3 className={cn("text-xs font-normal mb-4", t.textMuted)}>Usage by Model</h3>
            <div className="space-y-3">
              {modelStats.map((m, i) => (
                <div key={m.model} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn("truncate max-w-[200px]", t.textSecondary)}>{m.model}</span>
                    <span className={t.textDim}>{formatNumber(m.totalTokens)}</span>
                  </div>
                  <ProgressBar
                    value={m.totalTokens}
                    max={modelStats[0]?.totalTokens || 1}
                    showPercentage={false}
                    color={theme === "dark" ? `bg-[${MODEL_COLORS[i % MODEL_COLORS.length]}]` : `bg-[${TAN_MODEL_COLORS[i % TAN_MODEL_COLORS.length]}]`}
                  />
                  <div className={cn("flex justify-between text-[10px]", t.textDim)}>
                    <span>{m.sessions} sessions</span>
                    <span>${m.cost.toFixed(4)}</span>
                    <span>{formatDuration(m.avgDurationMs)} avg</span>
                  </div>
                </div>
              ))}
              {modelStats.length === 0 && (
                <p className={cn("text-sm text-center py-4", t.textDim)}>No model data</p>
              )}
            </div>
          </div>

          {/* Providers */}
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <h3 className={cn("text-xs font-normal mb-4", t.textMuted)}>Usage by Provider</h3>
            <div className="space-y-3">
              {providerStats.map((p) => (
                <div key={p.provider} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn("capitalize", t.textSecondary)}>{p.provider}</span>
                    <span className={t.textDim}>{formatNumber(p.totalTokens)}</span>
                  </div>
                  <ProgressBar
                    value={p.totalTokens}
                    max={providerStats[0]?.totalTokens || 1}
                    showPercentage={false}
                    color={theme === "dark" ? "bg-zinc-600" : "bg-[#8b7355]"}
                  />
                  <div className={cn("flex justify-between text-[10px]", t.textDim)}>
                    <span>{p.sessions} sessions</span>
                    <span>${p.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
              {providerStats.length === 0 && (
                <p className={cn("text-sm text-center py-4", t.textDim)}>No provider data</p>
              )}
            </div>
          </div>
        </div>

        {/* Projects table */}
        <div className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}>
          <div className={cn("px-4 py-3 border-b", t.border)}>
            <h3 className={cn("text-xs font-normal", t.textMuted)}>Projects</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className={cn("border-b text-[10px] uppercase tracking-wider", t.borderLight, t.textDim)}>
                <th className="px-4 py-2 text-left font-normal">Project</th>
                <th className="px-4 py-2 text-right font-normal">Sessions</th>
                <th className="px-4 py-2 text-right font-normal">Tokens</th>
                <th className="px-4 py-2 text-right font-normal">Cost</th>
                <th className="px-4 py-2 text-right font-normal">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {projectStats.map((p) => (
                <tr key={p.project} className={cn("border-b transition-colors", t.borderLight, t.bgHover)}>
                  <td className={cn("px-4 py-2.5 text-sm truncate max-w-[300px]", t.textSecondary)}>{p.project}</td>
                  <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>{p.sessions}</td>
                  <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>{formatNumber(p.totalTokens)}</td>
                  <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>${p.cost.toFixed(4)}</td>
                  <td className={cn("px-4 py-2.5 text-sm text-right", t.textDim)}>{getTimeAgo(p.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {projectStats.length === 0 && (
            <div className={cn("px-4 py-8 text-center text-sm", t.textDim)}>No project data</div>
          )}
        </div>

        {/* Daily chart */}
        <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
          <h3 className={cn("text-xs font-normal mb-4", t.textMuted)}>Daily Activity</h3>
          <div className="h-40">
            <AreaChart
              data={dailyStats.map((d) => ({
                label: d.date,
                value: d.totalTokens,
              }))}
              height={160}
              color={theme === "dark" ? "#3b82f6" : "#EB5601"}
            />
          </div>
          <div className={cn("flex justify-between mt-2 text-[10px]", t.textDim)}>
            <span>{dailyStats[0]?.date}</span>
            <span>{dailyStats[dailyStats.length - 1]?.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function SessionRow({ session, isSelected, onClick, theme }: { session: any; isSelected: boolean; onClick: () => void; theme: "dark" | "tan" }) {
  const t = getThemeClasses(theme);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left",
        t.bgHover,
        isSelected && t.bgActive
      )}
    >
      <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", t.iconMuted)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", t.textSecondary)}>{session.title || "Untitled"}</p>
        <div className={cn("flex items-center gap-2 mt-0.5 text-[10px]", t.textDim)}>
          <span>{getTimeAgo(session.updatedAt)}</span>
          <span>{formatNumber(session.totalTokens)} tokens</span>
          {session.isPublic && <Globe className="h-3 w-3 text-emerald-500" />}
        </div>
      </div>
    </button>
  );
}

function SessionTableRow({ session, isSelected, onClick, theme }: { session: any; isSelected: boolean; onClick: () => void; theme: "dark" | "tan" }) {
  const t = getThemeClasses(theme);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full grid grid-cols-12 gap-2 px-4 py-2.5 transition-colors text-left items-center",
        t.bgHover,
        isSelected && t.bgActive
      )}
    >
      <div className="col-span-5 flex items-center gap-2 min-w-0">
        <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", t.iconMuted)} />
        <div className="min-w-0">
          <p className={cn("text-sm truncate", t.textSecondary)}>{session.title || "Untitled"}</p>
          <p className={cn("text-[10px] truncate", t.textDim)}>
            {session.model || "unknown"} · {getTimeAgo(session.updatedAt)}
          </p>
        </div>
      </div>
      <div className="col-span-2 text-right">
        <span className={cn("text-sm", t.textMuted)}>{formatNumber(session.totalTokens)}</span>
      </div>
      <div className="col-span-2 text-right">
        <span className={cn("text-sm", t.textSubtle)}>${session.cost.toFixed(4)}</span>
      </div>
      <div className="col-span-2 text-right">
        <span className={cn("text-sm", t.textDim)}>{formatDuration(session.durationMs)}</span>
      </div>
      <div className="col-span-1 flex justify-end">
        {session.isPublic && <Globe className="h-3 w-3 text-emerald-500" />}
      </div>
    </button>
  );
}

function MessageBubble({ message, theme }: { message: any; theme: "dark" | "tan" }) {
  const t = getThemeClasses(theme);
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div className={cn(
        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs",
        isUser ? t.bgUserBubble : t.bgAssistantBubble
      )}>
        {isUser ? <User className={cn("h-3 w-3", t.textMuted)} /> : <Bot className={cn("h-3 w-3", t.textSubtle)} />}
      </div>
      <div className={cn("flex-1 max-w-xl", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm",
          isUser 
            ? cn(t.bgUserBubble, t.textPrimary) 
            : cn(t.bgAssistantBubble, t.textSecondary, "border", t.border)
        )}>
          {message.parts?.map((part: any, i: number) => (
            <div key={i}>
              {part.type === "text" && <p className="whitespace-pre-wrap">{part.content}</p>}
              {part.type === "tool-call" && (
                <div className={cn("mt-2 p-2 rounded text-xs font-mono", t.bgCode)}>
                  <span className={t.textSubtle}>tool:</span> {part.content.name}
                </div>
              )}
            </div>
          ))}
          {!message.parts?.length && message.textContent && (
            <p className="whitespace-pre-wrap">{message.textContent}</p>
          )}
        </div>
        <span className={cn("text-[10px] mt-1", t.textDim)}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  field,
  current,
  order,
  onChange,
  className,
  theme,
}: {
  label: string;
  field: SortField;
  current: SortField;
  order: SortOrder;
  onChange: (field: SortField) => void;
  className?: string;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  const isActive = current === field;
  return (
    <button
      onClick={() => onChange(field)}
      className={cn("flex items-center gap-1 font-normal transition-colors", t.textMuted, className)}
    >
      {label}
      {isActive && (
        <ChevronDown className={cn("h-3 w-3", order === "asc" && "rotate-180")} />
      )}
    </button>
  );
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
  theme,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange: (v?: string) => void;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-xs", t.textSubtle)}>{label}</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cn("text-xs rounded px-2 py-1 focus:outline-none", t.bgCode, t.border, t.textSecondary)}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// Helpers
const MODEL_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const TAN_MODEL_COLORS = ["#EB5601", "#8b7355", "#d14a01", "#6b6b6b", "#a67c52", "#4a4a4a"];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDuration(ms?: number): string {
  if (!ms) return "0s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
