import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";
import { StatCard, BarChart, DonutChart, FilterPill, ProgressBar, ConsumptionBreakdown } from "../components/Charts";
import { ConfirmModal } from "../components/ConfirmModal";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Search,
  Settings,
  FileText,
  User,
  LogOut,
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
  X,
  LayoutList,
  Layers,
  Play,
  Hash,
  Zap,
  Activity,
  Timer,
  BarChart3,
  Github,
  FileDown,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// View modes
type ViewMode = "overview" | "sessions" | "evals" | "analytics";
type SortField = "updatedAt" | "createdAt" | "totalTokens" | "cost" | "durationMs";
type SortOrder = "asc" | "desc";
// Source filter type for filtering by plugin source
type SourceFilter = "all" | "opencode" | "claude-code";

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedSessionId, setSelectedSessionId] = useState<Id<"sessions"> | null>(null);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterModel, setFilterModel] = useState<string | undefined>();
  const [filterProject, setFilterProject] = useState<string | undefined>();
  const [filterProvider, setFilterProvider] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  // Source filter for OpenCode vs Claude Code sessions
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  // Ensure user exists
  const getOrCreate = useMutation(api.users.getOrCreate);
  useEffect(() => {
    getOrCreate();
  }, [getOrCreate]);

  // Convert sourceFilter to query arg (undefined means all)
  const sourceArg = sourceFilter === "all" ? undefined : sourceFilter;

  // Fetch data with source filtering
  const summaryStats = useQuery(api.analytics.summaryStats, { source: sourceArg });
  const dailyStats = useQuery(api.analytics.dailyStats, { days: 30, source: sourceArg });
  const modelStats = useQuery(api.analytics.modelStats, { source: sourceArg });
  const projectStats = useQuery(api.analytics.projectStats, { source: sourceArg });
  const providerStats = useQuery(api.analytics.providerStats, { source: sourceArg });
  const sessionsData = useQuery(api.analytics.sessionsWithDetails, {
    limit: 100,
    sortBy: sortField,
    sortOrder,
    filterModel,
    filterProject,
    filterProvider,
    source: sourceArg,
  });

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

  const displaySessions = sessionsData?.sessions || [];

  const hasActiveFilters = !!(filterModel || filterProject || filterProvider);

  const clearFilters = () => {
    setFilterModel(undefined);
    setFilterProject(undefined);
    setFilterProvider(undefined);
  };

  return (
    <div className={cn("h-screen flex flex-col", t.bgPrimary)}>
      {/* Header */}
      <header className={cn("h-12 border-b flex items-center px-3 sm:px-4 gap-2 sm:gap-4", t.border, t.bgPrimary)}>
        <Link to="/" className={cn("font-normal text-sm tracking-tight shrink-0", t.textSecondary)}>
          opensync
        </Link>

        {/* Source filter dropdown - hidden on small mobile */}
        <div className="hidden sm:block">
          <SourceDropdown
            value={sourceFilter}
            onChange={setSourceFilter}
            theme={theme}
          />
        </div>

        {/* View toggles - scrollable on mobile */}
        <div className={cn("flex items-center gap-1 rounded-md p-0.5 border overflow-x-auto scrollbar-hide", t.bgToggle, t.border)}>
          {(["overview", "sessions", "evals", "analytics"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-2 sm:px-3 py-1 text-[11px] sm:text-xs rounded transition-colors capitalize whitespace-nowrap shrink-0",
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
        <div className="flex-1 min-w-0" />

        {/* Navigation links - hidden on mobile, icons only on tablet */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/context"
            className={cn("flex items-center gap-1.5 text-xs transition-colors", t.textSubtle, "hover:opacity-80")}
            title="Search and context"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Context</span>
          </Link>
          <Link
            to="/docs"
            className={cn("text-xs transition-colors", t.textSubtle, "hover:opacity-80")}
          >
            Docs
          </Link>
        </div>

        {/* Right nav */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Context link - mobile only (icon) */}
          <Link
            to="/context"
            className={cn("md:hidden p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
            title="Search and context"
          >
            <Search className="h-4 w-4" />
          </Link>
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

        {viewMode === "evals" && (
          <EvalsView theme={theme} />
        )}

        {viewMode === "analytics" && (
          <AnalyticsView
            summaryStats={summaryStats}
            modelStats={modelStats || []}
            projectStats={projectStats || []}
            providerStats={providerStats || []}
            theme={theme}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={cn("h-10 border-t flex items-center justify-between px-3 sm:px-4", t.border, t.bgPrimary)}>
        <a
          href="https://github.com/waynesutton/opensync"
          target="_blank"
          rel="noopener noreferrer"
          className={cn("flex items-center gap-1.5 text-xs transition-colors", t.textDim, "hover:opacity-80")}
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">opensync</span>
        </a>
        <a
          href="https://convex.dev"
          target="_blank"
          rel="noopener noreferrer"
          className={cn("text-[10px] sm:text-xs transition-colors", t.textDim, "hover:opacity-80")}
        >
          <span className="sm:hidden">convex</span>
          <span className="hidden sm:inline">powered by convex</span>
        </a>
      </footer>
    </div>
  );
}

// Setup banner for new users with no data
function SetupBanner({ theme, onDismiss }: { theme: "dark" | "tan"; onDismiss: () => void }) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";
  
  return (
    <div className={cn(
      "relative rounded-lg border p-4",
      isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-[#f5f3f0] border-[#d5d0c8]"
    )}>
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className={cn(
          "absolute top-3 right-3 p-1 rounded transition-colors",
          t.textSubtle, t.bgHover
        )}
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          isDark ? "bg-blue-500/15" : "bg-[#EB5601]/10"
        )}>
          <Zap className={cn("h-5 w-5", isDark ? "text-blue-400" : "text-[#EB5601]")} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-sm font-medium mb-1", t.textPrimary)}>
            Connect your coding sessions
          </h3>
          <p className={cn("text-xs mb-4", t.textMuted)}>
            Install a sync plugin to start tracking your AI coding sessions. Choose based on your workflow.
          </p>
          
          {/* Plugin cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* OpenCode Plugin */}
            <div className={cn(
              "rounded-lg border p-3",
              isDark ? "bg-zinc-900/50 border-zinc-700" : "bg-white border-[#e5e0d8]"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-blue-500/15 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-blue-400">OC</span>
                </div>
                <span className={cn("text-xs font-medium", t.textSecondary)}>opencode-sync-plugin</span>
              </div>
              <p className={cn("text-[11px] mb-2", t.textDim)}>
                Sync your OpenCode sessions to the dashboard.
              </p>
              <div className={cn(
                "rounded px-2 py-1.5 text-[11px] font-mono mb-2",
                isDark ? "bg-zinc-800" : "bg-[#f5f3f0]",
                t.textMuted
              )}>
                npm install -g opencode-sync-plugin
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/waynesutton/opencode-sync-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-[10px] transition-colors",
                    isDark ? "text-blue-400 hover:text-blue-300" : "text-[#EB5601] hover:opacity-80"
                  )}
                >
                  <Github className="h-3 w-3" />
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/opencode-sync-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-[10px] transition-colors",
                    isDark ? "text-blue-400 hover:text-blue-300" : "text-[#EB5601] hover:opacity-80"
                  )}
                >
                  <ExternalLink className="h-3 w-3" />
                  npm
                </a>
              </div>
            </div>
            
            {/* Claude Code Plugin */}
            <div className={cn(
              "rounded-lg border p-3",
              isDark ? "bg-zinc-900/50 border-zinc-700" : "bg-white border-[#e5e0d8]"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-amber-500/15 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-amber-500">CC</span>
                </div>
                <span className={cn("text-xs font-medium", t.textSecondary)}>claude-code-sync</span>
              </div>
              <p className={cn("text-[11px] mb-2", t.textDim)}>
                Sync your Claude Code sessions to the dashboard.
              </p>
              <div className={cn(
                "rounded px-2 py-1.5 text-[11px] font-mono mb-2",
                isDark ? "bg-zinc-800" : "bg-[#f5f3f0]",
                t.textMuted
              )}>
                npm install -g claude-code-sync
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/waynesutton/claude-code-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-[10px] transition-colors",
                    isDark ? "text-amber-400 hover:text-amber-300" : "text-[#EB5601] hover:opacity-80"
                  )}
                >
                  <Github className="h-3 w-3" />
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/claude-code-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-[10px] transition-colors",
                    isDark ? "text-amber-400 hover:text-amber-300" : "text-[#EB5601] hover:opacity-80"
                  )}
                >
                  <ExternalLink className="h-3 w-3" />
                  npm
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  
  // Setup banner visibility state (persisted in localStorage)
  const [showSetupBanner, setShowSetupBanner] = useState(() => {
    const dismissed = localStorage.getItem("opensync_setup_banner_dismissed");
    return dismissed !== "true";
  });
  
  // Check if data is still loading (summaryStats is undefined while query is in progress)
  const isLoading = summaryStats === undefined;
  
  // Only show banner when data has loaded AND there are no sessions
  // This prevents the flash on refresh when user has data
  const hasNoData = !isLoading && summaryStats.totalSessions === 0;
  
  // Handler to dismiss banner
  const handleDismissBanner = () => {
    setShowSetupBanner(false);
    localStorage.setItem("opensync_setup_banner_dismissed", "true");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Setup banner for new users */}
        {hasNoData && showSetupBanner && (
          <SetupBanner theme={theme} onDismiss={handleDismissBanner} />
        )}
        
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

        {/* Usage Overview Section */}
        <ConsumptionBreakdown
          dailyStats={dailyStats}
          modelStats={modelStats}
          projectStats={projectStats}
          summaryStats={summaryStats}
          theme={theme}
        />

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

        {/* Token Usage and Model Distribution */}
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
      </div>
    </div>
  );
}

// Sessions view mode type
type SessionsViewMode = "list" | "timeline";

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
  const setEvalReady = useMutation(api.evals.setEvalReady);
  const markdown = useQuery(
    api.sessions.getMarkdown,
    selectedSession?.session?._id ? { sessionId: selectedSession.session._id } : "skip"
  );
  const csvData = useQuery(api.sessions.exportAllDataCSV);
  const [copied, setCopied] = useState(false);
  const [sessionsViewMode, setSessionsViewMode] = useState<SessionsViewMode>("list");
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Id<"sessions"> | null>(null);
  const [isTogglingEval, setIsTogglingEval] = useState(false);

  // CSV export handler
  const handleExportCSV = () => {
    if (!csvData) return;
    setIsExportingCSV(true);
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `opensync_sessions_${timestamp}.csv`;
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setIsExportingCSV(false), 1000);
  };
  
  // Drag scroll state for sessions list
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Horizontal drag scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCopy = async () => {
    if (markdown) {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (markdown && selectedSession?.session) {
      // Sanitize filename - remove special characters that might cause issues
      const safeTitle = (selectedSession.session.title || "session")
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, "_")
        .slice(0, 100);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${safeTitle}_${timestamp}.md`;
      
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  // Check if markdown is loading
  const isMarkdownLoading = selectedSession?.session?._id && markdown === undefined;

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Sessions list - hidden on mobile when session selected */}
      <div className={cn(
        "flex flex-col border-r",
        t.border,
        selectedSession ? "hidden lg:flex lg:w-1/2" : "w-full"
      )}>
        {/* Filters bar */}
        <div className={cn("px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center gap-2 sm:gap-3 flex-wrap", t.border)}>
          <button
            onClick={onToggleFilters}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors shrink-0",
              showFilters || hasActiveFilters
                ? cn(t.bgToggleActive, t.textSecondary)
                : cn(t.textSubtle, t.bgHover)
            )}
          >
            <Filter className="h-3 w-3" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className={cn("w-1.5 h-1.5 rounded-full", theme === "dark" ? "bg-blue-500" : "bg-[#EB5601]")} />}
          </button>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
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
                Clear
              </button>
            </div>
          )}

          <div className="flex-1 min-w-0" />

          {/* View mode toggle */}
          <div className={cn("flex items-center gap-1 rounded-md p-0.5 border shrink-0", t.bgToggle, t.border)}>
            <button
              onClick={() => setSessionsViewMode("list")}
              className={cn(
                "p-1 rounded transition-colors",
                sessionsViewMode === "list"
                  ? cn(t.bgToggleActive, t.textPrimary)
                  : cn(t.textSubtle, "hover:opacity-80")
              )}
              title="List view"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setSessionsViewMode("timeline")}
              className={cn(
                "hidden sm:block p-1 rounded transition-colors",
                sessionsViewMode === "timeline"
                  ? cn(t.bgToggleActive, t.textPrimary)
                  : cn(t.textSubtle, "hover:opacity-80")
              )}
              title="Timeline view"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!csvData || isExportingCSV}
              className={cn(
                "p-1 rounded transition-colors",
                !csvData || isExportingCSV ? "opacity-50 cursor-not-allowed" : "",
                t.textSubtle, "hover:opacity-80"
              )}
              title="Export all sessions as CSV"
            >
              <FileDown className={cn("h-3.5 w-3.5", isExportingCSV && "animate-pulse")} />
            </button>
          </div>

          <span className={cn("text-xs shrink-0", t.textDim)}>{sessions.length}<span className="hidden sm:inline"> of {total}</span></span>
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

        {/* List View */}
        {sessionsViewMode === "list" && (
          <>
            {/* Sort header - simplified on mobile */}
            <div className={cn("hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b text-[10px] uppercase tracking-wider", t.borderLight, t.textDim)}>
              <div className="col-span-5">Title</div>
              <SortHeader label="Tokens" field="totalTokens" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2" alignRight theme={theme} />
              <SortHeader label="Cost" field="cost" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2" alignRight theme={theme} />
              <SortHeader label="Duration" field="durationMs" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2" alignRight theme={theme} />
              <div className="col-span-1" />
            </div>
            {/* Mobile sort header */}
            <div className={cn("sm:hidden flex items-center justify-between px-3 py-2 border-b text-[10px] uppercase tracking-wider", t.borderLight, t.textDim)}>
              <span>Sessions</span>
              <SortHeader label="Tokens" field="totalTokens" current={sortField} order={sortOrder} onChange={onSortChange} theme={theme} />
            </div>

            {/* Sessions list with drag scroll */}
            <div 
              ref={scrollContainerRef}
              className={cn(
                "flex-1 overflow-y-auto overflow-x-auto scrollbar-hide cursor-grab",
                isDragging && "cursor-grabbing select-none"
              )}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
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
          </>
        )}

        {/* Timeline View */}
        {sessionsViewMode === "timeline" && (
          <TimelineView
            sessions={sessions}
            selectedSessionId={selectedSession?.session?._id}
            onSelectSession={onSelectSession}
            theme={theme}
          />
        )}
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
                <div className="flex items-center gap-2">
                  <h2 className={cn("text-sm font-normal truncate", t.textPrimary)}>
                    {selectedSession.session.title || "Untitled Session"}
                  </h2>
                  {/* Source badge in detail header */}
                  {(() => {
                    const detailSource = selectedSession.session.source || "opencode";
                    const isClaudeCodeDetail = detailSource === "claude-code";
                    return (
                      <span className={cn(
                        "shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide",
                        isClaudeCodeDetail
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-blue-500/15 text-blue-400"
                      )}>
                        {isClaudeCodeDetail ? "Claude Code" : "OpenCode"}
                      </span>
                    );
                  })()}
                </div>
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
                disabled={isMarkdownLoading || !markdown}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  isMarkdownLoading || !markdown ? "opacity-50 cursor-not-allowed" : "",
                  t.textSubtle, t.bgHover
                )}
                title={isMarkdownLoading ? "Loading..." : "Download as Markdown"}
              >
                <Download className={cn("h-3.5 w-3.5", isMarkdownLoading && "animate-pulse")} />
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
              {/* Eval-ready toggle */}
              <button
                onClick={async () => {
                  setIsTogglingEval(true);
                  try {
                    await setEvalReady({
                      sessionId: selectedSession.session._id,
                      evalReady: !selectedSession.session.evalReady,
                    });
                  } finally {
                    setIsTogglingEval(false);
                  }
                }}
                disabled={isTogglingEval}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  selectedSession.session.evalReady ? "text-emerald-500" : t.textSubtle,
                  isTogglingEval ? "opacity-50" : "",
                  t.bgHover
                )}
                title={selectedSession.session.evalReady ? "Remove from Evals" : "Add to Evals"}
              >
                <CheckCircle2 className={cn("h-3.5 w-3.5", isTogglingEval && "animate-pulse")} />
              </button>
              <button
                onClick={() => {
                  setSessionToDelete(selectedSession.session._id);
                  setShowDeleteModal(true);
                }}
                className={cn("p-1.5 rounded transition-colors hover:text-red-400", t.textSubtle, t.bgHover)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {/* Close panel button - desktop */}
              <button
                onClick={() => onSelectSession(null)}
                className={cn("hidden lg:flex p-1.5 rounded transition-colors ml-2", t.textSubtle, t.bgHover)}
                title="Close panel"
              >
                <X className="h-3.5 w-3.5" />
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSessionToDelete(null);
        }}
        onConfirm={async () => {
          if (sessionToDelete) {
            await deleteSession({ sessionId: sessionToDelete });
            setSessionToDelete(null);
          }
        }}
        title="Delete Session"
        message="Delete this session? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

// Timeline View for Sessions - DAW-style track visualization
function TimelineView({
  sessions,
  selectedSessionId,
  onSelectSession,
  theme,
}: {
  sessions: any[];
  selectedSessionId?: Id<"sessions">;
  onSelectSession: (id: Id<"sessions"> | null) => void;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Group sessions by project
  const sessionsByProject = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    sessions.forEach((s) => {
      const project = s.projectName || s.projectPath || "Other";
      if (!grouped[project]) grouped[project] = [];
      grouped[project].push(s);
    });
    return grouped;
  }, [sessions]);

  // Calculate time range for visualization
  const timeRange = useMemo(() => {
    if (sessions.length === 0) return { min: Date.now() - 86400000, max: Date.now() };
    const times = sessions.map((s) => s.createdAt);
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [sessions]);

  const getPositionPercent = (timestamp: number) => {
    const range = timeRange.max - timeRange.min;
    if (range === 0) return 50;
    return ((timestamp - timeRange.min) / range) * 100;
  };

  const getWidthPercent = (durationMs?: number) => {
    if (!durationMs) return 2;
    const range = timeRange.max - timeRange.min;
    if (range === 0) return 5;
    return Math.max(2, Math.min(30, (durationMs / range) * 100));
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Track colors by index
  const getTrackColor = (index?: number) => {
    const idx = index || 0;
    if (theme === "dark") {
      const colors = ["bg-blue-500/70", "bg-emerald-500/70", "bg-amber-500/70", "bg-purple-500/70", "bg-cyan-500/70", "bg-rose-500/70"];
      return colors[idx % colors.length];
    }
    const colors = ["bg-[#EB5601]/70", "bg-[#8b7355]/70", "bg-[#d14a01]/70", "bg-[#6b6b6b]/70", "bg-[#a67c52]/70", "bg-[#4a4a4a]/70"];
    return colors[idx % colors.length];
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Timeline header with time markers */}
      <div className={cn("flex border-b", t.border)}>
        <div className={cn("w-48 shrink-0 px-3 py-2 border-r text-[10px] uppercase tracking-wider", t.border, t.textDim)}>
          Projects
        </div>
        <div className="flex-1 relative h-8">
          <div className={cn("absolute inset-0 flex items-center px-4 text-[10px]", t.textDim)}>
            {[0, 25, 50, 75, 100].map((pct) => (
              <div key={pct} className="absolute" style={{ left: `${pct}%` }}>
                <span className={cn("px-1", t.bgPrimary)}>
                  {new Date(timeRange.min + ((timeRange.max - timeRange.min) * pct) / 100).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-auto scrollbar-hide cursor-grab",
          isDragging && "cursor-grabbing select-none"
        )}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {Object.entries(sessionsByProject).map(([project, projectSessions], projectIdx) => (
          <div key={project} className={cn("flex border-b min-w-max", t.border)}>
            {/* Project label */}
            <div className={cn("w-48 shrink-0 px-3 py-3 border-r flex items-center gap-2", t.border, t.bgSecondary)}>
              <div className={cn("w-2 h-2 rounded-full", getTrackColor(projectIdx))} />
              <div className="min-w-0">
                <p className={cn("text-xs truncate font-medium", t.textSecondary)}>{project}</p>
                <p className={cn("text-[10px]", t.textDim)}>{projectSessions.length} sessions</p>
              </div>
            </div>

            {/* Timeline track */}
            <div className={cn("flex-1 relative h-16 min-w-[800px]", t.bgPrimary)}>
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <div
                    key={pct}
                    className={cn("absolute h-full border-l", t.borderLight)}
                    style={{ left: `${pct}%` }}
                  />
                ))}
              </div>

              {/* Session blocks */}
              {projectSessions.map((session) => {
                const left = getPositionPercent(session.createdAt);
                const width = getWidthPercent(session.durationMs);
                const isSelected = selectedSessionId === session._id;
                
                return (
                  <button
                    key={session._id}
                    onClick={() => onSelectSession(session._id)}
                    className={cn(
                      "absolute top-2 h-12 rounded-sm transition-all flex items-center px-2 overflow-hidden",
                      getTrackColor(projectIdx),
                      isSelected && "ring-2 ring-offset-1",
                      theme === "dark" ? "ring-white ring-offset-zinc-900" : "ring-[#1a1a1a] ring-offset-[#f5f0e8]"
                    )}
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: "60px" }}
                    title={`${session.title || "Untitled"} - ${formatNumber(session.totalTokens)} tokens`}
                  >
                    <div className="min-w-0 text-left">
                      <p className={cn("text-[10px] font-medium truncate", theme === "dark" ? "text-white" : "text-white")}>
                        {session.title || "Untitled"}
                      </p>
                      <p className={cn("text-[9px] opacity-80 truncate", theme === "dark" ? "text-white/70" : "text-white/80")}>
                        {formatNumber(session.totalTokens)} tokens
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className={cn("flex items-center justify-center h-40 text-sm", t.textDim)}>
            No sessions found
          </div>
        )}
      </div>

      {/* Footer with legend */}
      <div className={cn("px-4 py-2 border-t flex items-center gap-4 text-[10px]", t.border, t.textDim)}>
        <span className="flex items-center gap-1">
          <Play className="h-3 w-3" />
          Click session to view details
        </span>
        <span className="flex items-center gap-1">
          <Timer className="h-3 w-3" />
          Width = duration
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Drag to scroll
        </span>
      </div>
    </div>
  );
}

// Export format type for evals
type ExportFormat = "deepeval" | "openai" | "filesystem";

// Evals View - Evaluation sessions and export
function EvalsView({ theme }: { theme: "dark" | "tan" }) {
  const t = getThemeClasses(theme);
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
  const setEvalReady = useMutation(api.evals.setEvalReady);

  // Queries
  const evalData = useQuery(api.evals.listEvalSessions, {
    source: sourceFilter,
    tags: tagFilter ? [tagFilter] : undefined,
  });
  const allTags = useQuery(api.evals.getEvalTags);
  const generateExport = useAction(api.evals.generateEvalExport);

  // Computed
  const sessions = evalData?.sessions || [];
  const stats = evalData?.stats || { total: 0, bySource: { opencode: 0, claudeCode: 0 }, totalTestCases: 0 };
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

  // Source badge inline component
  const SourceBadge = ({ source }: { source?: string }) => {
    const isClaudeCode = source === "claude-code";
    return (
      <span
        className={cn(
          "inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded",
          isClaudeCode
            ? isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-700"
            : isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
        )}
      >
        {isClaudeCode ? "CC" : "OC"}
      </span>
    );
  };

  // Tag badge inline component
  const TagBadge = ({ tag }: { tag: string }) => (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded",
        isDark ? "bg-zinc-700 text-zinc-300" : "bg-[#ebe9e6] text-[#6b6b6b]"
      )}
    >
      {tag}
    </span>
  );

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Eval Sessions" value={stats.total} theme={theme} />
          <StatCard label="Test Cases" value={stats.totalTestCases} theme={theme} />
          <StatCard label="OpenCode" value={stats.bySource.opencode} theme={theme} />
          <StatCard label="Claude Code" value={stats.bySource.claudeCode} theme={theme} />
        </div>

        {/* Filters and actions bar */}
        <div className={cn("flex items-center justify-between p-3 rounded-lg border", t.bgCard, t.border)}>
          <div className="flex items-center gap-2">
            {/* Source filter */}
            <select
              value={sourceFilter || ""}
              onChange={(e) => setSourceFilter(e.target.value || undefined)}
              className={cn("text-xs px-2 py-1.5 rounded border", t.bgInput, t.border, t.textPrimary)}
            >
              <option value="">All Sources</option>
              <option value="opencode">OpenCode</option>
              <option value="claude-code">Claude Code</option>
            </select>

            {/* Tag filter */}
            {allTags && allTags.length > 0 && (
              <select
                value={tagFilter || ""}
                onChange={(e) => setTagFilter(e.target.value || undefined)}
                className={cn("text-xs px-2 py-1.5 rounded border", t.bgInput, t.border, t.textPrimary)}
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
                className={cn("text-xs px-2 py-1.5 rounded border", t.bgInput, t.border, t.textSubtle)}
              >
                {selectedSessions.size === sessions.length ? "Deselect All" : "Select All"}
              </button>
            )}

            {/* Export button */}
            <button
              onClick={() => setShowExportModal(true)}
              disabled={sessions.length === 0}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-colors",
                sessions.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "",
                isDark
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-[#EB5601] text-white hover:bg-[#d14d01]"
              )}
            >
              <FileDown className="h-3.5 w-3.5" />
              Export for Evals
              {selectedSessions.size > 0 && ` (${selectedSessions.size})`}
            </button>
          </div>
        </div>

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <div className={cn("text-center py-16 rounded-lg border", t.bgCard, t.border)}>
            <CheckCircle2 className={cn("h-12 w-12 mx-auto mb-4", t.textDim)} />
            <h3 className={cn("text-lg font-medium mb-2", t.textPrimary)}>No Eval-Ready Sessions</h3>
            <p className={cn("text-sm max-w-md mx-auto", t.textMuted)}>
              Mark sessions as eval-ready from the Sessions view to add them here for export.
            </p>
          </div>
        ) : (
          <div className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}>
            <div className={cn("overflow-x-auto")}>
              <table className="w-full">
                <thead>
                  <tr className={cn("border-b text-left", t.border)}>
                    <th className={cn("px-4 py-3 text-xs font-medium w-10", t.textMuted)}></th>
                    <th className={cn("px-4 py-3 text-xs font-medium", t.textMuted)}>Session</th>
                    <th className={cn("px-4 py-3 text-xs font-medium", t.textMuted)}>Source</th>
                    <th className={cn("px-4 py-3 text-xs font-medium", t.textMuted)}>Model</th>
                    <th className={cn("px-4 py-3 text-xs font-medium", t.textMuted)}>Messages</th>
                    <th className={cn("px-4 py-3 text-xs font-medium", t.textMuted)}>Tags</th>
                    <th className={cn("px-4 py-3 text-xs font-medium", t.textMuted)}>Reviewed</th>
                    <th className={cn("px-4 py-3 text-xs font-medium w-10", t.textMuted)}></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr
                      key={session._id}
                      className={cn(
                        "border-b transition-colors",
                        t.border,
                        selectedSessions.has(session._id) ? (isDark ? "bg-zinc-800/50" : "bg-[#f5f3f0]") : t.bgHover
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSessions.has(session._id)}
                          onChange={() => handleToggleSession(session._id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Folder className={cn("h-3.5 w-3.5 flex-shrink-0", t.textDim)} />
                          <div className="min-w-0">
                            <p className={cn("text-sm truncate", t.textPrimary)}>
                              {session.title || session.externalId.slice(0, 8)}
                            </p>
                            <p className={cn("text-xs truncate", t.textDim)}>
                              {session.projectPath || "Unknown project"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge source={session.source} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs", t.textMuted)}>{session.model || "Unknown"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs", t.textMuted)}>{session.messageCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {session.evalTags?.slice(0, 2).map((tag) => (
                            <TagBadge key={tag} tag={tag} />
                          ))}
                          {(session.evalTags?.length || 0) > 2 && (
                            <span className={cn("text-[10px]", t.textDim)}>
                              +{session.evalTags!.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs", t.textMuted)}>
                          {session.reviewedAt
                            ? new Date(session.reviewedAt).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            await setEvalReady({
                              sessionId: session._id,
                              evalReady: false,
                            });
                          }}
                          className={cn("p-1 rounded hover:bg-red-500/20 text-red-400")}
                          title="Remove from evals"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={cn("w-full max-w-md rounded-lg border shadow-xl", t.bgPrimary, t.border)}>
            <div className={cn("flex items-center justify-between px-4 py-3 border-b", t.border)}>
              <h2 className={cn("text-sm font-medium", t.textPrimary)}>Export for Evals</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className={cn("p-1 rounded", t.textSubtle, t.bgHover)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Format selection */}
              <div>
                <label className={cn("block text-xs font-medium mb-2", t.textMuted)}>
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "deepeval", label: "DeepEval", desc: "JSON" },
                    { id: "openai", label: "OpenAI", desc: "JSONL" },
                    { id: "filesystem", label: "Files", desc: "Plain Text" },
                  ] as const).map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setExportFormat(format.id)}
                      className={cn(
                        "p-3 rounded border text-left transition-colors",
                        exportFormat === format.id
                          ? isDark
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-[#EB5601] bg-[#EB5601]/10"
                          : cn(t.border, t.bgHover)
                      )}
                    >
                      <p className={cn("text-sm font-medium", t.textPrimary)}>{format.label}</p>
                      <p className={cn("text-[10px]", t.textDim)}>{format.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className={cn("block text-xs font-medium mb-2", t.textMuted)}>
                  Options
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSystemPrompts}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeSystemPrompts: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className={cn("text-xs", t.textSecondary)}>Include system prompts</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeToolCalls}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeToolCalls: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className={cn("text-xs", t.textSecondary)}>Include tool calls in context</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.anonymizePaths}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        anonymizePaths: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className={cn("text-xs", t.textSecondary)}>Anonymize file paths</span>
                </label>
              </div>

              {/* Summary */}
              <div className={cn("p-3 rounded border text-xs", t.bgCard, t.border)}>
                <p className={t.textMuted}>
                  {selectedSessions.size > 0
                    ? `Export ${selectedSessions.size} selected session${selectedSessions.size > 1 ? "s" : ""}`
                    : `Export all ${sessions.length} eval-ready session${sessions.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            <div className={cn("flex items-center justify-end gap-2 px-4 py-3 border-t", t.border)}>
              <button
                onClick={() => setShowExportModal(false)}
                className={cn("px-3 py-1.5 text-xs rounded", t.textSubtle, t.bgHover)}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium",
                  isExporting ? "opacity-50" : "",
                  isDark
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-[#EB5601] text-white hover:bg-[#d14d01]"
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
                    Export
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

// Sort field type for projects
type ProjectSortField = "project" | "sessions" | "totalTokens" | "cost" | "lastActive" | "totalDurationMs";

// Analytics View - Charts and insights
function AnalyticsView({
  summaryStats,
  modelStats,
  projectStats,
  providerStats,
  theme,
}: {
  summaryStats: any;
  modelStats: any[];
  projectStats: any[];
  providerStats: any[];
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  
  // Filter and sort state for projects
  const [projectSearch, setProjectSearch] = useState("");
  const [projectSortField, setProjectSortField] = useState<ProjectSortField>("lastActive");
  const [projectSortOrder, setProjectSortOrder] = useState<SortOrder>("desc");
  const [minSessions, setMinSessions] = useState<number | undefined>();
  const [minTokens, setMinTokens] = useState<number | undefined>();
  
  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projectStats];
    
    // Search filter
    if (projectSearch.trim()) {
      const query = projectSearch.toLowerCase();
      filtered = filtered.filter((p) => p.project.toLowerCase().includes(query));
    }
    
    // Min sessions filter
    if (minSessions !== undefined) {
      filtered = filtered.filter((p) => p.sessions >= minSessions);
    }
    
    // Min tokens filter
    if (minTokens !== undefined) {
      filtered = filtered.filter((p) => p.totalTokens >= minTokens);
    }
    
    // Sort
    filtered.sort((a, b) => {
      const aVal = a[projectSortField] ?? 0;
      const bVal = b[projectSortField] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return projectSortOrder === "desc" 
          ? bVal.localeCompare(aVal) 
          : aVal.localeCompare(bVal);
      }
      return projectSortOrder === "desc" 
        ? (bVal as number) - (aVal as number) 
        : (aVal as number) - (bVal as number);
    });
    
    return filtered;
  }, [projectStats, projectSearch, minSessions, minTokens, projectSortField, projectSortOrder]);

  const handleProjectSort = (field: ProjectSortField) => {
    if (field === projectSortField) {
      setProjectSortOrder(projectSortOrder === "asc" ? "desc" : "asc");
    } else {
      setProjectSortField(field);
      setProjectSortOrder("desc");
    }
  };

  const hasActiveProjectFilters = !!(projectSearch.trim() || minSessions !== undefined || minTokens !== undefined);
  
  const clearProjectFilters = () => {
    setProjectSearch("");
    setMinSessions(undefined);
    setMinTokens(undefined);
  };
  
  // Calculate efficiency metrics
  const avgTokensPerMessage = summaryStats?.totalMessages 
    ? Math.round(summaryStats.totalTokens / summaryStats.totalMessages) 
    : 0;
  const promptToCompletionRatio = summaryStats?.completionTokens 
    ? (summaryStats.promptTokens / summaryStats.completionTokens).toFixed(2) 
    : "0";
  const avgCostPer1kTokens = summaryStats?.totalTokens 
    ? ((summaryStats.totalCost / summaryStats.totalTokens) * 1000).toFixed(4) 
    : "0";
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Token Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={cn("h-4 w-4", theme === "dark" ? "text-blue-400" : "text-[#EB5601]")} />
              <p className={cn("text-xs", t.textSubtle)}>Prompt Tokens</p>
            </div>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{formatNumber(summaryStats?.promptTokens || 0)}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              {summaryStats?.totalSessions ? Math.round(summaryStats.promptTokens / summaryStats.totalSessions).toLocaleString() : 0} avg/session
            </p>
          </div>
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className={cn("h-4 w-4", theme === "dark" ? "text-emerald-400" : "text-[#8b7355]")} />
              <p className={cn("text-xs", t.textSubtle)}>Completion Tokens</p>
            </div>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{formatNumber(summaryStats?.completionTokens || 0)}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              {summaryStats?.totalSessions ? Math.round(summaryStats.completionTokens / summaryStats.totalSessions).toLocaleString() : 0} avg/session
            </p>
          </div>
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex items-center gap-2 mb-2">
              <Hash className={cn("h-4 w-4", theme === "dark" ? "text-amber-400" : "text-[#d14a01]")} />
              <p className={cn("text-xs", t.textSubtle)}>Total Tokens</p>
            </div>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{formatNumber(summaryStats?.totalTokens || 0)}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              Ratio: {promptToCompletionRatio}:1
            </p>
          </div>
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className={cn("h-4 w-4", theme === "dark" ? "text-purple-400" : "text-[#6b6b6b]")} />
              <p className={cn("text-xs", t.textSubtle)}>Messages</p>
            </div>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{(summaryStats?.totalMessages || 0).toLocaleString()}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              {summaryStats?.totalSessions ? (summaryStats.totalMessages / summaryStats.totalSessions).toFixed(1) : 0} avg/session
            </p>
          </div>
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex items-center gap-2 mb-2">
              <Timer className={cn("h-4 w-4", theme === "dark" ? "text-cyan-400" : "text-[#a67c52]")} />
              <p className={cn("text-xs", t.textSubtle)}>Total Duration</p>
            </div>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{formatDuration(summaryStats?.totalDurationMs || 0)}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              {summaryStats?.totalSessions ? formatDuration(summaryStats.totalDurationMs / summaryStats.totalSessions) : "0s"} avg
            </p>
          </div>
          <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className={cn("h-4 w-4", theme === "dark" ? "text-rose-400" : "text-[#4a4a4a]")} />
              <p className={cn("text-xs", t.textSubtle)}>Tokens/Message</p>
            </div>
            <p className={cn("text-2xl font-light", t.textPrimary)}>{avgTokensPerMessage.toLocaleString()}</p>
            <p className={cn("text-xs mt-1", t.textDim)}>
              ${avgCostPer1kTokens}/1K tokens
            </p>
          </div>
        </div>

        {/* Model and Provider breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Models with detailed metrics */}
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

        {/* Efficiency Metrics */}
        <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
          <h3 className={cn("text-xs font-normal mb-4", t.textMuted)}>Efficiency Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className={cn("text-[10px] uppercase tracking-wider mb-1", t.textDim)}>Cost per Session</p>
              <p className={cn("text-lg font-light", t.textPrimary)}>
                ${(summaryStats?.avgCostPerSession || 0).toFixed(4)}
              </p>
            </div>
            <div>
              <p className={cn("text-[10px] uppercase tracking-wider mb-1", t.textDim)}>Cost per 1K Tokens</p>
              <p className={cn("text-lg font-light", t.textPrimary)}>
                ${avgCostPer1kTokens}
              </p>
            </div>
            <div>
              <p className={cn("text-[10px] uppercase tracking-wider mb-1", t.textDim)}>Prompt/Completion Ratio</p>
              <p className={cn("text-lg font-light", t.textPrimary)}>
                {promptToCompletionRatio}:1
              </p>
            </div>
            <div>
              <p className={cn("text-[10px] uppercase tracking-wider mb-1", t.textDim)}>Avg Tokens per Message</p>
              <p className={cn("text-lg font-light", t.textPrimary)}>
                {avgTokensPerMessage.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Projects table with expanded metrics */}
        <div className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}>
          {/* Filter bar */}
          <div className={cn("px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center gap-2 sm:gap-3 flex-wrap", t.border)}>
            <h3 className={cn("text-xs font-normal", t.textMuted)}>Projects</h3>
            
            <div className="flex-1 min-w-0" />
            
            {/* Search */}
            <div className="relative">
              <Search className={cn("absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3", t.iconMuted)} />
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search..."
                className={cn(
                  "h-7 pl-7 pr-2 rounded border text-xs focus:outline-none w-28 sm:w-40",
                  t.bgInput, t.borderInput, t.textSecondary, t.textPlaceholder, t.borderFocus
                )}
              />
            </div>
            
            {/* Min sessions filter - hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className={cn("text-[10px]", t.textDim)}>Min:</span>
              <select
                value={minSessions ?? ""}
                onChange={(e) => setMinSessions(e.target.value ? Number(e.target.value) : undefined)}
                className={cn("text-xs rounded px-2 py-1 h-7 focus:outline-none", t.bgCode, t.border, t.textSecondary)}
              >
                <option value="">All</option>
                <option value="2">2+</option>
                <option value="5">5+</option>
                <option value="10">10+</option>
              </select>
            </div>
            
            {/* Min tokens filter - hidden on mobile */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className={cn("text-[10px]", t.textDim)}>Tokens:</span>
              <select
                value={minTokens ?? ""}
                onChange={(e) => setMinTokens(e.target.value ? Number(e.target.value) : undefined)}
                className={cn("text-xs rounded px-2 py-1 h-7 focus:outline-none", t.bgCode, t.border, t.textSecondary)}
              >
                <option value="">All</option>
                <option value="1000">1K+</option>
                <option value="10000">10K+</option>
                <option value="50000">50K+</option>
              </select>
            </div>
            
            {hasActiveProjectFilters && (
              <button onClick={clearProjectFilters} className={cn("text-xs", t.textSubtle)}>
                Clear
              </button>
            )}
            
            <span className={cn("text-[10px]", t.textDim)}>
              {filteredProjects.length}<span className="hidden sm:inline"> of {projectStats.length}</span>
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn("border-b text-[10px] uppercase tracking-wider", t.borderLight, t.textDim)}>
                  <th className="px-4 py-2 text-left font-normal">
                    <button 
                      onClick={() => handleProjectSort("project")}
                      className={cn("flex items-center gap-1", t.textMuted)}
                    >
                      Project
                      {projectSortField === "project" && (
                        <ChevronDown className={cn("h-3 w-3", projectSortOrder === "asc" && "rotate-180")} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-right font-normal">
                    <button 
                      onClick={() => handleProjectSort("sessions")}
                      className={cn("flex items-center gap-1 ml-auto", t.textMuted)}
                    >
                      Sessions
                      {projectSortField === "sessions" && (
                        <ChevronDown className={cn("h-3 w-3", projectSortOrder === "asc" && "rotate-180")} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-right font-normal">Messages</th>
                  <th className="px-4 py-2 text-right font-normal">
                    <button 
                      onClick={() => handleProjectSort("totalTokens")}
                      className={cn("flex items-center gap-1 ml-auto", t.textMuted)}
                    >
                      Total Tokens
                      {projectSortField === "totalTokens" && (
                        <ChevronDown className={cn("h-3 w-3", projectSortOrder === "asc" && "rotate-180")} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-right font-normal">Prompt</th>
                  <th className="px-4 py-2 text-right font-normal">Completion</th>
                  <th className="px-4 py-2 text-right font-normal">
                    <button 
                      onClick={() => handleProjectSort("totalDurationMs")}
                      className={cn("flex items-center gap-1 ml-auto", t.textMuted)}
                    >
                      Duration
                      {projectSortField === "totalDurationMs" && (
                        <ChevronDown className={cn("h-3 w-3", projectSortOrder === "asc" && "rotate-180")} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-right font-normal">
                    <button 
                      onClick={() => handleProjectSort("cost")}
                      className={cn("flex items-center gap-1 ml-auto", t.textMuted)}
                    >
                      Cost
                      {projectSortField === "cost" && (
                        <ChevronDown className={cn("h-3 w-3", projectSortOrder === "asc" && "rotate-180")} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-right font-normal">
                    <button 
                      onClick={() => handleProjectSort("lastActive")}
                      className={cn("flex items-center gap-1 ml-auto", t.textMuted)}
                    >
                      Last Active
                      {projectSortField === "lastActive" && (
                        <ChevronDown className={cn("h-3 w-3", projectSortOrder === "asc" && "rotate-180")} />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => (
                  <tr key={p.project} className={cn("border-b transition-colors", t.borderLight, t.bgHover)}>
                    <td className={cn("px-4 py-2.5 text-sm truncate max-w-[200px]", t.textSecondary)}>{p.project}</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>{p.sessions}</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>{p.messageCount || "-"}</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>{formatNumber(p.totalTokens)}</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right", t.textDim)}>{formatNumber(p.promptTokens || 0)}</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right", t.textDim)}>{formatNumber(p.completionTokens || 0)}</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right", t.textDim)}>{formatDuration(p.totalDurationMs)}</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>${p.cost.toFixed(4)}</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right", t.textDim)}>{getTimeAgo(p.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProjects.length === 0 && (
            <div className={cn("px-4 py-8 text-center text-sm", t.textDim)}>
              {projectStats.length === 0 ? "No project data" : "No projects match filters"}
            </div>
          )}
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
  // Determine source badge styling
  const source = session.source || "opencode";
  const isClaudeCode = source === "claude-code";
  
  return (
    <>
      {/* Desktop row */}
      <button
        onClick={onClick}
        className={cn(
          "hidden sm:grid w-full grid-cols-12 gap-2 px-4 py-2.5 transition-colors text-left items-center",
          t.bgHover,
          isSelected && t.bgActive
        )}
      >
        <div className="col-span-5 flex items-center gap-2 min-w-0">
          <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", t.iconMuted)} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={cn("text-sm truncate", t.textSecondary)}>{session.title || "Untitled"}</p>
              {/* Source badge - shows CC for Claude Code, OC for OpenCode */}
              <span className={cn(
                "shrink-0 px-1 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide",
                isClaudeCode
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-blue-500/15 text-blue-400"
              )}>
                {isClaudeCode ? "CC" : "OC"}
              </span>
            </div>
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
      
      {/* Mobile row */}
      <button
        onClick={onClick}
        className={cn(
          "sm:hidden w-full px-3 py-3 transition-colors text-left",
          t.bgHover,
          isSelected && t.bgActive
        )}
      >
        <div className="flex items-start gap-2">
          <MessageSquare className={cn("h-4 w-4 shrink-0 mt-0.5", t.iconMuted)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={cn("text-sm truncate", t.textSecondary)}>{session.title || "Untitled"}</p>
              <span className={cn(
                "shrink-0 px-1 py-0.5 rounded text-[9px] font-medium uppercase",
                isClaudeCode ? "bg-amber-500/15 text-amber-500" : "bg-blue-500/15 text-blue-400"
              )}>
                {isClaudeCode ? "CC" : "OC"}
              </span>
              {session.isPublic && <Globe className="h-3 w-3 text-emerald-500 shrink-0" />}
            </div>
            <div className={cn("flex items-center gap-2 mt-1 text-[11px]", t.textDim)}>
              <span>{formatNumber(session.totalTokens)} tokens</span>
              <span>·</span>
              <span>${session.cost.toFixed(4)}</span>
              <span>·</span>
              <span>{getTimeAgo(session.updatedAt)}</span>
            </div>
          </div>
        </div>
      </button>
    </>
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
  alignRight,
  theme,
}: {
  label: string;
  field: SortField;
  current: SortField;
  order: SortOrder;
  onChange: (field: SortField) => void;
  className?: string;
  alignRight?: boolean;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  const isActive = current === field;
  return (
    <div className={cn(className, alignRight && "flex justify-end")}>
      <button
        onClick={() => onChange(field)}
        className={cn("flex items-center gap-1 font-normal transition-colors", t.textMuted)}
      >
        {label}
        {isActive && (
          <ChevronDown className={cn("h-3 w-3", order === "asc" && "rotate-180")} />
        )}
      </button>
    </div>
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

// Source dropdown for filtering by plugin source (OpenCode vs Claude Code)
function SourceDropdown({
  value,
  onChange,
  theme,
}: {
  value: SourceFilter;
  onChange: (v: SourceFilter) => void;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  const options: Array<{ value: SourceFilter; label: string }> = [
    { value: "all", label: "All Sources" },
    { value: "opencode", label: "OpenCode" },
    { value: "claude-code", label: "Claude Code" },
  ];

  return (
    <div className={cn("relative flex items-center rounded-md p-0.5 border", t.bgToggle, t.border)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SourceFilter)}
        className={cn(
          "px-3 py-1 text-xs rounded appearance-none cursor-pointer focus:outline-none transition-colors bg-transparent",
          t.textSecondary
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className={t.bgToggle}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className={cn("absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none", t.iconMuted)} />
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
