import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";
import { ConfirmModal } from "../components/ConfirmModal";
import {
  LegalModal,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
} from "../components/LegalModal";
import {
  ArrowLeft,
  Key,
  Copy,
  Check,
  Trash2,
  Terminal,
  Eye,
  EyeOff,
  ExternalLink,
  User,
  LogOut,
  Zap,
  Sun,
  Moon,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  Shield,
  Bot,
} from "lucide-react";

// Convex URL from environment
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;

// AI Coding Agents configuration
type AgentStatus = "supported" | "community" | "planned" | "tbd";

interface AIAgent {
  id: string;
  name: string;
  status: AgentStatus;
  defaultEnabled: boolean;
  description?: string;
  url?: string;
}

const AI_AGENTS: AIAgent[] = [
  {
    id: "opencode",
    name: "OpenCode",
    status: "supported",
    defaultEnabled: true,
    url: "https://github.com/opencode-ai/opencode",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    status: "supported",
    defaultEnabled: true,
    url: "https://docs.anthropic.com/en/docs/claude-code",
  },
  {
    id: "factory-droid",
    name: "Factory Droid",
    status: "community",
    defaultEnabled: false,
    url: "https://github.com/waynesutton/opensync/pull/3",
  },
  {
    id: "cursor-sync",
    name: "Cursor",
    status: "supported",
    defaultEnabled: false,
    url: "https://www.npmjs.com/package/cursor-sync-plugin",
  },
  {
    id: "codex-cli",
    name: "Codex CLI",
    status: "supported",
    defaultEnabled: false,
    url: "https://www.npmjs.com/package/codex-sync",
  },
  {
    id: "continue",
    name: "Continue",
    status: "planned",
    defaultEnabled: false,
  },
  { id: "amp", name: "Amp", status: "planned", defaultEnabled: false },
  { id: "aider", name: "Aider", status: "tbd", defaultEnabled: false },
  { id: "goose", name: "Goose", status: "tbd", defaultEnabled: false },
  { id: "mentat", name: "Mentat", status: "tbd", defaultEnabled: false },
  { id: "cline", name: "Cline", status: "tbd", defaultEnabled: false },
  { id: "kilo-code", name: "Kilo Code", status: "tbd", defaultEnabled: false },
];

// Default enabled agents for backward compatibility
const DEFAULT_ENABLED_AGENTS = AI_AGENTS.filter((a) => a.defaultEnabled).map(
  (a) => a.id,
);

