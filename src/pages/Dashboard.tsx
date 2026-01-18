import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
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
} from "lucide-react";

// View modes
type ViewMode = "overview" | "sessions" | "analytics";
type SortField = "updatedAt" | "createdAt" | "totalTokens" | "cost" | "durationMs";
type SortOrder = "asc" | "desc";

export function DashboardPage() {
  const { user, signOut } = useAuth();
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
    <div className="h-screen flex flex-col bg-[#0E0E0E]">
      {/* Header */}
      <header className="h-12 border-b border-zinc-800/50 bg-[#0E0E0E] flex items-center px-4 gap-4">
        <Link to="/" className="font-normal text-zinc-300 text-sm tracking-tight">
          opensync
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full h-8 pl-9 pr-16 rounded-md bg-zinc-900/50 border border-zinc-800/50 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-zinc-700 pointer-events-none">
              <Command className="h-3 w-3" />
              <span className="text-[10px]">K</span>
            </div>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-zinc-900/50 rounded-md p-0.5 border border-zinc-800/50">
          {(["overview", "sessions", "analytics"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors capitalize",
                viewMode === mode
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Right nav */}
        <div className="flex items-center gap-1">
          <Link
            to="/docs"
            className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-400 transition-colors"
            title="Documentation"
          >
            <FileText className="h-4 w-4" />
          </Link>
          <Link
            to="/settings"
            className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-400 transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <div className="relative group ml-1">
            <button className="flex items-center gap-2 p-1 rounded hover:bg-zinc-800/50 transition-colors">
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User className="h-3 w-3 text-zinc-500" />
                </div>
              )}
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="px-3 py-2 border-b border-zinc-800/50">
                <p className="text-sm font-normal text-zinc-300">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-zinc-600">{user?.email}</p>
              </div>
              <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-800/50 w-full text-left text-red-400/80 transition-colors"
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
          />
        )}

        {viewMode === "analytics" && (
          <AnalyticsView
            summaryStats={summaryStats}
            dailyStats={dailyStats || []}
            modelStats={modelStats || []}
            projectStats={projectStats || []}
            providerStats={providerStats || []}
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
}: {
  summaryStats: any;
  dailyStats: any[];
  modelStats: any[];
  projectStats: any[];
  sessions: any[];
  onSelectSession: (id: Id<"sessions"> | null) => void;
  selectedSessionId: Id<"sessions"> | null;
}) {
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
            trendColor="#22c55e"
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <StatCard
            label="Total Tokens"
            value={formatNumber(summaryStats?.totalTokens || 0)}
            subValue={`${formatNumber(summaryStats?.promptTokens || 0)} in / ${formatNumber(summaryStats?.completionTokens || 0)} out`}
            trend={tokenTrend}
            trendColor="#3b82f6"
            icon={<Cpu className="h-4 w-4" />}
          />
          <StatCard
            label="Total Cost"
            value={`$${(summaryStats?.totalCost || 0).toFixed(2)}`}
            subValue={`$${(summaryStats?.avgCostPerSession || 0).toFixed(4)}/session`}
            icon={<Coins className="h-4 w-4" />}
          />
          <StatCard
            label="Duration"
            value={formatDuration(summaryStats?.totalDurationMs || 0)}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            label="Models"
            value={summaryStats?.uniqueModels || 0}
            icon={<Bot className="h-4 w-4" />}
          />
          <StatCard
            label="Projects"
            value={summaryStats?.uniqueProjects || 0}
            icon={<Folder className="h-4 w-4" />}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily usage chart */}
          <div className="lg:col-span-2 p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-normal text-zinc-400">Token Usage (30 days)</h3>
              <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
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
                  color: "bg-gradient-to-t from-blue-600 to-blue-500",
                }))}
                height={128}
                formatValue={(v) => formatNumber(v)}
              />
            </div>
          </div>

          {/* Model distribution */}
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <h3 className="text-xs font-normal text-zinc-400 mb-4">Model Distribution</h3>
            <div className="flex items-center justify-center">
              <DonutChart
                size={100}
                thickness={10}
                data={modelStats.slice(0, 5).map((m, i) => ({
                  label: m.model,
                  value: m.totalTokens,
                  color: MODEL_COLORS[i % MODEL_COLORS.length],
                }))}
              />
            </div>
            <div className="mt-4 space-y-1.5">
              {modelStats.slice(0, 4).map((m, i) => (
                <div key={m.model} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }}
                    />
                    <span className="text-zinc-400 truncate max-w-[120px]">{m.model}</span>
                  </span>
                  <span className="text-zinc-600">{formatNumber(m.totalTokens)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent sessions and projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent sessions */}
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
              <h3 className="text-xs font-normal text-zinc-400">Recent Sessions</h3>
              <span className="text-[10px] text-zinc-600">{sessions.length} total</span>
            </div>
            <div className="divide-y divide-zinc-800/30">
              {sessions.slice(0, 8).map((session) => (
                <SessionRow
                  key={session._id}
                  session={session}
                  isSelected={selectedSessionId === session._id}
                  onClick={() => onSelectSession(session._id)}
                />
              ))}
              {sessions.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-zinc-600">
                  No sessions yet
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/50">
              <h3 className="text-xs font-normal text-zinc-400">Projects</h3>
            </div>
            <div className="p-4 space-y-3">
              {projectStats.slice(0, 6).map((p) => (
                <div key={p.project} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300 truncate max-w-[200px]">{p.project}</span>
                    <span className="text-xs text-zinc-600">{formatNumber(p.totalTokens)} tokens</span>
                  </div>
                  <ProgressBar
                    value={p.totalTokens}
                    max={projectStats[0]?.totalTokens || 1}
                    showPercentage={false}
                    color="bg-zinc-600"
                  />
                </div>
              ))}
              {projectStats.length === 0 && (
                <div className="py-4 text-center text-sm text-zinc-600">
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
}) {
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
        "flex flex-col border-r border-zinc-800/50",
        selectedSession ? "hidden lg:flex lg:w-1/2" : "w-full"
      )}>
        {/* Filters bar */}
        <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-3">
          <button
            onClick={onToggleFilters}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
              showFilters || hasActiveFilters
                ? "bg-zinc-800 text-zinc-300"
                : "text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/50"
            )}
          >
            <Filter className="h-3 w-3" />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
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
              <button onClick={onClearFilters} className="text-xs text-zinc-500 hover:text-zinc-400">
                Clear all
              </button>
            </>
          )}

          <div className="flex-1" />

          <span className="text-xs text-zinc-600">{sessions.length} of {total}</span>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-4 bg-zinc-900/20">
            <FilterDropdown
              label="Model"
              options={filterOptions.models}
              value={filterModel}
              onChange={onFilterModel}
            />
            <FilterDropdown
              label="Project"
              options={filterOptions.projects}
              value={filterProject}
              onChange={onFilterProject}
            />
            <FilterDropdown
              label="Provider"
              options={filterOptions.providers}
              value={filterProvider}
              onChange={onFilterProvider}
            />
          </div>
        )}

        {/* Sort header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-zinc-800/30 text-[10px] text-zinc-600 uppercase tracking-wider">
          <div className="col-span-5">Title</div>
          <SortHeader label="Tokens" field="totalTokens" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2 text-right" />
          <SortHeader label="Cost" field="cost" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2 text-right" />
          <SortHeader label="Duration" field="durationMs" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2 text-right" />
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
            />
          ))}
          {sessions.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-zinc-600">
              No sessions found
            </div>
          )}
        </div>
      </div>

      {/* Session detail - full width on mobile */}
      {selectedSession && (
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Detail header */}
          <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button - mobile only */}
              <button
                onClick={() => onSelectSession(null)}
                className="lg:hidden p-1.5 rounded hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="min-w-0">
                <h2 className="text-sm font-normal text-zinc-200 truncate">
                  {selectedSession.session.title || "Untitled Session"}
                </h2>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-600">
                  {selectedSession.session.model && <span>{selectedSession.session.model}</span>}
                  <span>{formatNumber(selectedSession.session.totalTokens)} tokens</span>
                  <span>${selectedSession.session.cost.toFixed(4)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-400 transition-colors"
                title="Copy as Markdown"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-400 transition-colors"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setVisibility({ sessionId: selectedSession.session._id, isPublic: !selectedSession.session.isPublic })}
                className={cn(
                  "p-1.5 rounded hover:bg-zinc-800/50 transition-colors",
                  selectedSession.session.isPublic ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-400"
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
                  className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-400 transition-colors"
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
                className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-500 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedSession.messages.map((msg: any) => (
              <MessageBubble key={msg._id} message={msg} />
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
}: {
  summaryStats: any;
  dailyStats: any[];
  modelStats: any[];
  projectStats: any[];
  providerStats: any[];
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-1">Prompt Tokens</p>
            <p className="text-2xl font-light text-zinc-200">{formatNumber(summaryStats?.promptTokens || 0)}</p>
            <p className="text-xs text-zinc-600 mt-1">
              {summaryStats?.totalSessions ? Math.round(summaryStats.promptTokens / summaryStats.totalSessions).toLocaleString() : 0} avg/session
            </p>
          </div>
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-1">Completion Tokens</p>
            <p className="text-2xl font-light text-zinc-200">{formatNumber(summaryStats?.completionTokens || 0)}</p>
            <p className="text-xs text-zinc-600 mt-1">
              {summaryStats?.totalSessions ? Math.round(summaryStats.completionTokens / summaryStats.totalSessions).toLocaleString() : 0} avg/session
            </p>
          </div>
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-1">Messages</p>
            <p className="text-2xl font-light text-zinc-200">{(summaryStats?.totalMessages || 0).toLocaleString()}</p>
            <p className="text-xs text-zinc-600 mt-1">
              {summaryStats?.totalSessions ? (summaryStats.totalMessages / summaryStats.totalSessions).toFixed(1) : 0} avg/session
            </p>
          </div>
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-1">Avg Duration</p>
            <p className="text-2xl font-light text-zinc-200">
              {summaryStats?.totalSessions
                ? formatDuration(summaryStats.totalDurationMs / summaryStats.totalSessions)
                : "0s"}
            </p>
            <p className="text-xs text-zinc-600 mt-1">per session</p>
          </div>
        </div>

        {/* Model and Provider breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Models */}
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <h3 className="text-xs font-normal text-zinc-400 mb-4">Usage by Model</h3>
            <div className="space-y-3">
              {modelStats.map((m, i) => (
                <div key={m.model} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300 truncate max-w-[200px]">{m.model}</span>
                    <span className="text-zinc-600">{formatNumber(m.totalTokens)}</span>
                  </div>
                  <ProgressBar
                    value={m.totalTokens}
                    max={modelStats[0]?.totalTokens || 1}
                    showPercentage={false}
                    color={`bg-[${MODEL_COLORS[i % MODEL_COLORS.length]}]`}
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>{m.sessions} sessions</span>
                    <span>${m.cost.toFixed(4)}</span>
                    <span>{formatDuration(m.avgDurationMs)} avg</span>
                  </div>
                </div>
              ))}
              {modelStats.length === 0 && (
                <p className="text-sm text-zinc-600 text-center py-4">No model data</p>
              )}
            </div>
          </div>

          {/* Providers */}
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <h3 className="text-xs font-normal text-zinc-400 mb-4">Usage by Provider</h3>
            <div className="space-y-3">
              {providerStats.map((p) => (
                <div key={p.provider} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300 capitalize">{p.provider}</span>
                    <span className="text-zinc-600">{formatNumber(p.totalTokens)}</span>
                  </div>
                  <ProgressBar
                    value={p.totalTokens}
                    max={providerStats[0]?.totalTokens || 1}
                    showPercentage={false}
                    color="bg-zinc-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>{p.sessions} sessions</span>
                    <span>${p.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
              {providerStats.length === 0 && (
                <p className="text-sm text-zinc-600 text-center py-4">No provider data</p>
              )}
            </div>
          </div>
        </div>

        {/* Projects table */}
        <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <h3 className="text-xs font-normal text-zinc-400">Projects</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/30 text-[10px] text-zinc-600 uppercase tracking-wider">
                <th className="px-4 py-2 text-left font-normal">Project</th>
                <th className="px-4 py-2 text-right font-normal">Sessions</th>
                <th className="px-4 py-2 text-right font-normal">Tokens</th>
                <th className="px-4 py-2 text-right font-normal">Cost</th>
                <th className="px-4 py-2 text-right font-normal">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {projectStats.map((p) => (
                <tr key={p.project} className="border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-zinc-300 truncate max-w-[300px]">{p.project}</td>
                  <td className="px-4 py-2.5 text-sm text-zinc-500 text-right">{p.sessions}</td>
                  <td className="px-4 py-2.5 text-sm text-zinc-500 text-right">{formatNumber(p.totalTokens)}</td>
                  <td className="px-4 py-2.5 text-sm text-zinc-500 text-right">${p.cost.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-sm text-zinc-600 text-right">{getTimeAgo(p.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {projectStats.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-600">No project data</div>
          )}
        </div>

        {/* Daily chart */}
        <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
          <h3 className="text-xs font-normal text-zinc-400 mb-4">Daily Activity</h3>
          <div className="h-40">
            <AreaChart
              data={dailyStats.map((d) => ({
                label: d.date,
                value: d.totalTokens,
              }))}
              height={160}
              color="#3b82f6"
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-zinc-600">
            <span>{dailyStats[0]?.date}</span>
            <span>{dailyStats[dailyStats.length - 1]?.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function SessionRow({ session, isSelected, onClick }: { session: any; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors text-left",
        isSelected && "bg-zinc-800/40"
      )}
    >
      <MessageSquare className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{session.title || "Untitled"}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-600">
          <span>{getTimeAgo(session.updatedAt)}</span>
          <span>{formatNumber(session.totalTokens)} tokens</span>
          {session.isPublic && <Globe className="h-3 w-3 text-emerald-500" />}
        </div>
      </div>
    </button>
  );
}

function SessionTableRow({ session, isSelected, onClick }: { session: any; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors text-left items-center",
        isSelected && "bg-zinc-800/40"
      )}
    >
      <div className="col-span-5 flex items-center gap-2 min-w-0">
        <MessageSquare className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-zinc-300 truncate">{session.title || "Untitled"}</p>
          <p className="text-[10px] text-zinc-600 truncate">
            {session.model || "unknown"} · {getTimeAgo(session.updatedAt)}
          </p>
        </div>
      </div>
      <div className="col-span-2 text-right">
        <span className="text-sm text-zinc-400">{formatNumber(session.totalTokens)}</span>
      </div>
      <div className="col-span-2 text-right">
        <span className="text-sm text-zinc-500">${session.cost.toFixed(4)}</span>
      </div>
      <div className="col-span-2 text-right">
        <span className="text-sm text-zinc-600">{formatDuration(session.durationMs)}</span>
      </div>
      <div className="col-span-1 flex justify-end">
        {session.isPublic && <Globe className="h-3 w-3 text-emerald-500" />}
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div className={cn(
        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs",
        isUser ? "bg-zinc-700" : "bg-zinc-800"
      )}>
        {isUser ? <User className="h-3 w-3 text-zinc-400" /> : <Bot className="h-3 w-3 text-zinc-500" />}
      </div>
      <div className={cn("flex-1 max-w-xl", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm",
          isUser ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800/50 text-zinc-300 border border-zinc-800/50"
        )}>
          {message.parts?.map((part: any, i: number) => (
            <div key={i}>
              {part.type === "text" && <p className="whitespace-pre-wrap">{part.content}</p>}
              {part.type === "tool-call" && (
                <div className="mt-2 p-2 bg-zinc-900/50 rounded text-xs font-mono">
                  <span className="text-zinc-500">tool:</span> {part.content.name}
                </div>
              )}
            </div>
          ))}
          {!message.parts?.length && message.textContent && (
            <p className="whitespace-pre-wrap">{message.textContent}</p>
          )}
        </div>
        <span className="text-[10px] text-zinc-700 mt-1">
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
}: {
  label: string;
  field: SortField;
  current: SortField;
  order: SortOrder;
  onChange: (field: SortField) => void;
  className?: string;
}) {
  const isActive = current === field;
  return (
    <button
      onClick={() => onChange(field)}
      className={cn("flex items-center gap-1 font-normal hover:text-zinc-400 transition-colors", className)}
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
}: {
  label: string;
  options: string[];
  value?: string;
  onChange: (v?: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-600"
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
