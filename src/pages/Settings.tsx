import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";
import { AreaChart, BarChart, ProgressBar, DonutChart } from "../components/Charts";
import { ConfirmModal } from "../components/ConfirmModal";
import {
  ArrowLeft,
  Key,
  Copy,
  Check,
  Trash2,
  BarChart3,
  Clock,
  Coins,
  MessageSquare,
  Cpu,
  Terminal,
  Eye,
  EyeOff,
  ExternalLink,
  User,
  LogOut,
  TrendingUp,
  Folder,
  Bot,
  Zap,
  Sun,
  Moon,
} from "lucide-react";

// Convex URL from environment
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;

// Colors for charts
const MODEL_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const TAN_MODEL_COLORS = ["#EB5601", "#8b7355", "#d14a01", "#6b6b6b", "#a67c52", "#4a4a4a"];

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"usage" | "api" | "profile">("api");
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const currentUser = useQuery(api.users.me);
  const stats = useQuery(api.users.stats);
  const dailyStats = useQuery(api.analytics.dailyStats, { days: 30 });
  const modelStats = useQuery(api.analytics.modelStats);
  const projectStats = useQuery(api.analytics.projectStats);

  const generateApiKey = useMutation(api.users.generateApiKey);
  const revokeApiKey = useMutation(api.users.revokeApiKey);

  const handleGenerateKey = async () => {
    const key = await generateApiKey();
    setNewApiKey(key);
    setShowApiKey(true);
  };

  const handleRevokeKey = () => {
    setShowRevokeModal(true);
  };

  const confirmRevokeKey = async () => {
    await revokeApiKey();
    setNewApiKey(null);
    setShowApiKey(false);
  };

  const handleCopyKey = async () => {
    if (newApiKey) {
      await navigator.clipboard.writeText(newApiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    if (CONVEX_URL) {
      await navigator.clipboard.writeText(CONVEX_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className={cn("min-h-screen", t.bgPrimary)}>
      {/* Header */}
      <header className={cn("border-b sticky top-0 z-10", t.border, t.bgPrimary)}>
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center gap-4">
          <Link
            to="/"
            className={cn("flex items-center gap-2 transition-colors", t.textSubtle, t.bgHover)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <span className={cn("text-sm font-normal", t.textSecondary)}>Settings</span>
          <div className="flex-1" />
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
            title={theme === "dark" ? "Switch to tan mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className={cn("flex items-center gap-1 mb-8 border-b pb-4", t.border)}>
          {(["usage", "api", "profile"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm rounded-md transition-colors capitalize",
                activeTab === tab
                  ? cn(t.bgToggleActive, t.textPrimary)
                  : cn(t.textSubtle, t.bgHover)
              )}
            >
              {tab === "api" ? "API Access" : tab}
            </button>
          ))}
        </div>

        {/* Usage Tab */}
        {activeTab === "usage" && (
          <div className="space-y-8">
            {/* Summary stats */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4 flex items-center gap-2", t.textMuted)}>
                <BarChart3 className="h-4 w-4" />
                Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Sessions"
                  value={stats?.sessionCount.toLocaleString() || "0"}
                  theme={theme}
                />
                <StatCard
                  icon={<Cpu className="h-4 w-4" />}
                  label="Total Tokens"
                  value={formatNumber(stats?.totalTokens || 0)}
                  theme={theme}
                />
                <StatCard
                  icon={<Coins className="h-4 w-4" />}
                  label="Total Cost"
                  value={`$${(stats?.totalCost || 0).toFixed(2)}`}
                  theme={theme}
                />
                <StatCard
                  icon={<Clock className="h-4 w-4" />}
                  label="Total Time"
                  value={formatDuration(stats?.totalDurationMs || 0)}
                  theme={theme}
                />
              </div>
            </section>

            {/* Usage chart */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4 flex items-center gap-2", t.textMuted)}>
                <TrendingUp className="h-4 w-4" />
                Token Usage (30 days)
              </h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <div className="h-48">
                  <AreaChart
                    data={(dailyStats || []).map((d) => ({
                      label: d.date,
                      value: d.totalTokens,
                    }))}
                    height={192}
                    color={theme === "dark" ? "#3b82f6" : "#EB5601"}
                  />
                </div>
                <div className={cn("flex justify-between mt-2 text-[10px]", t.textDim)}>
                  <span>{dailyStats?.[0]?.date || ""}</span>
                  <span>{dailyStats?.[dailyStats.length - 1]?.date || ""}</span>
                </div>
              </div>
            </section>

            {/* Daily breakdown */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4", t.textMuted)}>Daily Activity</h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <div className="h-32">
                  <BarChart
                    data={(dailyStats || []).slice(-14).map((d) => ({
                      label: new Date(d.date).toLocaleDateString("en", { weekday: "short" }),
                      value: d.sessions,
                      color: theme === "dark" ? "bg-emerald-600" : "bg-[#EB5601]",
                    }))}
                    height={128}
                    formatValue={(v) => `${v} sessions`}
                  />
                </div>
              </div>
            </section>

            {/* Model usage */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4 flex items-center gap-2", t.textMuted)}>
                <Bot className="h-4 w-4" />
                Usage by Model
              </h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Donut chart */}
                  <div className="flex justify-center">
                    <DonutChart
                      size={140}
                      thickness={14}
                      data={(modelStats || []).slice(0, 5).map((m, i) => ({
                        label: m.model,
                        value: m.totalTokens,
                        color: theme === "dark" ? MODEL_COLORS[i % MODEL_COLORS.length] : TAN_MODEL_COLORS[i % TAN_MODEL_COLORS.length],
                      }))}
                    />
                  </div>
                  {/* Model list */}
                  <div className="flex-1 space-y-3">
                    {(modelStats || []).map((m, i) => (
                      <div key={m.model} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={cn("flex items-center gap-2 text-sm", t.textSecondary)}>
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: theme === "dark" ? MODEL_COLORS[i % MODEL_COLORS.length] : TAN_MODEL_COLORS[i % TAN_MODEL_COLORS.length] }}
                            />
                            <span className="truncate max-w-[200px]">{m.model}</span>
                          </span>
                          <span className={cn("text-sm", t.textDim)}>{formatNumber(m.totalTokens)}</span>
                        </div>
                        <ProgressBar
                          value={m.totalTokens}
                          max={modelStats?.[0]?.totalTokens || 1}
                          showPercentage={false}
                          color={theme === "dark" ? `bg-[${MODEL_COLORS[i % MODEL_COLORS.length]}]` : `bg-[${TAN_MODEL_COLORS[i % TAN_MODEL_COLORS.length]}]`}
                        />
                        <div className={cn("flex justify-between text-[10px]", t.textDim)}>
                          <span>{m.sessions} sessions</span>
                          <span>${m.cost.toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                    {(!modelStats || modelStats.length === 0) && (
                      <p className={cn("text-sm text-center py-4", t.textDim)}>No model data yet</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Projects */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4 flex items-center gap-2", t.textMuted)}>
                <Folder className="h-4 w-4" />
                Usage by Project
              </h2>
              <div className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}>
                <table className="w-full">
                  <thead>
                    <tr className={cn("border-b text-[10px] uppercase tracking-wider", t.borderLight, t.textDim)}>
                      <th className="px-4 py-2 text-left font-normal">Project</th>
                      <th className="px-4 py-2 text-right font-normal">Sessions</th>
                      <th className="px-4 py-2 text-right font-normal">Tokens</th>
                      <th className="px-4 py-2 text-right font-normal">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projectStats || []).slice(0, 10).map((p) => (
                      <tr key={p.project} className={cn("border-b", t.borderLight)}>
                        <td className={cn("px-4 py-2.5 text-sm truncate max-w-[300px]", t.textSecondary)}>{p.project}</td>
                        <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>{p.sessions}</td>
                        <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>{formatNumber(p.totalTokens)}</td>
                        <td className={cn("px-4 py-2.5 text-sm text-right", t.textSubtle)}>${p.cost.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!projectStats || projectStats.length === 0) && (
                  <div className={cn("px-4 py-8 text-center text-sm", t.textDim)}>No project data yet</div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* API Tab */}
        {activeTab === "api" && (
          <div className="space-y-8">
            {/* Plugin Setup */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4 flex items-center gap-2", t.textMuted)}>
                <Terminal className="h-4 w-4" />
                Plugin Setup
              </h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <p className={cn("text-sm mb-4", t.textSubtle)}>
                  Configure the{" "}
                  <a
                    href="https://www.npmjs.com/package/opencode-sync-plugin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("inline-flex items-center gap-1", theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-[#EB5601] hover:text-[#d14a01]")}
                  >
                    opencode-sync-plugin
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>

                {/* Convex URL */}
                <div className="space-y-4">
                  <div>
                    <label className={cn("text-xs mb-1.5 block", t.textSubtle)}>Convex URL</label>
                    <div className="flex items-center gap-2">
                      <code className={cn("flex-1 text-sm font-mono px-3 py-2 rounded border overflow-x-auto", t.bgCode, t.border, t.textSecondary)}>
                        {CONVEX_URL || "Not configured"}
                      </code>
                      <button
                        onClick={handleCopyUrl}
                        className={cn("p-2 rounded border transition-colors", t.border, t.textSubtle, t.bgHover)}
                        title="Copy"
                      >
                        {copiedUrl ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* API Key Status */}
                  <div>
                    <label className={cn("text-xs mb-1.5 block", t.textSubtle)}>API Key</label>
                    {currentUser?.hasApiKey || newApiKey ? (
                      <div className="flex items-center gap-2">
                        <code className={cn("flex-1 text-sm font-mono px-3 py-2 rounded border", t.bgCode, t.border, t.textSecondary)}>
                          {newApiKey && showApiKey ? newApiKey : "osk_••••••••••••••••"}
                        </code>
                        {newApiKey && (
                          <>
                            <button
                              onClick={() => setShowApiKey(!showApiKey)}
                              className={cn("p-2 rounded border transition-colors", t.border, t.textSubtle, t.bgHover)}
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={handleCopyKey}
                              className={cn("p-2 rounded border transition-colors", t.border, t.textSubtle, t.bgHover)}
                            >
                              {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className={cn("text-sm", t.textDim)}>No API key generated</p>
                    )}
                  </div>
                </div>

                {/* Quick Setup */}
                <div className={cn("mt-4 p-3 rounded border", t.bgSecondary, t.borderLight)}>
                  <p className={cn("text-xs font-normal mb-2", t.textMuted)}>Quick setup</p>
                  <div className={cn("space-y-1 text-xs font-mono", t.textSubtle)}>
                    <p>npm install -g opencode-sync-plugin</p>
                    <p>opencode-sync login</p>
                    <p className={t.textDim}># Paste credentials when prompted</p>
                  </div>
                </div>
              </div>
            </section>

            {/* API Key Management */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4 flex items-center gap-2", t.textMuted)}>
                <Key className="h-4 w-4" />
                API Key Management
              </h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <p className={cn("text-sm mb-4", t.textSubtle)}>
                  Generate an API key to access your sessions from external applications.
                </p>

                {currentUser?.hasApiKey || newApiKey ? (
                  <div className="space-y-3">
                    {newApiKey && showApiKey && (
                      <div className={cn("p-3 rounded border", t.bgSecondary, t.borderLight)}>
                        <p className={cn("text-xs mb-2", t.textSubtle)}>
                          Copy this key now. You won't see it again.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className={cn("flex-1 text-sm font-mono px-2 py-1 rounded overflow-x-auto", t.bgCode, t.textSecondary)}>
                            {newApiKey}
                          </code>
                          <button
                            onClick={handleCopyKey}
                            className={cn("p-2 rounded transition-colors", t.textSubtle, t.bgHover)}
                          >
                            {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-emerald-500">API key active</span>
                      <button
                        onClick={handleRevokeKey}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md text-red-400/80 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revoke
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateKey}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm",
                      theme === "dark" ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700" : "bg-[#EB5601] text-white hover:bg-[#d14a01]"
                    )}
                  >
                    <Key className="h-4 w-4" />
                    Generate API Key
                  </button>
                )}
              </div>
            </section>

            {/* API Endpoints */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4 flex items-center gap-2", t.textMuted)}>
                <Zap className="h-4 w-4" />
                API Endpoints
              </h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <div className="space-y-2 text-sm font-mono">
                  <EndpointRow method="GET" path="/api/sessions" theme={theme} />
                  <EndpointRow method="GET" path="/api/search?q=query" theme={theme} />
                  <EndpointRow method="GET" path="/api/context?q=query" theme={theme} />
                  <EndpointRow method="GET" path="/api/export?id=sessionId" theme={theme} />
                </div>
                <Link
                  to="/docs"
                  className={cn("mt-4 inline-block text-sm transition-colors", theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-[#EB5601] hover:text-[#d14a01]")}
                >
                  View full API documentation
                </Link>
              </div>
            </section>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            <section>
              <h2 className={cn("text-sm font-normal mb-4 flex items-center gap-2", t.textMuted)}>
                <User className="h-4 w-4" />
                Profile
              </h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <div className="flex items-center gap-4">
                  {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="" className="h-14 w-14 rounded-full" />
                  ) : (
                    <div className={cn("h-14 w-14 rounded-full flex items-center justify-center text-lg font-normal", t.bgSecondary, t.textSubtle)}>
                      {user?.firstName?.[0] || user?.email?.[0] || "?"}
                    </div>
                  )}
                  <div>
                    <p className={t.textPrimary}>{user?.firstName} {user?.lastName}</p>
                    <p className={cn("text-sm", t.textSubtle)}>{user?.email}</p>
                  </div>
                </div>

                <div className={cn("mt-6 pt-4 border-t", t.border)}>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-red-400/80 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </section>

            {/* Account info */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4", t.textMuted)}>Account</h2>
              <div className={cn("p-4 rounded-lg border space-y-3", t.bgCard, t.border)}>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", t.textSubtle)}>Member since</span>
                  <span className={cn("text-sm", t.textSecondary)}>
                    {currentUser?.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", t.textSubtle)}>Total sessions</span>
                  <span className={cn("text-sm", t.textSecondary)}>{stats?.sessionCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", t.textSubtle)}>Total messages</span>
                  <span className={cn("text-sm", t.textSecondary)}>{stats?.messageCount || 0}</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Revoke API Key Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={confirmRevokeKey}
        title="Revoke API Key"
        message="Are you sure? This will invalidate any apps using this key."
        confirmText="Revoke Key"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

// Stat card component
function StatCard({
  icon,
  label,
  value,
  theme = "dark",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  theme?: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  return (
    <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
      <div className={cn("flex items-center gap-2 mb-2", t.textSubtle)}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={cn("text-xl font-light", t.textPrimary)}>{value}</p>
    </div>
  );
}

// Endpoint row component
function EndpointRow({ method, path, theme = "dark" }: { method: string; path: string; theme?: "dark" | "tan" }) {
  const t = getThemeClasses(theme);
  return (
    <div className="flex items-center gap-2">
      <span className={cn("px-1.5 py-0.5 rounded text-xs", theme === "dark" ? "bg-emerald-500/20 text-emerald-400" : "bg-[#EB5601]/20 text-[#EB5601]")}>
        {method}
      </span>
      <span className={t.textSubtle}>{path}</span>
    </div>
  );
}