// Status badge styling
const getStatusBadgeClasses = (status: AgentStatus, theme: "dark" | "tan") => {
  const isDark = theme === "dark";
  switch (status) {
    case "supported":
      return isDark
        ? "bg-emerald-500/15 text-emerald-400"
        : "bg-emerald-500/15 text-emerald-600";
    case "community":
      return isDark
        ? "bg-blue-500/15 text-blue-400"
        : "bg-blue-500/15 text-blue-600";
    case "planned":
      return isDark
        ? "bg-amber-500/15 text-amber-400"
        : "bg-amber-500/15 text-amber-600";
    case "tbd":
      return isDark
        ? "bg-zinc-500/15 text-zinc-400"
        : "bg-zinc-500/15 text-zinc-500";
  }
};

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const t = getThemeClasses(theme);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  // Default to profile tab if accessed via /profile URL
  const [activeTab, setActiveTab] = useState<"api" | "profile">(
    location.pathname === "/profile" ? "profile" : "api",
  );
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  // Auto-expand profile section when accessed via /profile
  const [showProfile, setShowProfile] = useState(
    location.pathname === "/profile",
  );

  // Danger zone state
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Legal modals state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const currentUser = useQuery(api.users.me);
  const stats = useQuery(api.users.stats);

  const generateApiKey = useMutation(api.users.generateApiKey);
  const revokeApiKey = useMutation(api.users.revokeApiKey);
  const deleteAllData = useMutation(api.users.deleteAllData);
  const deleteAccount = useAction(api.users.deleteAccount);
  const updateEnabledAgents = useMutation(api.users.updateEnabledAgents);

  // Compute enabled agents with defaults for backward compatibility
  const enabledAgents = currentUser?.enabledAgents ?? DEFAULT_ENABLED_AGENTS;

  // Handler to toggle an agent's enabled state
  const handleToggleAgent = async (agentId: string) => {
    const isCurrentlyEnabled = enabledAgents.includes(agentId);
    const newEnabledAgents = isCurrentlyEnabled
      ? enabledAgents.filter((id) => id !== agentId)
      : [...enabledAgents, agentId];
    await updateEnabledAgents({ enabledAgents: newEnabledAgents });
  };

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

  // Delete all synced data (keeps account)
  const handleDeleteData = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAllData();
      setShowDeleteDataModal(false);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete data",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete account and all data
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteAccount();
      if (result.deleted) {
        // Account deleted successfully
        // Don't call signOut() - it causes a redirect to WorkOS logout URL
        // Instead, redirect directly to homepage
        // The auth state will update automatically since the user no longer exists
        window.location.href = "/";
      } else {
        setDeleteError(result.error || "Failed to delete account");
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete account",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("min-h-screen", t.bgPrimary)}>
      {/* Header */}
      <header
        className={cn("border-b sticky top-0 z-10", t.border, t.bgPrimary)}
      >
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center gap-4">
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-2 transition-colors",
              t.textSubtle,
              t.bgHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <span className={cn("text-sm font-normal", t.textSecondary)}>
            Settings
          </span>
          <div className="flex-1" />
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "p-1.5 rounded transition-colors",
              t.textSubtle,
              t.bgHover,
            )}
            title={
              theme === "dark" ? "Switch to tan mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div
          className={cn("flex items-center gap-1 mb-8 border-b pb-4", t.border)}
        >
          {(["api", "profile"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm rounded-md transition-colors capitalize",
                activeTab === tab
                  ? cn(t.bgToggleActive, t.textPrimary)
                  : cn(t.textSubtle, t.bgHover),
              )}
            >
              {tab === "api" ? "API Access" : tab}
            </button>
          ))}
        </div>

        {/* API Tab */}
        {activeTab === "api" && (
          <div className="space-y-8">
            {/* Two-column grid: Plugin Setup + AI Coding Agents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plugin Setup */}
              <section>
                <h2
                  className={cn(
                    "text-sm font-normal mb-4 flex items-center gap-2",
                    t.textMuted,
                  )}
                >
                  <Terminal className="h-4 w-4" />
                  Plugin Setup
                </h2>
                <div
                  className={cn(
                    "p-4 rounded-lg border h-full",
                    t.bgCard,
                    t.border,
                  )}
                >
                  {/* Convex URL */}
                  <div className="space-y-4">
                    <div>
                      <label
                        className={cn("text-xs mb-1.5 block", t.textSubtle)}
                      >
                        Convex URL
                      </label>
                      <div className="flex items-center gap-2">
                        <code
                          className={cn(
                            "flex-1 text-sm font-mono px-3 py-2 rounded border overflow-x-auto",
                            t.bgCode,
                            t.border,
                            t.textSecondary,
                          )}
                        >
                          {CONVEX_URL || "Not configured"}
                        </code>
                        <button
                          onClick={handleCopyUrl}
                          className={cn(
                            "p-2 rounded border transition-colors",
                            t.border,
                            t.textSubtle,
                            t.bgHover,
                          )}
                          title="Copy"
                        >
                          {copiedUrl ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* API Key Status */}
                    <div>
                      <label
                        className={cn("text-xs mb-1.5 block", t.textSubtle)}
                      >
                        API Key
                      </label>
                      {currentUser?.hasApiKey || newApiKey ? (
                        <div className="flex items-center gap-2">
                          <code
                            className={cn(
                              "flex-1 text-sm font-mono px-3 py-2 rounded border",
                              t.bgCode,
                              t.border,
                              t.textSecondary,
                            )}
                          >
                            {newApiKey && showApiKey
                              ? newApiKey
                              : "osk_••••••••••••••••"}
                          </code>
                          {newApiKey && (
                            <>
                              <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className={cn(
                                  "p-2 rounded border transition-colors",
                                  t.border,
                                  t.textSubtle,
                                  t.bgHover,
                                )}
                              >
                                {showApiKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={handleCopyKey}
                                className={cn(
                                  "p-2 rounded border transition-colors",
                                  t.border,
                                  t.textSubtle,
                                  t.bgHover,
                                )}
                              >
                                {copiedKey ? (
                                  <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className={cn("text-sm", t.textDim)}>
                          No API key generated
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Setup */}
                  <div
                    className={cn(
                      "mt-4 p-3 rounded border",
                      t.bgSecondary,
                      t.borderLight,
                    )}
                  >
                    <p className={cn("text-xs font-normal mb-2", t.textMuted)}>
                      Quick setup
                    </p>
                    <div
                      className={cn(
                        "space-y-1 text-xs font-mono",
                        t.textSubtle,
                      )}
                    >
                      <p className={t.textDim}># For OpenCode</p>
                      <p>npm install -g opencode-sync-plugin</p>
                      <p>opencode-sync login</p>
                      <p className={cn("mt-2", t.textDim)}># For Claude Code</p>
                      <p>npm install -g claude-code-sync</p>
                      <p>claude-code-sync login</p>
                      <p className={cn("mt-2", t.textDim)}>
                        # For Factory Droid
                      </p>
                      <p>npm install -g droid-sync</p>
                      <p>droid-sync login</p>
                      <p className={cn("mt-2", t.textDim)}># For Codex CLI</p>
                      <p>npm install -g codex-sync</p>
                      <p>codex-sync login</p>
                      <p className={cn("mt-2", t.textDim)}># For Cursor</p>
                      <p>npm install -g cursor-sync-plugin</p>
                      <p>cursor-sync login</p>
                    </div>
                  </div>

                  {/* Plugin links */}
                  <div className={cn("text-sm mt-4 space-y-2", t.textSubtle)}>
                    <p>
                      <a
                        href="https://www.npmjs.com/package/opencode-sync-plugin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          theme === "dark"
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-[#EB5601] hover:text-[#d14a01]",
                        )}
                      >
                        opencode-sync-plugin
                        <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      <span className={t.textDim}>
                        Sync your OpenCode sessions
                      </span>{" "}
                      <a
                        href="https://github.com/waynesutton/opencode-sync-plugin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("text-xs", t.textDim, "hover:underline")}
                      >
                        (GitHub)
                      </a>
                    </p>
                    <p>
                      <a
                        href="https://www.npmjs.com/package/claude-code-sync"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          theme === "dark"
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-[#EB5601] hover:text-[#d14a01]",
                        )}
                      >
                        claude-code-sync
                        <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      <span className={t.textDim}>
                        Sync your Claude Code sessions
                      </span>{" "}
                      <a
                        href="https://github.com/waynesutton/claude-code-sync"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("text-xs", t.textDim, "hover:underline")}
                      >
                        (GitHub)
                      </a>
                    </p>
                    <p>
                      <a
                        href="https://www.npmjs.com/package/droid-sync"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          theme === "dark"
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-[#EB5601] hover:text-[#d14a01]",
                        )}
                      >
                        droid-sync
                        <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      <span className={t.textDim}>
                        Sync your Factory Droid sessions
                      </span>{" "}
                      <a
                        href="https://github.com/yemyat/droid-sync-plugin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("text-xs", t.textDim, "hover:underline")}
                      >
                        (GitHub)
                      </a>
                    </p>
                    <p>
                      <a
                        href="https://www.npmjs.com/package/codex-sync"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          theme === "dark"
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-[#EB5601] hover:text-[#d14a01]",
                        )}
                      >
                        codex-sync
                        <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      <span className={t.textDim}>
                        Sync your Codex CLI sessions
                      </span>{" "}
                      <a
                        href="https://github.com/waynesutton/codex-sync-plugin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("text-xs", t.textDim, "hover:underline")}
                      >
                        (GitHub)
                      </a>
                    </p>
                    <p>
                      <a
                        href="https://www.npmjs.com/package/cursor-sync-plugin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          theme === "dark"
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-[#EB5601] hover:text-[#d14a01]",
                        )}
                      >
                        cursor-sync-plugin
                        <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      <span className={t.textDim}>
                        Sync your Cursor sessions
                      </span>{" "}
                      <a
                        href="https://github.com/waynesutton/cursor-cli-sync-plugin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("text-xs", t.textDim, "hover:underline")}
                      >
                        (GitHub)
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              {/* AI Coding Agents */}
              <section>
                <h2
                  className={cn(
                    "text-sm font-normal mb-4 flex items-center gap-2",
                    t.textMuted,
                  )}
                >
                  <Bot className="h-4 w-4" />
                  AI Coding Agents
                </h2>
                <div
                  className={cn(
                    "p-4 rounded-lg border h-full",
                    t.bgCard,
                    t.border,
                  )}
                >
                  <p className={cn("text-sm mb-4", t.textSubtle)}>
                    Select which CLI tools appear in the Source filter dropdown
                    on the Dashboard.
                  </p>

                  {/* Agent checkboxes grouped by status */}
                  <div className="space-y-4">
                    {/* Supported agents */}
                    <div>
                      <p
                        className={cn(
                          "text-xs font-medium mb-2 uppercase tracking-wide",
                          t.textDim,
                        )}
                      >
                        Supported
                      </p>
                      <div className="space-y-2">
                        {AI_AGENTS.filter((a) => a.status === "supported").map(
                          (agent) => (
                            <AgentCheckboxRow
                              key={agent.id}
                              agent={agent}
                              isEnabled={enabledAgents.includes(agent.id)}
                              onToggle={() => handleToggleAgent(agent.id)}
                              theme={theme}
                            />
                          ),
                        )}
                      </div>
                    </div>

                    {/* Community agents */}
                    <div>
                      <p
                        className={cn(
                          "text-xs font-medium mb-2 uppercase tracking-wide",
                          t.textDim,
                        )}
                      >
                        Community
                      </p>
                      <div className="space-y-2">
                        {AI_AGENTS.filter((a) => a.status === "community").map(
                          (agent) => (
                            <AgentCheckboxRow
                              key={agent.id}
                              agent={agent}
                              isEnabled={enabledAgents.includes(agent.id)}
                              onToggle={() => handleToggleAgent(agent.id)}
                              theme={theme}
                            />
                          ),
                        )}
                      </div>
                    </div>

                    {/* Planned agents */}
                    <div>
                      <p
                        className={cn(
                          "text-xs font-medium mb-2 uppercase tracking-wide",
                          t.textDim,
                        )}
                      >
                        Planned
                      </p>
                      <div className="space-y-2">
                        {AI_AGENTS.filter((a) => a.status === "planned").map(
                          (agent) => (
                            <AgentCheckboxRow
                              key={agent.id}
                              agent={agent}
                              isEnabled={enabledAgents.includes(agent.id)}
                              onToggle={() => handleToggleAgent(agent.id)}
                              theme={theme}
                            />
                          ),
                        )}
                      </div>
                    </div>

                    {/* TBD agents */}
                    <div>
                      <p
                        className={cn(
                          "text-xs font-medium mb-2 uppercase tracking-wide",
                          t.textDim,
                        )}
                      >
                        TBD
                      </p>
                      <div className="space-y-2">
                        {AI_AGENTS.filter((a) => a.status === "tbd").map(
                          (agent) => (
                            <AgentCheckboxRow
                              key={agent.id}
                              agent={agent}
                              isEnabled={enabledAgents.includes(agent.id)}
                              onToggle={() => handleToggleAgent(agent.id)}
                              theme={theme}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info note */}
                  <div
                    className={cn(
                      "mt-4 p-3 rounded border",
                      t.bgSecondary,
                      t.borderLight,
                    )}
                  >
                    <p className={cn("text-xs", t.textDim)}>
                      Enabling an agent adds it to the Source filter. If no data
                      exists for that tool, it will show empty results when
                      selected.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* API Key Management */}
            <section className="pt-4">
              <h2
                className={cn(
                  "text-sm font-normal mb-4 flex items-center gap-2",
                  t.textMuted,
                )}
              >
                <Key className="h-4 w-4" />
                API Key Management
              </h2>
              <div
                className={cn("mt-4 p-4 rounded-lg border", t.bgCard, t.border)}
              >
                <p className={cn("text-sm mb-2", t.textSubtle)}>
                  Generate an API key to access your sessions from external
                  applications.
                </p>
                <p className={cn("text-xs mb-4", t.textDim)}>
                  Use the same API key with opencode-sync-plugin,
                  claude-code-sync, and droid-sync.
                </p>

                {currentUser?.hasApiKey || newApiKey ? (
                  <div className="space-y-3">
                    {newApiKey && showApiKey && (
                      <div
                        className={cn(
                          "p-3 rounded border",
                          t.bgSecondary,
                          t.borderLight,
                        )}
                      >
                        <p className={cn("text-xs mb-2", t.textSubtle)}>
                          Copy this key now. You won't see it again.
                        </p>
                        <div className="flex items-center gap-2">
                          <code
                            className={cn(
                              "flex-1 text-sm font-mono px-2 py-1 rounded overflow-x-auto",
                              t.bgCode,
                              t.textSecondary,
                            )}
                          >
                            {newApiKey}
                          </code>
                          <button
                            onClick={handleCopyKey}
                            className={cn(
                              "p-2 rounded transition-colors",
                              t.textSubtle,
                              t.bgHover,
                            )}
                          >
                            {copiedKey ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-emerald-500">
                        API key active
                      </span>
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
                      theme === "dark"
                        ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        : "bg-[#EB5601] text-white hover:bg-[#d14a01]",
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
              <h2
                className={cn(
                  "text-sm font-normal mb-4 flex items-center gap-2",
                  t.textMuted,
                )}
              >
                <Zap className="h-4 w-4" />
                API Endpoints
              </h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <div className="space-y-2 text-sm font-mono">
                  <EndpointRow
                    method="GET"
                    path="/api/sessions"
                    theme={theme}
                  />
                  <EndpointRow
                    method="GET"
                    path="/api/search?q=query"
                    theme={theme}
                  />
                  <EndpointRow
                    method="GET"
                    path="/api/context?q=query"
                    theme={theme}
                  />
                  <EndpointRow
                    method="GET"
                    path="/api/export?id=sessionId"
                    theme={theme}
                  />
                </div>
                <Link
                  to="/docs"
                  className={cn(
                    "mt-4 inline-block text-sm transition-colors",
                    theme === "dark"
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-[#EB5601] hover:text-[#d14a01]",
                  )}
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
            {/* Collapsible Profile Section */}
            <section>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={cn(
                  "w-full text-sm font-normal mb-4 flex items-center gap-2 transition-colors",
                  t.textMuted,
                  t.bgHover,
                  "rounded-md p-2 -ml-2",
                )}
              >
                {showProfile ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <User className="h-4 w-4" />
                Profile
                <span className={cn("text-xs ml-2", t.textDim)}>
                  {showProfile ? "Click to collapse" : "Click to expand"}
                </span>
              </button>

              {showProfile && (
                <div
                  className={cn("p-4 rounded-lg border", t.bgCard, t.border)}
                >
                  <div className="flex items-center gap-4">
                    {user?.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt=""
                        className="h-14 w-14 rounded-full"
                      />
                    ) : (
                      <div
                        className={cn(
                          "h-14 w-14 rounded-full flex items-center justify-center text-lg font-normal",
                          t.bgSecondary,
                          t.textSubtle,
                        )}
                      >
                        {user?.firstName?.[0] || user?.email?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <p className={t.textPrimary}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className={cn("text-sm", t.textSubtle)}>
                        {user?.email}
                      </p>
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
              )}
            </section>

            {/* Account info */}
            <section>
              <h2 className={cn("text-sm font-normal mb-4", t.textMuted)}>
                Account
              </h2>
              <div
                className={cn(
                  "p-4 rounded-lg border space-y-3",
                  t.bgCard,
                  t.border,
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", t.textSubtle)}>
                    Member since
                  </span>
                  <span className={cn("text-sm", t.textSecondary)}>
                    {currentUser?.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", t.textSubtle)}>
                    Total sessions
                  </span>
                  <span className={cn("text-sm", t.textSecondary)}>
                    {stats?.sessionCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", t.textSubtle)}>
                    Total messages
                  </span>
                  <span className={cn("text-sm", t.textSecondary)}>
                    {stats?.messageCount || 0}
                  </span>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section>
              <h2
                className={cn(
                  "text-sm font-normal mb-4 flex items-center gap-2 text-red-400",
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </h2>
              <div
                className={cn(
                  "p-4 rounded-lg border border-red-500/30 space-y-4",
                  t.bgCard,
                )}
              >
                {/* Delete error message */}
                {deleteError && (
                  <div className="p-3 rounded border border-red-500/50 bg-red-500/10">
                    <p className="text-sm text-red-400">{deleteError}</p>
                  </div>
                )}

                {/* Delete synced data */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={cn("text-sm font-medium", t.textSecondary)}>
                      Delete synced data
                    </p>
                    <p className={cn("text-xs mt-1", t.textDim)}>
                      Remove all sessions, messages, and embeddings. Your
                      account will remain active.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteDataModal(true)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Delete Data
                  </button>
                </div>

                <div className={cn("border-t", t.border)} />

                {/* Delete account */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={cn("text-sm font-medium", t.textSecondary)}>
                      Delete account
                    </p>
                    <p className={cn("text-xs mt-1", t.textDim)}>
                      Permanently delete your account and all data. This cannot
                      be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Delete Account
                  </button>
                </div>
              </div>
            </section>

            {/* Legal Links */}
            <section>
              <h2
                className={cn(
                  "text-sm font-normal mb-4 flex items-center gap-2",
                  t.textMuted,
                )}
              >
                <FileText className="h-4 w-4" />
                Legal
              </h2>
              <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-colors",
                      theme === "dark"
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-[#EB5601] hover:text-[#d14a01]",
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    Terms of Service
                  </button>
                  <button
                    onClick={() => setShowPrivacyModal(true)}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-colors",
                      theme === "dark"
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-[#EB5601] hover:text-[#d14a01]",
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    Privacy Policy
                  </button>
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

      {/* Delete Data Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteDataModal}
        onClose={() => {
          setShowDeleteDataModal(false);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteData}
        title="Delete All Synced Data"
        message="This will permanently delete all your sessions, messages, and embeddings. Your account will remain active and you can sync new data anytime."
        confirmText="Delete All Data"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteAccountModal}
        onClose={() => {
          setShowDeleteAccountModal(false);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This will permanently delete your account and all associated data. This action cannot be undone. You will be signed out immediately."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Legal Modals */}
      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
        content={TERMS_OF_SERVICE}
      />
      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        content={PRIVACY_POLICY}
      />
    </div>
  );
}

// Endpoint row component
function EndpointRow({
  method,
  path,
  theme = "dark",
}: {
  method: string;
  path: string;
  theme?: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-xs",
          theme === "dark"
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-[#EB5601]/20 text-[#EB5601]",
        )}
      >
        {method}
      </span>
      <span className={t.textSubtle}>{path}</span>
    </div>
  );
}

// Agent checkbox row component for AI Coding Agents section
function AgentCheckboxRow({
  agent,
  isEnabled,
  onToggle,
  theme,
}: {
  agent: AIAgent;
  isEnabled: boolean;
  onToggle: () => void;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  const statusClasses = getStatusBadgeClasses(agent.status, theme);

  return (
    <label
      className={cn(
        "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
        t.bgHover,
      )}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={onToggle}
        className={cn(
          "h-4 w-4 rounded border transition-colors cursor-pointer",
          theme === "dark"
            ? "bg-zinc-800 border-zinc-600 accent-blue-500"
            : "bg-white border-[#d1ccc4] accent-[#EB5601]",
        )}
      />

      {/* Agent name */}
      <span className={cn("flex-1 text-sm", t.textSecondary)}>
        {agent.url ? (
          <a
            href={agent.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "hover:underline",
              theme === "dark"
                ? "text-blue-400 hover:text-blue-300"
                : "text-[#EB5601] hover:text-[#d14a01]",
            )}
          >
            {agent.name}
          </a>
        ) : (
          agent.name
        )}
      </span>

      {/* Status badge */}
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
          statusClasses,
        )}
      >
        {agent.status}
      </span>
    </label>
  );
}
