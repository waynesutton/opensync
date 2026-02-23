import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { getSourceLabel, getSourceColorClass } from "../lib/source";
import { useTheme, getThemeClasses } from "../lib/theme";
import { StatCard, BarChart, DonutChart, FilterPill, ProgressBar, ConsumptionBreakdown } from "../components/Charts";
import { ConfirmModal } from "../components/ConfirmModal";
import { WrappedView } from "../components/WrappedView";
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
  Bell,
  CheckSquare,
  Square,
} from "lucide-react";

// View modes
type ViewMode = "overview" | "sessions" | "evals" | "analytics" | "wrapped";
type SortField = "updatedAt" | "createdAt" | "totalTokens" | "cost" | "durationMs";
type SortOrder = "asc" | "desc";
// Source filter type for filtering by plugin source
type SourceFilter = "all" | string;

// AI Coding Agents configuration - must match Settings.tsx
const AI_AGENTS_MAP: Record<string, string> = {
  "opencode": "OpenCode",
  "claude-code": "Claude Code",
  "factory-droid": "Factory Droid",
  "cursor-sync": "Cursor",
  "cursor": "Cursor", // Alias for legacy data
  "codex-cli": "Codex CLI",
  "pi": "Pi",
  "continue": "Continue",
  "amp": "Amp",
  "aider": "Aider",
  "goose": "Goose",
  "mentat": "Mentat",
  "cline": "Cline",
  "kilo-code": "Kilo Code",
};

// Default enabled agents for backward compatibility
const DEFAULT_ENABLED_AGENTS = ["opencode", "claude-code"];

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedSessionId, setSelectedSessionId] = useState<Id<"sessions"> | null>(null);
  // Track previous session ID to prevent flash during transitions
  const [displaySessionId, setDisplaySessionId] = useState<Id<"sessions"> | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  // Cache last valid session to prevent flash during transitions
  const lastValidSessionRef = useRef<any>(null);
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

  // Get current user for enabled agents
  const currentUser = useQuery(api.users.me);
  const enabledAgents = currentUser?.enabledAgents ?? DEFAULT_ENABLED_AGENTS;

  // Read session ID from URL param (e.g., from Context search "Open in Dashboard")
  useEffect(() => {
    const sessionParam = searchParams.get("session");
    if (sessionParam) {
      setSelectedSessionId(sessionParam as Id<"sessions">);
      setViewMode("sessions");
      // Clear the URL param for cleaner URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Keyboard shortcut: Cmd/Ctrl + K to open Context search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        navigate("/context");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

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

  // Selected session details - query both current and display session for smooth transitions
  const selectedSession = useQuery(
    api.sessions.get,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );
  
  // Also fetch the display session (previous) to show during loading
  const displaySession = useQuery(
    api.sessions.get,
    displaySessionId && displaySessionId !== selectedSessionId
      ? { sessionId: displaySessionId }
      : "skip"
  );

  // Handle session transition - update display ID when new session loads
  useEffect(() => {
    if (selectedSessionId === null) {
      // Closing session panel
      setDisplaySessionId(null);
      setIsSessionLoading(false);
    } else if (selectedSessionId !== displaySessionId) {
      // Switching to a new session
      setIsSessionLoading(true);
    }
  }, [selectedSessionId, displaySessionId]);

  // When new session data arrives, update display ID, clear loading, and cache the session
  useEffect(() => {
    if (selectedSession && selectedSessionId) {
      setDisplaySessionId(selectedSessionId);
      setIsSessionLoading(false);
      // Cache the valid session to prevent flash during future transitions
      lastValidSessionRef.current = selectedSession;
    }
  }, [selectedSession, selectedSessionId]);

  // Clear cached session when closing the panel
  useEffect(() => {
    if (selectedSessionId === null) {
      lastValidSessionRef.current = null;
    }
  }, [selectedSessionId]);

  // Use the loaded session data, falling back to cached session during loading to prevent flash
  // Priority: selectedSession (current) > displaySession (previous query) > lastValidSessionRef (cached)
  // If selectedSessionId exists, always try to show content (prevents flash)
  const activeSession = selectedSessionId 
    ? (selectedSession || displaySession || lastValidSessionRef.current)
    : null;

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
      {/* Header - shrink-0 to maintain height in flex layout */}
      <header className={cn("shrink-0 h-12 border-b flex items-center px-3 sm:px-4 gap-2 sm:gap-4", t.border, t.bgPrimary)}>
        <Link to="/" className={cn("font-normal text-sm tracking-tight shrink-0", t.textSecondary)}>
          opensync
        </Link>

        {/* Source filter dropdown - hidden on small mobile */}
        <div className="hidden sm:block">
          <SourceDropdown
            value={sourceFilter}
            onChange={setSourceFilter}
            theme={theme}
            enabledAgents={enabledAgents}
          />
        </div>

        {/* View toggles - scrollable on mobile */}
        <div className={cn("flex items-center gap-1 rounded-md p-0.5 border overflow-x-auto scrollbar-hide", t.bgToggle, t.border)}>
          {(["overview", "sessions", "analytics", "evals", "wrapped"] as const).map((mode) => (
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
            to="/updates"
            className={cn("flex items-center gap-1.5 text-xs transition-colors", t.textSubtle, "hover:opacity-80")}
            title="GitHub updates"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Updates</span>
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
          {/* Updates link - mobile only (icon) */}
          <Link
            to="/updates"
            className={cn("md:hidden p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
            title="GitHub updates"
          >
            <Bell className="h-4 w-4" />
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

      {/* Main content - min-h-0 allows flex children to scroll properly */}
      <main className="flex-1 min-h-0 overflow-hidden">
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
            selectedSession={activeSession}
            isSessionLoading={isSessionLoading}
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
            modelStats={modelStats || []}
            projectStats={projectStats || []}
            providerStats={providerStats || []}
            theme={theme}
          />
        )}

        {viewMode === "evals" && (
          <EvalsView theme={theme} />
        )}

        {viewMode === "wrapped" && (
          <WrappedView />
        )}
      </main>

      {/* Footer - shrink-0 to maintain height in flex layout */}
      <footer className={cn("shrink-0 h-10 border-t flex items-center justify-between px-3 sm:px-4", t.border, t.bgPrimary)}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            
            {/* Factory Droid Plugin */}
            <div className={cn(
              "rounded-lg border p-3",
              isDark ? "bg-zinc-900/50 border-zinc-700" : "bg-white border-[#e5e0d8]"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-orange-500/15 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-orange-400">FD</span>
                </div>
                <span className={cn("text-xs font-medium", t.textSecondary)}>droid-sync</span>
              </div>
              <p className={cn("text-[11px] mb-2", t.textDim)}>
                Sync your Factory Droid sessions to the dashboard.
              </p>
              <div className={cn(
                "rounded px-2 py-1.5 text-[11px] font-mono mb-2",
                isDark ? "bg-zinc-800" : "bg-[#f5f3f0]",
                t.textMuted
              )}>
                npm install -g droid-sync
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/yemyat/droid-sync-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-[10px] transition-colors",
                    isDark ? "text-orange-400 hover:text-orange-300" : "text-[#EB5601] hover:opacity-80"
                  )}
                >
                  <Github className="h-3 w-3" />
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/droid-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-[10px] transition-colors",
                    isDark ? "text-orange-400 hover:text-orange-300" : "text-[#EB5601] hover:opacity-80"
                  )}
                >
                  <ExternalLink className="h-3 w-3" />
                  npm
                </a>
              </div>
            </div>
            
            {/* Pi Plugin */}
            <div className={cn(
              "rounded-lg border p-3",
              isDark ? "bg-zinc-900/50 border-zinc-700" : "bg-white border-[#e5e0d8]"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-[#f97316]/15 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-[#f97316]">PI</span>
                </div>
                <span className={cn("text-xs font-medium", t.textSecondary)}>pi-opensync-plugin</span>
              </div>
              <p className={cn("text-[11px] mb-2", t.textDim)}>
                Sync your Pi coding agent sessions to the dashboard.
              </p>
              <div className={cn(
                "rounded px-2 py-1.5 text-[11px] font-mono mb-2",
                isDark ? "bg-zinc-800" : "bg-[#f5f3f0]",
                t.textMuted
              )}>
                npm install -g pi-opensync-plugin
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/joshuadavidthomas/pi-opensync-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-[10px] transition-colors",
                    isDark ? "text-[#f97316] hover:text-[#fb923c]" : "text-[#EB5601] hover:opacity-80"
                  )}
                >
                  <Github className="h-3 w-3" />
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/pi-opensync-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-[10px] transition-colors",
                    isDark ? "text-[#f97316] hover:text-[#fb923c]" : "text-[#EB5601] hover:opacity-80"
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

// Sessions pagination constants
const SESSIONS_INITIAL_LOAD = 40;
const SESSIONS_LOAD_MORE = 20;

// Sessions View - Table with filters
function SessionsView({
  sessions,
  total,
  onSelectSession,
  selectedSession,
  isSessionLoading,
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
  isSessionLoading?: boolean;
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
  const isDark = theme === "dark";
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
  
  // Pagination state: initial load of 40, then load more in groups of 20
  const [displayCount, setDisplayCount] = useState(SESSIONS_INITIAL_LOAD);
  const displayedSessions = sessions.slice(0, displayCount);
  const hasMoreSessions = sessions.length > displayCount;
  
  // Eval selection mode state
  const [showEvalSelection, setShowEvalSelection] = useState(false);
  const [selectedForEval, setSelectedForEval] = useState<Set<Id<"sessions">>>(new Set());
  const [isBatchSettingEval, setIsBatchSettingEval] = useState(false);
  
  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(SESSIONS_INITIAL_LOAD);
  }, [filterModel, filterProject, filterProvider]);
  
  // Handlers for pagination
  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + SESSIONS_LOAD_MORE);
  };
  
  // Handlers for eval selection
  const handleToggleEvalSession = (sessionId: Id<"sessions">) => {
    const newSet = new Set(selectedForEval);
    if (newSet.has(sessionId)) {
      newSet.delete(sessionId);
    } else {
      newSet.add(sessionId);
    }
    setSelectedForEval(newSet);
  };
  
  const handleSelectAllForEval = () => {
    if (selectedForEval.size === displayedSessions.length) {
      setSelectedForEval(new Set());
    } else {
      setSelectedForEval(new Set(displayedSessions.map((s) => s._id)));
    }
  };
  
  const handleBatchSetEvalReady = async () => {
    if (selectedForEval.size === 0) return;
    setIsBatchSettingEval(true);
    try {
      // Set all selected sessions as eval-ready
      await Promise.all(
        Array.from(selectedForEval).map((sessionId) =>
          setEvalReady({ sessionId, evalReady: true })
        )
      );
      setSelectedForEval(new Set());
      setShowEvalSelection(false);
    } finally {
      setIsBatchSettingEval(false);
    }
  };
  
  const handleCancelEvalSelection = () => {
    setShowEvalSelection(false);
    setSelectedForEval(new Set());
  };

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
    <div className="h-full flex flex-col lg:flex-row relative">
      {/* Sessions list - hidden on mobile when session selected, h-full and min-h-0 for scroll */}
      <div className={cn(
        "h-full min-h-0 flex flex-col border-r",
        t.border,
        selectedSession ? "hidden lg:flex lg:w-1/2" : "w-full"
      )}>
        {/* Filters bar - shrink-0 to prevent shrinking in flex */}
        <div className={cn("shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center gap-2 sm:gap-3 flex-wrap", t.border)}>
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

          {/* Eval selection mode actions */}
          {showEvalSelection && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSelectAllForEval}
                className={cn(
                  "px-2 py-1 text-[10px] rounded border transition-colors",
                  isDark
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-[#e6e4e1] text-[#6b6b6b] hover:bg-[#ebe9e6]"
                )}
              >
                {selectedForEval.size === displayedSessions.length ? "None" : "All"}
              </button>
              <button
                onClick={handleBatchSetEvalReady}
                disabled={selectedForEval.size === 0 || isBatchSettingEval}
                className={cn(
                  "px-2 py-1 text-[10px] rounded font-medium transition-colors",
                  selectedForEval.size === 0 || isBatchSettingEval ? "opacity-50 cursor-not-allowed" : "",
                  isDark
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-[#EB5601] text-white hover:bg-[#d14a01]"
                )}
              >
                {isBatchSettingEval ? "..." : `Mark (${selectedForEval.size})`}
              </button>
              <button
                onClick={handleCancelEvalSelection}
                className={cn("p-1 rounded transition-colors", t.textSubtle, t.bgHover)}
                title="Cancel selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

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
            {/* Eval selection toggle */}
            <button
              onClick={() => {
                if (showEvalSelection) {
                  handleCancelEvalSelection();
                } else {
                  setShowEvalSelection(true);
                }
              }}
              className={cn(
                "p-1 rounded transition-colors",
                showEvalSelection
                  ? cn(isDark ? "bg-emerald-600/20 text-emerald-400" : "bg-[#EB5601]/20 text-[#EB5601]")
                  : cn(t.textSubtle, "hover:opacity-80")
              )}
              title={showEvalSelection ? "Cancel eval selection" : "Select sessions for evals"}
            >
              <CheckSquare className="h-3.5 w-3.5" />
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

          <span className={cn("text-xs shrink-0", t.textDim)}>{displayedSessions.length}<span className="hidden sm:inline"> of {total}</span></span>
        </div>

        {/* Filter dropdowns - shrink-0 to prevent shrinking */}
        {showFilters && (
          <div className={cn("shrink-0 px-4 py-3 border-b flex items-center gap-4", t.border, t.bgSecondary)}>
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
            {/* Sort header - simplified on mobile, shrink-0 */}
            <div className={cn("shrink-0 hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b text-[10px] uppercase tracking-wider", t.borderLight, t.textDim)}>
              <div className="col-span-5">Title</div>
              <SortHeader label="Tokens" field="totalTokens" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2" alignRight theme={theme} />
              <SortHeader label="Cost" field="cost" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2" alignRight theme={theme} />
              <SortHeader label="Duration" field="durationMs" current={sortField} order={sortOrder} onChange={onSortChange} className="col-span-2" alignRight theme={theme} />
              <div className="col-span-1" />
            </div>
            {/* Mobile sort header - shrink-0 */}
            <div className={cn("shrink-0 sm:hidden flex items-center justify-between px-3 py-2 border-b text-[10px] uppercase tracking-wider", t.borderLight, t.textDim)}>
              <span>Sessions</span>
              <SortHeader label="Tokens" field="totalTokens" current={sortField} order={sortOrder} onChange={onSortChange} theme={theme} />
            </div>

            {/* Sessions list with drag scroll - min-h-0 and touch-action for mobile */}
            <div 
              ref={scrollContainerRef}
              className={cn(
                "flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-hide cursor-grab touch-pan-y",
                isDragging && "cursor-grabbing select-none"
              )}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              {displayedSessions.map((session) => (
                <SessionTableRow
                  key={session._id}
                  session={session}
                  isSelected={selectedSession?.session?._id === session._id}
                  onClick={() => onSelectSession(session._id)}
                  theme={theme}
                  showCheckbox={showEvalSelection}
                  isChecked={selectedForEval.has(session._id)}
                  onCheckChange={() => handleToggleEvalSession(session._id)}
                />
              ))}
              {displayedSessions.length === 0 && (
                <div className={cn("px-4 py-12 text-center text-sm", t.textDim)}>
                  No sessions found
                </div>
              )}
              
              {/* Load More button */}
              {hasMoreSessions && (
                <div className={cn("px-4 py-3 border-t", t.border)}>
                  <button
                    onClick={handleLoadMore}
                    className={cn(
                      "w-full py-2 text-xs font-medium rounded transition-colors",
                      isDark
                        ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        : "bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e0deda]"
                    )}
                  >
                    Load more ({sessions.length - displayCount} remaining)
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Timeline View */}
        {sessionsViewMode === "timeline" && (
          <TimelineView
            sessions={displayedSessions}
            selectedSessionId={selectedSession?.session?._id}
            onSelectSession={onSelectSession}
            theme={theme}
            hasMore={hasMoreSessions}
            onLoadMore={handleLoadMore}
            remainingCount={sessions.length - displayCount}
          />
        )}
      </div>

      {/* Session detail - full width on mobile, uses absolute positioning on mobile for proper scrolling */}
      {selectedSession && (
        <div className={cn("absolute inset-0 lg:relative lg:inset-auto h-full min-h-0 w-full lg:w-1/2 flex flex-col overflow-hidden z-10 lg:z-auto", t.bgPrimary)}>
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
                    const label = getSourceLabel(detailSource);
                    const colorClass = getSourceColorClass(detailSource, { themed: false });
                    return (
                      <span className={cn("shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide", colorClass)}>
                        {label}
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

          {/* Messages - flex-1 with min-h-0 for proper overflow scroll, touch-action for mobile */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 relative overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Subtle loading indicator in corner during session transition - no overlay to prevent flash */}
            {isSessionLoading && (
              <div className="absolute top-2 right-2 z-10">
                <Loader2 className={cn("h-4 w-4 animate-spin", t.textMuted)} />
              </div>
            )}
            {selectedSession?.messages?.map((msg: any) => (
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
  hasMore = false,
  onLoadMore,
  remainingCount = 0,
}: {
  sessions: any[];
  selectedSessionId?: Id<"sessions">;
  onSelectSession: (id: Id<"sessions"> | null) => void;
  theme: "dark" | "tan";
  hasMore?: boolean;
  onLoadMore?: () => void;
  remainingCount?: number;
}) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";
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

      {/* Footer with legend and load more */}
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
        
        <div className="flex-1" />
        
        {/* Load More button */}
        {hasMore && onLoadMore && (
          <button
            onClick={onLoadMore}
            className={cn(
              "px-3 py-1 text-[10px] font-medium rounded transition-colors",
              isDark
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                : "bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e0deda]"
            )}
          >
            Load more ({remainingCount})
          </button>
        )}
      </div>
    </div>
  );
}

// Export format type for evals
type ExportFormat = "deepeval" | "openai" | "filesystem";
const EVALS_ITEMS_PER_PAGE = 50;

// Evals View - Evaluation sessions and export (compact CRM-style)
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
  const [displayCount, setDisplayCount] = useState(EVALS_ITEMS_PER_PAGE);
  const setEvalReady = useMutation(api.evals.setEvalReady);

  // Queries
  const evalData = useQuery(api.evals.listEvalSessions, {
    source: sourceFilter,
    tags: tagFilter ? [tagFilter] : undefined,
  });
  const allTags = useQuery(api.evals.getEvalTags);
  const generateExport = useAction(api.evals.generateEvalExport);

  // Computed
  const allSessions = evalData?.sessions || [];
  const sessions = allSessions.slice(0, displayCount);
  const hasMore = allSessions.length > displayCount;
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

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + EVALS_ITEMS_PER_PAGE);
  };

  const handleExport = async () => {
    if (allSessions.length === 0) return;
    
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
    setDisplayCount(EVALS_ITEMS_PER_PAGE);
  };

  // Source badge inline component (compact)
  const SourceBadge = ({ source }: { source?: string }) => (
    <span className={cn("inline-flex items-center px-1 py-0.5 text-[9px] font-medium rounded", getSourceColorClass(source, { theme }))}>
      {getSourceLabel(source, true)}
    </span>
  );

  return (
    <div className="h-full overflow-auto p-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`.evals-scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      <div className="max-w-5xl mx-auto space-y-3 evals-scrollbar-hide">
        {/* Compact stats row */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Sessions" value={stats.total} theme={theme} />
          <StatCard label="Tests" value={stats.totalTestCases} theme={theme} />
          <StatCard label="OC" value={stats.bySource.opencode} theme={theme} />
          <StatCard label="CC" value={stats.bySource.claudeCode} theme={theme} />
        </div>

        {/* Compact filters bar */}
        <div className={cn("flex flex-wrap items-center gap-1.5 p-2 rounded-lg border", t.bgCard, t.border)}>
          {/* Source filter */}
          <CompactDropdown
            value={sourceFilter}
            onChange={(v) => setSourceFilter(v as string | undefined)}
            options={[
              { value: "opencode", label: "OpenCode" },
              { value: "claude-code", label: "Claude Code" },
            ]}
            placeholder="Source"
            theme={theme}
            size="xs"
          />

          {/* Tag filter */}
          {allTags && allTags.length > 0 && (
            <CompactDropdown
              value={tagFilter}
              onChange={(v) => setTagFilter(v as string | undefined)}
              options={allTags.map((tag) => ({ value: tag, label: tag }))}
              placeholder="Tags"
              theme={theme}
              size="xs"
            />
          )}

          {hasActiveFilters && (
            <button onClick={clearFilters} className={cn("text-[10px] flex items-center gap-0.5", t.textSubtle, "hover:opacity-80")}>
              <X className="h-2.5 w-2.5" />
            </button>
          )}

          <div className="flex-1" />

          {/* Select all */}
          {sessions.length > 0 && (
            <button onClick={handleSelectAll} className={cn("text-[10px] px-1.5 py-1 rounded border", t.border, t.textSubtle, t.bgHover)}>
              {selectedSessions.size === sessions.length ? "None" : "All"}
            </button>
          )}

          {/* Export button */}
          <button
            onClick={() => setShowExportModal(true)}
            disabled={allSessions.length === 0}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-[10px] rounded font-medium transition-colors",
              allSessions.length === 0 ? "opacity-50 cursor-not-allowed" : "",
              isDark ? "bg-zinc-100 text-zinc-900 hover:bg-white" : "bg-[#1a1a1a] text-white hover:bg-[#333]"
            )}
          >
            <FileDown className="h-3 w-3" />
            Export{selectedSessions.size > 0 && ` (${selectedSessions.size})`}
          </button>
        </div>

        {/* Sessions list - CRM style */}
        {sessions.length === 0 ? (
          <div className={cn("text-center py-12 rounded-lg border", t.bgCard, t.border)}>
            <CheckCircle2 className={cn("h-10 w-10 mx-auto mb-3", t.textDim)} />
            <h3 className={cn("text-xs font-medium mb-1", t.textPrimary)}>No Eval-Ready Sessions</h3>
            <p className={cn("text-[10px]", t.textMuted)}>
              Mark sessions as eval-ready from Sessions view
            </p>
          </div>
        ) : (
          <div className={cn("rounded-lg border overflow-hidden", t.border)}>
            {/* Header row */}
            <div className={cn("flex items-center px-3 py-2 text-xs font-medium border-b gap-3", t.bgSecondary, t.border, t.textMuted)}>
              <div className="w-5 shrink-0"></div>
              <div className="flex-1 min-w-0">Session</div>
              <div className="w-10 text-center shrink-0">Src</div>
              <div className="w-44 shrink-0 hidden sm:block">Model</div>
              <div className="w-10 text-center shrink-0">Msgs</div>
              <div className="w-12 text-right shrink-0">Rev</div>
              <div className="w-6 shrink-0"></div>
            </div>

            {/* Rows */}
            {sessions.map((session) => (
              <div
                key={session._id}
                className={cn(
                  "flex items-center px-3 py-2 text-xs border-b last:border-b-0 gap-3 transition-colors",
                  t.border,
                  selectedSessions.has(session._id) ? (isDark ? "bg-zinc-800/50" : "bg-[#f5f3f0]") : "hover:bg-opacity-50"
                )}
              >
                <div className="w-5 shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedSessions.has(session._id)}
                    onChange={() => handleToggleSession(session._id)}
                    className="rounded h-3.5 w-3.5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn("font-medium truncate block", t.textPrimary)} title={session.title || session.externalId}>
                    {session.title ? (session.title.length > 40 ? session.title.slice(0, 40) + "..." : session.title) : session.externalId.slice(0, 8)}
                  </span>
                </div>
                <div className="w-10 shrink-0 flex justify-center">
                  <SourceBadge source={session.source} />
                </div>
                <div className={cn("w-44 shrink-0 truncate hidden sm:block", t.textMuted)} title={session.model || "unknown"}>
                  {session.model ? (session.model.length > 28 ? session.model.slice(0, 28) + "..." : session.model) : "-"}
                </div>
                <div className={cn("w-10 text-center shrink-0", t.textMuted)}>
                  {session.messageCount}
                </div>
                <div className={cn("w-12 text-right shrink-0", t.textMuted)}>
                  {session.reviewedAt ? new Date(session.reviewedAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }) : "-"}
                </div>
                <div className="w-6 shrink-0">
                  <button
                    onClick={async () => {
                      await setEvalReady({ sessionId: session._id, evalReady: false });
                    }}
                    className="p-0.5 rounded hover:bg-red-500/20 text-red-400"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className={cn("px-2 py-2 border-t", t.border)}>
                <button
                  onClick={handleLoadMore}
                  className={cn(
                    "w-full py-1.5 text-[10px] font-medium rounded transition-colors",
                    isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e0deda]"
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
          <div className={cn("text-[10px] text-center", t.textMuted)}>
            {sessions.length} of {allSessions.length}
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
              <CompactDropdown
                value={minSessions}
                onChange={(v) => setMinSessions(v as number | undefined)}
                options={[
                  { value: 2, label: "2+" },
                  { value: 5, label: "5+" },
                  { value: 10, label: "10+" },
                ]}
                placeholder="All"
                theme={theme}
                size="sm"
              />
            </div>
            
            {/* Min tokens filter - hidden on mobile */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className={cn("text-[10px]", t.textDim)}>Tokens:</span>
              <CompactDropdown
                value={minTokens}
                onChange={(v) => setMinTokens(v as number | undefined)}
                options={[
                  { value: 1000, label: "1K+" },
                  { value: 10000, label: "10K+" },
                  { value: 50000, label: "50K+" },
                ]}
                placeholder="All"
                theme={theme}
                size="sm"
              />
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

function SessionTableRow({ 
  session, 
  isSelected, 
  onClick, 
  theme, 
  showCheckbox = false,
  isChecked = false,
  onCheckChange,
}: { 
  session: any; 
  isSelected: boolean; 
  onClick: () => void; 
  theme: "dark" | "tan";
  showCheckbox?: boolean;
  isChecked?: boolean;
  onCheckChange?: () => void;
}) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";
  const source = session.source || "opencode";
  const badgeLabel = getSourceLabel(source, true);
  const badgeColor = getSourceColorClass(source, { themed: false });
  
  // Handle checkbox click without triggering row selection
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheckChange?.();
  };
  
  return (
    <>
      {/* Desktop row */}
      <div
        className={cn(
          "hidden sm:grid w-full grid-cols-12 gap-2 px-4 py-2.5 transition-colors text-left items-center",
          t.bgHover,
          isSelected && t.bgActive
        )}
      >
        {/* Checkbox column when in selection mode */}
        {showCheckbox && (
          <div className="col-span-1 flex items-center">
            <button
              onClick={handleCheckboxClick}
              className={cn(
                "p-0.5 rounded transition-colors",
                isChecked 
                  ? isDark ? "text-emerald-400" : "text-[#EB5601]"
                  : t.textSubtle
              )}
            >
              {isChecked ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
        <button
          onClick={onClick}
          className={cn(
            "flex items-center gap-2 min-w-0 text-left",
            showCheckbox ? "col-span-4" : "col-span-5"
          )}
        >
          <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", t.iconMuted)} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={cn("text-sm truncate", t.textSecondary)}>{session.title || "Untitled"}</p>
              {/* Source badge - shows CC for Claude Code, FD for Factory Droid, OC for OpenCode */}
              <span className={cn("shrink-0 px-1 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide", badgeColor)}>
                {badgeLabel}
              </span>
            </div>
            <p className={cn("text-[10px] truncate", t.textDim)}>
              {session.model || "unknown"} · {getTimeAgo(session.updatedAt)}
            </p>
          </div>
        </button>
        <button onClick={onClick} className="col-span-2 text-right">
          <span className={cn("text-sm", t.textMuted)}>{formatNumber(session.totalTokens)}</span>
        </button>
        <button onClick={onClick} className="col-span-2 text-right">
          <span className={cn("text-sm", t.textSubtle)}>${session.cost.toFixed(4)}</span>
        </button>
        <button onClick={onClick} className="col-span-2 text-right">
          <span className={cn("text-sm", t.textDim)}>{formatDuration(session.durationMs)}</span>
        </button>
        <button onClick={onClick} className="col-span-1 flex justify-end">
          {session.isPublic && <Globe className="h-3 w-3 text-emerald-500" />}
        </button>
      </div>
      
      {/* Mobile row */}
      <div
        className={cn(
          "sm:hidden w-full px-3 py-3 transition-colors text-left",
          t.bgHover,
          isSelected && t.bgActive
        )}
      >
        <div className="flex items-start gap-2">
          {/* Checkbox for mobile when in selection mode */}
          {showCheckbox && (
            <button
              onClick={handleCheckboxClick}
              className={cn(
                "shrink-0 p-0.5 rounded transition-colors mt-0.5",
                isChecked 
                  ? isDark ? "text-emerald-400" : "text-[#EB5601]"
                  : t.textSubtle
              )}
            >
              {isChecked ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          )}
          <button onClick={onClick} className="flex-1 min-w-0 text-left">
            <div className="flex items-start gap-2">
              {!showCheckbox && <MessageSquare className={cn("h-4 w-4 shrink-0 mt-0.5", t.iconMuted)} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={cn("text-sm truncate", t.textSecondary)}>{session.title || "Untitled"}</p>
                  <span className={cn("shrink-0 px-1 py-0.5 rounded text-[9px] font-medium uppercase", badgeColor)}>
                    {badgeLabel}
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
        </div>
      </div>
    </>
  );
}

// Helper to extract text content from various plugin formats
// Claude Code stores content as { text: "..." }, OpenCode may use strings or { content: "..." }
function getPartTextContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content.text || content.content || "";
}

// Helper to extract tool name from various plugin formats
function getToolName(content: any): string {
  if (!content) return "Unknown Tool";
  return content.name || content.toolName || "Unknown Tool";
}

function MessageBubble({ message, theme }: { message: any; theme: "dark" | "tan" }) {
  const t = getThemeClasses(theme);
  const isUser = message.role === "user";

  // Check if parts have any displayable content (text, tool-call, or tool-result with actual data)
  const hasDisplayableParts = message.parts?.some((part: any) => {
    if (part.type === "text") {
      const text = getPartTextContent(part.content);
      return text && text.trim().length > 0;
    }
    if (part.type === "tool-call") {
      // Check if tool-call has extractable name
      return part.content && (part.content.name || part.content.toolName);
    }
    if (part.type === "tool-result") {
      // Check if tool-result has extractable result
      const result = part.content?.result || part.content?.output || part.content;
      return result !== null && result !== undefined;
    }
    return false;
  });

  // Use textContent fallback if no parts have displayable content
  const showFallback = !hasDisplayableParts && message.textContent;

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
          {showFallback ? (
            <p className="whitespace-pre-wrap">{message.textContent}</p>
          ) : (
            message.parts?.map((part: any, i: number) => {
              if (part.type === "text") {
                const textContent = getPartTextContent(part.content);
                if (!textContent) return null;
                return <p key={i} className="whitespace-pre-wrap">{textContent}</p>;
              }
              if (part.type === "tool-call") {
                return (
                  <div key={i} className={cn("mt-2 p-2 rounded text-xs font-mono", t.bgCode)}>
                    <span className={t.textSubtle}>tool:</span> {getToolName(part.content)}
                  </div>
                );
              }
              if (part.type === "tool-result") {
                const result = part.content?.result || part.content?.output || part.content;
                const resultStr = typeof result === "string" ? result : JSON.stringify(result, null, 2);
                return (
                  <div key={i} className={cn("mt-2 p-2 rounded text-xs font-mono", t.bgCode, "text-green-400")}>
                    <pre className="whitespace-pre-wrap overflow-x-auto">{resultStr}</pre>
                  </div>
                );
              }
              return null;
            })
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
  const isDark = theme === "dark";
  const t = getThemeClasses(theme);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const displayValue = value || "All";
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-xs", t.textSubtle)}>{label}</span>
      <div ref={dropdownRef} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors min-w-[80px] justify-between",
            isDark
              ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300"
              : "bg-[#f5f3f0] border-[#e6e4e1] hover:border-[#c9c5bf] text-[#6b6b6b]"
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", isOpen && "rotate-180")} />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className={cn(
              "absolute top-full left-0 mt-1 min-w-full max-h-[200px] overflow-y-auto rounded-md border shadow-lg z-50 py-1",
              isDark
                ? "bg-[#161616] border-zinc-800"
                : "bg-[#faf8f5] border-[#e6e4e1]"
            )}
          >
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left text-xs transition-colors",
                !value
                  ? isDark
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-[#ebe9e6] text-[#1a1a1a]"
                  : isDark
                    ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    : "text-[#6b6b6b] hover:bg-[#ebe9e6]/50 hover:text-[#1a1a1a]"
              )}
            >
              All
            </button>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-xs transition-colors truncate",
                  opt === value
                    ? isDark
                      ? "bg-zinc-800 text-zinc-100"
                      : "bg-[#ebe9e6] text-[#1a1a1a]"
                    : isDark
                      ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                      : "text-[#6b6b6b] hover:bg-[#ebe9e6]/50 hover:text-[#1a1a1a]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact dropdown for small filter areas (Evals, Analytics)
function CompactDropdown({
  value,
  onChange,
  options,
  placeholder = "All",
  theme,
  size = "sm",
}: {
  value?: string | number;
  onChange: (v?: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  theme: "dark" | "tan";
  size?: "xs" | "sm";
}) {
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const displayValue = options.find((opt) => opt.value === value)?.label || placeholder;
  const isXs = size === "xs";
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 rounded border transition-colors justify-between",
          isXs ? "px-1.5 py-1 text-[10px] min-w-[60px]" : "px-2 py-1 text-xs min-w-[70px] h-7",
          isDark
            ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300"
            : "bg-[#f5f3f0] border-[#e6e4e1] hover:border-[#c9c5bf] text-[#6b6b6b]"
        )}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={cn("shrink-0 transition-transform", isXs ? "h-2.5 w-2.5" : "h-3 w-3", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 min-w-full max-h-[180px] overflow-y-auto rounded-md border shadow-lg z-50 py-0.5",
            isDark
              ? "bg-[#161616] border-zinc-800"
              : "bg-[#faf8f5] border-[#e6e4e1]"
          )}
        >
          {/* All/placeholder option */}
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setIsOpen(false);
            }}
            className={cn(
              "w-full px-2 py-1 text-left transition-colors",
              isXs ? "text-[10px]" : "text-xs",
              !value
                ? isDark
                  ? "bg-zinc-800 text-zinc-100"
                  : "bg-[#ebe9e6] text-[#1a1a1a]"
                : isDark
                  ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  : "text-[#6b6b6b] hover:bg-[#ebe9e6]/50 hover:text-[#1a1a1a]"
            )}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-2 py-1 text-left transition-colors truncate",
                isXs ? "text-[10px]" : "text-xs",
                opt.value === value
                  ? isDark
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-[#ebe9e6] text-[#1a1a1a]"
                  : isDark
                    ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    : "text-[#6b6b6b] hover:bg-[#ebe9e6]/50 hover:text-[#1a1a1a]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Source dropdown for filtering by plugin source (filters by user's enabled agents)
function SourceDropdown({
  value,
  onChange,
  theme,
  enabledAgents,
}: {
  value: SourceFilter;
  onChange: (v: SourceFilter) => void;
  theme: "dark" | "tan";
  enabledAgents: string[];
}) {
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Build options from enabled agents only
  const options: Array<{ value: SourceFilter; label: string }> = [
    { value: "all", label: "All Sources" },
    ...enabledAgents.map((agentId) => ({
      value: agentId,
      label: AI_AGENTS_MAP[agentId] || agentId,
    })),
  ];

  // Reset to "all" if current value is no longer in enabled agents
  const safeValue = value === "all" || enabledAgents.includes(value) ? value : "all";
  const selectedOption = options.find((opt) => opt.value === safeValue) || options[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-colors",
          isDark
            ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300"
            : "bg-[#f5f3f0] border-[#e6e4e1] hover:border-[#c9c5bf] text-[#6b6b6b]"
        )}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 min-w-[140px] rounded-md border shadow-lg z-50 py-1 animate-fade-in",
            isDark
              ? "bg-[#161616] border-zinc-800"
              : "bg-[#faf8f5] border-[#e6e4e1]"
          )}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left text-xs transition-colors",
                opt.value === safeValue
                  ? isDark
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-[#ebe9e6] text-[#1a1a1a]"
                  : isDark
                    ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    : "text-[#6b6b6b] hover:bg-[#ebe9e6]/50 hover:text-[#1a1a1a]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
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
