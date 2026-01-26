import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Copy,
  Check,
  Menu,
  X,
  FileText,
  Code,
  Search,
  Zap,
  Shield,
  Cloud,
  Terminal,
  HelpCircle,
  BookOpen,
  Package,
  BarChart3,
  Command,
  Bell,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";

// Search index entry type
interface SearchEntry {
  id: string;
  title: string;
  section: string;
  keywords: string[];
  snippet: string;
}

// Build searchable index from doc content
const searchIndex: SearchEntry[] = [
  // Hosted Version
  {
    id: "hosted",
    title: "Use the Hosted Version",
    section: "Getting Started",
    keywords: [
      "hosted",
      "quick",
      "start",
      "sign in",
      "opensync.dev",
      "2 minutes",
    ],
    snippet: "Start syncing sessions in under 2 minutes with opensync.dev",
  },
  {
    id: "hosted-features",
    title: "Features",
    section: "Hosted Version",
    keywords: [
      "sync",
      "search",
      "private",
      "export",
      "delete",
      "api",
      "rag",
      "workos",
    ],
    snippet: "Sync, search, export, and API access features",
  },
  {
    id: "hosted-install",
    title: "Install Plugins Locally",
    section: "Hosted Version",
    keywords: [
      "install",
      "npm",
      "opencode-sync-plugin",
      "claude-code-sync",
      "plugin",
      "global",
    ],
    snippet: "npm install -g opencode-sync-plugin",
  },
  {
    id: "hosted-login",
    title: "Login and Sync",
    section: "Hosted Version",
    keywords: ["login", "sync", "api key", "convex url", "authenticate"],
    snippet: "Run opencode-sync login or claude-code-sync login",
  },

  // Requirements
  {
    id: "requirements",
    title: "Self-Hosting Requirements",
    section: "Setup",
    keywords: ["requirements", "self-host", "deploy", "cloud", "local"],
    snippet: "Requirements for self-hosting your own instance",
  },
  {
    id: "requirements-cloud",
    title: "Cloud Deployment",
    section: "Requirements",
    keywords: [
      "cloud",
      "convex",
      "workos",
      "node",
      "openai",
      "api key",
      "scaling",
    ],
    snippet: "Use Convex Cloud for managed backend",
  },
  {
    id: "requirements-local",
    title: "100% Local Deployment",
    section: "Requirements",
    keywords: [
      "local",
      "docker",
      "self-host",
      "127.0.0.1",
      "private",
      "no cloud",
    ],
    snippet: "Run entirely on your machine with Docker",
  },

  // Quick Start
  {
    id: "quickstart",
    title: "Quick Start",
    section: "Setup",
    keywords: [
      "quickstart",
      "quick start",
      "getting started",
      "setup",
      "begin",
    ],
    snippet: "Get started with OpenSync",
  },
  {
    id: "quickstart-deploy",
    title: "Deploy Backend",
    section: "Quick Start",
    keywords: ["deploy", "backend", "convex", "npx convex dev", "clone", "git"],
    snippet: "Clone repo and deploy to Convex",
  },
  {
    id: "quickstart-api-key",
    title: "Get API Key",
    section: "Quick Start",
    keywords: ["api key", "generate", "settings", "osk_", "token"],
    snippet: "Generate API key from Settings",
  },
  {
    id: "quickstart-plugin",
    title: "Install Plugin",
    section: "Quick Start",
    keywords: ["install", "plugin", "npm", "opencode", "claude code"],
    snippet: "Install opencode-sync-plugin or claude-code-sync",
  },

  // Dashboard
  {
    id: "dashboard",
    title: "Dashboard Features",
    section: "Features",
    keywords: ["dashboard", "overview", "metrics", "analytics", "ui"],
    snippet: "Dashboard overview and features",
  },
  {
    id: "dashboard-overview",
    title: "Overview Tab",
    section: "Dashboard",
    keywords: [
      "overview",
      "metrics",
      "total sessions",
      "tokens",
      "cost",
      "charts",
      "30 days",
    ],
    snippet: "Key metrics and usage trends over 30 days",
  },
  {
    id: "dashboard-sessions",
    title: "Sessions View",
    section: "Dashboard",
    keywords: [
      "sessions",
      "browse",
      "filter",
      "sort",
      "source badges",
      "OC",
      "CC",
      "conversation",
    ],
    snippet: "Browse and filter all synced sessions",
  },
  {
    id: "dashboard-evals",
    title: "Evals Export",
    section: "Dashboard",
    keywords: [
      "evals",
      "export",
      "eval-ready",
      "deepeval",
      "openai",
      "jsonl",
      "training",
      "dataset",
    ],
    snippet: "Export sessions for training and evaluation",
  },
  {
    id: "dashboard-analytics",
    title: "Analytics",
    section: "Dashboard",
    keywords: [
      "analytics",
      "model",
      "provider",
      "project",
      "breakdown",
      "cost per session",
      "efficiency",
    ],
    snippet: "Detailed breakdowns by model, provider, project",
  },
  {
    id: "dashboard-context",
    title: "Context Search",
    section: "Dashboard",
    keywords: ["context", "search", "rag", "full-text", "semantic", "pipeline"],
    snippet: "Full-text search for RAG pipelines",
  },

  // OpenCode Plugin
  {
    id: "opencode-plugin",
    title: "OpenCode Plugin",
    section: "Plugins",
    keywords: ["opencode", "plugin", "opencode-sync-plugin", "npm"],
    snippet: "OpenCode sync plugin documentation",
  },
  {
    id: "opencode-install",
    title: "Installation",
    section: "OpenCode Plugin",
    keywords: [
      "install",
      "npm install",
      "opencode-sync-plugin",
      "global",
      "-g",
    ],
    snippet: "npm install -g opencode-sync-plugin",
  },
  {
    id: "opencode-config",
    title: "Configuration",
    section: "OpenCode Plugin",
    keywords: [
      "config",
      "configuration",
      "opencode.json",
      "plugin array",
      "login",
    ],
    snippet: "Configure opencode.json with plugin array",
  },
  {
    id: "opencode-commands",
    title: "Commands",
    section: "OpenCode Plugin",
    keywords: ["commands", "login", "status", "sync", "opencode-sync"],
    snippet: "login, status, sync commands",
  },

  // Claude Plugin
  {
    id: "claude-plugin",
    title: "Claude Code Plugin",
    section: "Plugins",
    keywords: ["claude", "claude code", "claude-code-sync", "anthropic"],
    snippet: "Claude Code sync plugin documentation",
  },
  {
    id: "claude-install",
    title: "Installation",
    section: "Claude Code Plugin",
    keywords: ["install", "npm install", "claude-code-sync", "global", "-g"],
    snippet: "npm install -g claude-code-sync",
  },
  {
    id: "claude-config",
    title: "Configuration",
    section: "Claude Code Plugin",
    keywords: [
      "config",
      "configuration",
      "config.json",
      ".config",
      "convexUrl",
      "apiKey",
    ],
    snippet: "Create ~/.config/claude-code-sync/config.json",
  },
  {
    id: "claude-commands",
    title: "Commands",
    section: "Claude Code Plugin",
    keywords: ["commands", "login", "status", "sync", "claude-code-sync"],
    snippet: "login, status, sync commands",
  },

  // Codex CLI Plugin
  {
    id: "codex-plugin",
    title: "Codex CLI Plugin",
    section: "Plugins",
    keywords: ["codex", "codex-sync", "openai", "codex cli", "codex-cli"],
    snippet: "Codex CLI sync plugin documentation",
  },
  {
    id: "codex-install",
    title: "Installation",
    section: "Codex CLI Plugin",
    keywords: ["install", "npm install", "codex-sync", "global", "-g"],
    snippet: "npm install -g codex-sync",
  },
  {
    id: "codex-config",
    title: "Configuration",
    section: "Codex CLI Plugin",
    keywords: [
      "config",
      "codex",
      "toml",
      "notify",
      "hook",
      "agent-turn-complete",
    ],
    snippet: "Configure codex notify hook",
  },
  {
    id: "codex-commands",
    title: "Commands",
    section: "Codex CLI Plugin",
    keywords: ["commands", "login", "setup", "verify", "sync", "codex-sync"],
    snippet: "login, setup, verify, sync commands",
  },

  // Cursor Plugin
  {
    id: "cursor-plugin",
    title: "Cursor Plugin",
    section: "Plugins",
    keywords: ["cursor", "cursor-sync", "cursor-sync-plugin", "ide"],
    snippet: "Cursor sync plugin documentation",
  },
  {
    id: "cursor-install",
    title: "Installation",
    section: "Cursor Plugin",
    keywords: ["install", "npm install", "cursor-sync-plugin", "global", "-g"],
    snippet: "npm install -g cursor-sync-plugin",
  },
  {
    id: "cursor-config",
    title: "Configuration",
    section: "Cursor Plugin",
    keywords: ["config", "login", "setup", "hooks", "hooks.json"],
    snippet: "cursor-sync login and setup configuration",
  },
  {
    id: "cursor-commands",
    title: "Commands",
    section: "Cursor Plugin",
    keywords: ["commands", "login", "setup", "verify", "synctest", "logout", "status"],
    snippet: "cursor-sync CLI commands",
  },

  // API Reference
  {
    id: "api",
    title: "API Reference",
    section: "API",
    keywords: ["api", "rest", "http", "endpoint", "curl", "bearer token"],
    snippet: "REST API reference and endpoints",
  },
  {
    id: "api-auth",
    title: "Authentication",
    section: "API",
    keywords: [
      "authentication",
      "auth",
      "bearer",
      "token",
      "api key",
      "jwt",
      "authorization header",
    ],
    snippet: "Bearer token authentication",
  },
  {
    id: "api-sessions",
    title: "Sessions Endpoint",
    section: "API",
    keywords: ["sessions", "endpoint", "/api/sessions", "list", "get"],
    snippet: "GET /api/sessions",
  },
  {
    id: "api-search",
    title: "Search Endpoint",
    section: "API",
    keywords: [
      "search",
      "endpoint",
      "/api/search",
      "query",
      "type",
      "fulltext",
      "semantic",
    ],
    snippet: "GET /api/search?q=query&type=semantic",
  },
  {
    id: "api-context",
    title: "Context Endpoint",
    section: "API",
    keywords: [
      "context",
      "endpoint",
      "/api/context",
      "rag",
      "format",
      "text",
      "limit",
    ],
    snippet: "GET /api/context for RAG pipelines",
  },
  {
    id: "api-export",
    title: "Export Endpoint",
    section: "API",
    keywords: [
      "export",
      "endpoint",
      "/api/export",
      "markdown",
      "format",
      "download",
    ],
    snippet: "GET /api/export?format=markdown",
  },
  {
    id: "api-stats",
    title: "Stats Endpoint",
    section: "API",
    keywords: ["stats", "statistics", "endpoint", "/api/stats", "metrics"],
    snippet: "GET /api/stats",
  },

  // Search Types
  {
    id: "search",
    title: "Search",
    section: "Features",
    keywords: ["search", "full-text", "semantic", "hybrid", "embeddings"],
    snippet: "Search types and functionality",
  },
  {
    id: "search-fulltext",
    title: "Full-Text Search",
    section: "Search",
    keywords: [
      "full-text",
      "fulltext",
      "keyword",
      "exact",
      "fast",
      "?type=fulltext",
    ],
    snippet: "Keyword matching, fast and exact",
  },
  {
    id: "search-semantic",
    title: "Semantic Search",
    section: "Search",
    keywords: [
      "semantic",
      "meaning",
      "embeddings",
      "openai",
      "vector",
      "?type=semantic",
    ],
    snippet: "Meaning-based search using embeddings",
  },
  {
    id: "search-hybrid",
    title: "Hybrid Search",
    section: "Search",
    keywords: ["hybrid", "rrf", "combined", "both", "?type=hybrid"],
    snippet: "Combines full-text and semantic search",
  },

  // Authentication
  {
    id: "auth",
    title: "Authentication",
    section: "Security",
    keywords: ["authentication", "auth", "security", "workos", "api key"],
    snippet: "Authentication methods",
  },
  {
    id: "auth-workos",
    title: "WorkOS AuthKit",
    section: "Authentication",
    keywords: [
      "workos",
      "authkit",
      "sso",
      "enterprise",
      "oauth",
      "google",
      "github",
    ],
    snippet: "Enterprise authentication with SSO support",
  },
  {
    id: "auth-api-keys",
    title: "API Keys",
    section: "Authentication",
    keywords: ["api key", "osk_", "generate", "settings", "plugins", "bearer"],
    snippet: "Generate API keys for plugins",
  },

  // Hosting
  {
    id: "hosting",
    title: "Hosting & Deploy",
    section: "Deployment",
    keywords: ["hosting", "deploy", "deployment", "production"],
    snippet: "Hosting and deployment options",
  },
  {
    id: "hosting-convex",
    title: "Convex Backend",
    section: "Hosting",
    keywords: [
      "convex",
      "backend",
      "deploy",
      "npx convex deploy",
      "real-time",
      "database",
    ],
    snippet: "Deploy backend to Convex",
  },
  {
    id: "hosting-netlify",
    title: "Netlify Frontend",
    section: "Hosting",
    keywords: ["netlify", "frontend", "deploy", "vercel", "react", "vite"],
    snippet: "Deploy frontend to Netlify",
  },
  {
    id: "hosting-env",
    title: "Environment Variables",
    section: "Hosting",
    keywords: [
      "env",
      "environment",
      "variables",
      "VITE_CONVEX_URL",
      "VITE_WORKOS_CLIENT_ID",
      ".env",
    ],
    snippet: "Required environment variables",
  },

  // Fork & Self-Host
  {
    id: "fork",
    title: "Fork & Self-Host",
    section: "Advanced",
    keywords: ["fork", "self-host", "clone", "github", "customize"],
    snippet: "Fork and customize OpenSync",
  },
  {
    id: "fork-repo",
    title: "Clone Repository",
    section: "Fork",
    keywords: ["clone", "git clone", "github", "repository", "repo"],
    snippet: "git clone https://github.com/waynesutton/opensync.git",
  },
  {
    id: "fork-setup",
    title: "Setup Steps",
    section: "Fork",
    keywords: ["setup", "steps", "convex", "workos", "env", "deploy"],
    snippet: "Step-by-step setup guide",
  },
  {
    id: "fork-customize",
    title: "Customization",
    section: "Fork",
    keywords: ["customize", "customization", "modify", "theme", "branding"],
    snippet: "Customize your instance",
  },

  // Troubleshooting & FAQ
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    section: "Help",
    keywords: [
      "troubleshooting",
      "error",
      "issue",
      "problem",
      "fix",
      "debug",
      "not working",
    ],
    snippet: "Common issues and solutions",
  },
  {
    id: "faq",
    title: "FAQ",
    section: "Help",
    keywords: ["faq", "question", "frequently asked", "help", "support"],
    snippet: "Frequently asked questions",
  },
];

// DocSearch component with typeahead
function DocSearch({ onClose }: { onClose?: () => void }) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return searchIndex
      .filter((entry) => {
        // Match title, keywords, or snippet
        return (
          entry.title.toLowerCase().includes(q) ||
          entry.keywords.some((k) => k.includes(q)) ||
          entry.snippet.toLowerCase().includes(q)
        );
      })
      .slice(0, 8); // Limit to 8 results
  }, [query]);

  // Navigate to section
  const navigateToSection = useCallback(
    (id: string) => {
      setIsOpen(false);
      setQuery("");
      onClose?.();
      // Navigate with hash
      navigate(`/docs#${id}`);
      // Scroll to element after a brief delay for DOM update
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    [navigate, onClose],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        navigateToSection(results[selectedIndex].id);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    },
    [results, selectedIndex, navigateToSection],
  );

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const item = resultsRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, results.length]);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            t.textSubtle,
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay to allow click on results
            setTimeout(() => setIsOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search docs..."
          className={cn(
            "w-full pl-9 pr-16 py-2 text-sm rounded-lg border transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            t.border,
            t.bgCard,
            t.textPrimary,
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:ring-gray-300 dark:focus:ring-gray-600",
          )}
        />
        <div
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px]",
            t.textDim,
          )}
        >
          <kbd
            className={cn(
              "px-1.5 py-0.5 rounded border font-mono",
              t.border,
              t.bgCode,
            )}
          >
            <Command className="h-3 w-3 inline" />
          </kbd>
          <kbd
            className={cn(
              "px-1.5 py-0.5 rounded border font-mono",
              t.border,
              t.bgCode,
            )}
          >
            K
          </kbd>
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className={cn(
            "absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto",
            t.border,
            theme === "dark" ? "bg-[#1a1a1a]" : "bg-[#faf8f5]",
          )}
        >
          {results.map((result, i) => (
            <button
              key={result.id}
              onClick={() => navigateToSection(result.id)}
              className={cn(
                "w-full px-4 py-3 text-left flex flex-col gap-1 transition-colors border-b last:border-b-0",
                t.border,
                i === selectedIndex
                  ? theme === "dark"
                    ? "bg-[#2a2a2a]"
                    : "bg-[#f0ede8]"
                  : theme === "dark"
                    ? "hover:bg-[#252525]"
                    : "hover:bg-[#f5f2ed]",
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-medium", t.textPrimary)}>
                  {result.title}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    theme === "dark" ? "bg-[#2a2a2a]" : "bg-[#e8e5e0]",
                    t.textDim,
                  )}
                >
                  {result.section}
                </span>
              </div>
              <p className={cn("text-xs line-clamp-1", t.textSubtle)}>
                {result.snippet}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && results.length === 0 && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-xl p-4 z-50",
            t.border,
            theme === "dark" ? "bg-[#1a1a1a]" : "bg-[#faf8f5]",
          )}
        >
          <p className={cn("text-sm text-center", t.textSubtle)}>
            No results for "{query}"
          </p>
        </div>
      )}
    </div>
  );
}

// Documentation sections structure
interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  subsections?: { id: string; title: string }[];
}

const docSections: DocSection[] = [
  {
    id: "hosted",
    title: "Use Hosted Version",
    icon: <Cloud className="h-4 w-4" />,
    subsections: [
      { id: "hosted-features", title: "Features" },
      { id: "hosted-install", title: "Install Plugins" },
      { id: "hosted-login", title: "Login and Sync" },
    ],
  },
  {
    id: "requirements",
    title: "Self-Hosting Requirements",
    icon: <Zap className="h-4 w-4" />,
    subsections: [
      { id: "requirements-cloud", title: "Cloud Deployment" },
      { id: "requirements-local", title: "100% Local Deployment" },
    ],
  },
  {
    id: "quickstart",
    title: "Quick Start",
    icon: <Terminal className="h-4 w-4" />,
    subsections: [
      { id: "quickstart-deploy", title: "Deploy Backend" },
      { id: "quickstart-api-key", title: "Get API Key" },
      { id: "quickstart-plugin", title: "Install Plugin" },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard Features",
    icon: <BarChart3 className="h-4 w-4" />,
    subsections: [
      { id: "dashboard-overview", title: "Overview" },
      { id: "dashboard-sessions", title: "Sessions View" },
      { id: "dashboard-evals", title: "Evals Export" },
      { id: "dashboard-analytics", title: "Analytics" },
      { id: "dashboard-context", title: "Context Search" },
    ],
  },
  {
    id: "opencode-plugin",
    title: "OpenCode Plugin",
    icon: <Package className="h-4 w-4" />,
    subsections: [
      { id: "opencode-install", title: "Installation" },
      { id: "opencode-config", title: "Configuration" },
      { id: "opencode-commands", title: "Commands" },
    ],
  },
  {
    id: "claude-plugin",
    title: "Claude Code Plugin",
    icon: <Package className="h-4 w-4" />,
    subsections: [
      { id: "claude-install", title: "Installation" },
      { id: "claude-config", title: "Configuration" },
      { id: "claude-commands", title: "Commands" },
    ],
  },
  {
    id: "codex-plugin",
    title: "Codex CLI Plugin",
    icon: <Package className="h-4 w-4" />,
    subsections: [
      { id: "codex-install", title: "Installation" },
      { id: "codex-config", title: "Configuration" },
      { id: "codex-commands", title: "Commands" },
    ],
  },
  {
    id: "cursor-plugin",
    title: "Cursor Plugin",
    icon: <Package className="h-4 w-4" />,
    subsections: [
      { id: "cursor-install", title: "Installation" },
      { id: "cursor-config", title: "Configuration" },
      { id: "cursor-commands", title: "Commands" },
    ],
  },
  {
    id: "api",
    title: "API Reference",
    icon: <Code className="h-4 w-4" />,
    subsections: [
      { id: "api-auth", title: "Authentication" },
      { id: "api-sessions", title: "Sessions" },
      { id: "api-search", title: "Search" },
      { id: "api-context", title: "Context" },
      { id: "api-export", title: "Export" },
      { id: "api-stats", title: "Stats" },
    ],
  },
  {
    id: "search",
    title: "Search",
    icon: <Search className="h-4 w-4" />,
    subsections: [
      { id: "search-fulltext", title: "Full-Text Search" },
      { id: "search-semantic", title: "Semantic Search" },
      { id: "search-hybrid", title: "Hybrid Search" },
    ],
  },
  {
    id: "auth",
    title: "Authentication",
    icon: <Shield className="h-4 w-4" />,
    subsections: [
      { id: "auth-workos", title: "WorkOS AuthKit" },
      { id: "auth-api-keys", title: "API Keys" },
    ],
  },
  {
    id: "hosting",
    title: "Hosting & Deploy",
    icon: <Cloud className="h-4 w-4" />,
    subsections: [
      { id: "hosting-convex", title: "Convex Backend" },
      { id: "hosting-netlify", title: "Netlify Frontend" },
      { id: "hosting-env", title: "Environment Variables" },
    ],
  },
  {
    id: "fork",
    title: "Fork & Self-Host",
    icon: <Github className="h-4 w-4" />,
    subsections: [
      { id: "fork-repo", title: "Clone Repository" },
      { id: "fork-setup", title: "Setup Steps" },
      { id: "fork-customize", title: "Customization" },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: <HelpCircle className="h-4 w-4" />,
  },
  {
    id: "faq",
    title: "FAQ",
    icon: <BookOpen className="h-4 w-4" />,
  },
];

// Copy button component
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded transition-colors",
        t.bgHover,
        t.textSubtle,
        className,
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// Code block with copy functionality
function CodeBlock({ code, title }: { code: string; title?: string }) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  return (
    <div className={cn("rounded-lg border overflow-hidden", t.border)}>
      {title && (
        <div
          className={cn(
            "px-3 py-1.5 border-b text-[10px] font-medium uppercase tracking-wider flex items-center justify-between",
            t.border,
            t.bgCard,
            t.textDim,
          )}
        >
          <span>{title}</span>
          <CopyButton text={code} />
        </div>
      )}
      <div className={cn("relative", !title && "group")}>
        <pre
          className={cn(
            "overflow-x-auto p-3 text-xs font-mono",
            t.bgCode,
            t.textMuted,
          )}
        >
          <code>{code}</code>
        </pre>
        {!title && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={code} />
          </div>
        )}
      </div>
    </div>
  );
}

// Section header with anchor
function SectionHeader({
  id,
  title,
  level = 2,
  onCopyMarkdown,
}: {
  id: string;
  title: string;
  level?: 2 | 3;
  onCopyMarkdown?: () => void;
}) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const Tag = level === 2 ? "h2" : "h3";

  return (
    <div className="flex items-center gap-2 group" id={id}>
      <Tag
        className={cn(
          "scroll-mt-20",
          level === 2
            ? cn("text-lg font-semibold", t.textPrimary)
            : cn("text-sm font-medium", t.textSecondary),
        )}
      >
        <a href={`#${id}`} className="hover:underline">
          {title}
        </a>
      </Tag>
      {onCopyMarkdown && (
        <button
          onClick={onCopyMarkdown}
          className={cn(
            "opacity-0 group-hover:opacity-100 p-1 rounded transition-all",
            t.bgHover,
            t.textSubtle,
          )}
          title="Copy section as Markdown"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// Left sidebar navigation
function DocsSidebar({
  activeSection,
  expandedSections,
  onToggleSection,
  onClose,
  isMobile,
}: {
  activeSection: string;
  expandedSections: Set<string>;
  onToggleSection: (id: string) => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        isMobile ? "w-full" : "w-56 shrink-0",
      )}
    >
      {/* Mobile header */}
      {isMobile && (
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-b",
            t.border,
          )}
        >
          <span className={cn("text-sm font-medium", t.textPrimary)}>
            Documentation
          </span>
          <button onClick={onClose} className={cn("p-1 rounded", t.bgHover)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 space-y-1">
        {docSections.map((section) => {
          const isActive =
            activeSection === section.id ||
            section.subsections?.some((s) => activeSection === s.id);
          const isExpanded = expandedSections.has(section.id);

          return (
            <div key={section.id}>
              <button
                onClick={() => {
                  if (section.subsections) {
                    onToggleSection(section.id);
                  } else {
                    document
                      .getElementById(section.id)
                      ?.scrollIntoView({ behavior: "smooth" });
                    onClose?.();
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                  isActive
                    ? cn(t.bgActive, t.textPrimary)
                    : cn(t.textMuted, t.bgHover),
                )}
              >
                <span className={t.iconSubtle}>{section.icon}</span>
                <span className="flex-1 text-left">{section.title}</span>
                {section.subsections && (
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  />
                )}
              </button>

              {/* Subsections */}
              {section.subsections && isExpanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {section.subsections.map((sub) => (
                    <a
                      key={sub.id}
                      href={`#${sub.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById(sub.id)
                          ?.scrollIntoView({ behavior: "smooth" });
                        onClose?.();
                      }}
                      className={cn(
                        "block px-2 py-1 rounded text-xs transition-colors",
                        activeSection === sub.id
                          ? cn(t.textPrimary, t.bgActive)
                          : cn(t.textSubtle, t.bgHover),
                      )}
                    >
                      {sub.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Resources */}
      <div className={cn("px-3 py-4 border-t space-y-1", t.border)}>
        <a
          href="https://github.com/waynesutton/opensync"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
            t.textSubtle,
            t.bgHover,
          )}
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
          <ExternalLink className="h-3 w-3 ml-auto" />
        </a>
        <a
          href="https://www.npmjs.com/package/opencode-sync-plugin"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
            t.textSubtle,
            t.bgHover,
          )}
        >
          <Package className="h-3.5 w-3.5" />
          npm
          <ExternalLink className="h-3 w-3 ml-auto" />
        </a>
        <Link
          to="/updates"
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
            t.textSubtle,
            t.bgHover,
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          Updates
        </Link>
      </div>
    </div>
  );
}

// Right sidebar table of contents
function TableOfContents({
  activeSection,
  sections,
}: {
  activeSection: string;
  sections: { id: string; title: string; level: number }[];
}) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  if (sections.length === 0) return null;

  return (
    <div className="w-48 shrink-0 hidden xl:block">
      <div className="sticky top-20">
        <p
          className={cn(
            "text-[10px] font-medium uppercase tracking-wider mb-3",
            t.textDim,
          )}
        >
          On this page
        </p>
        <nav className="space-y-1">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(section.id)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "block text-xs transition-colors py-0.5",
                section.level === 3 && "pl-3",
                activeSection === section.id
                  ? t.textPrimary
                  : cn(t.textSubtle, "hover:opacity-80"),
              )}
            >
              {section.title}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

// FAQ item component
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  return (
    <div className={cn("rounded-lg border", t.border, t.bgCard)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between p-4 text-left transition-colors",
          t.bgHover,
        )}
      >
        <span className={cn("text-sm font-medium", t.textSecondary)}>
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            t.textSubtle,
            isOpen ? "rotate-180" : "",
          )}
        />
      </button>
      {isOpen && (
        <div className={cn("border-t px-4 pb-4 pt-3", t.border)}>
          <p className={cn("text-xs leading-relaxed", t.textSubtle)}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

// Main docs page
export function DocsPage() {
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  // State
  const [activeSection, setActiveSection] = useState("hosted");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["hosted", "quickstart", "dashboard", "api"]),
  );
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMarkdownView, setShowMarkdownView] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Get Convex URL for examples
  const convexUrl =
    import.meta.env.VITE_CONVEX_URL?.replace(".cloud", ".site") ||
    "https://your-app.convex.site";
  const convexCloudUrl =
    import.meta.env.VITE_CONVEX_URL || "https://your-app.convex.cloud";

  // Toggle section expansion
  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedSections(next);
  };

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" },
    );

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Handle hash navigation
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  // Generate full markdown content
  const generateFullMarkdown = useMemo(() => {
    return `# OpenSync Documentation

## Use the Hosted Version

The fastest way to get started. Sign in at https://www.opensync.dev/, install a plugin locally, and start syncing in under 2 minutes.

### Features

- **Sync** - Sessions sync from CLI to cloud automatically as you work
- **Search** - Full-text and semantic search across all sessions
- **Private** - Your data stays in your account, secured by WorkOS
- **Export** - Export for evals in DeepEval, OpenAI, or plain text formats
- **Delete** - Your control. Delete sessions or your entire account anytime.
- **API** - Use the REST API for RAG, context injection, and integrations

### Install Plugins Locally

For OpenCode:
\`\`\`bash
npm install -g opencode-sync-plugin
\`\`\`

For Claude Code:
\`\`\`bash
npm install -g claude-code-sync
\`\`\`

For Codex CLI:
\`\`\`bash
npm install -g codex-sync
\`\`\`

For Cursor:
\`\`\`bash
npm install -g cursor-sync-plugin
\`\`\`

### Login and Sync

1. Sign in at https://www.opensync.dev
2. Go to Settings and click Generate API Key
3. Run the login command:

\`\`\`bash
opencode-sync login
# or
claude-code-sync login
# or
codex-sync login
# or
cursor-sync login
\`\`\`

4. Enter the Convex URL and API key when prompted
5. Start coding. Sessions sync automatically.

**Hosted Convex URL:** \`https://polished-penguin-622.convex.cloud\`

---

## Requirements for Self-Hosting

These requirements are only for self-hosting your own OpenSync instance. To use the hosted version at opensync.dev, you only need Node.js to install the plugins locally.

### Option A: Cloud Deployment (Convex Cloud)

Use Convex Cloud for a managed backend with automatic scaling and zero infrastructure management.

**Requirements:**
- Node.js 18 or later
- npm or bun package manager
- Convex account (free at convex.dev)
- WorkOS account (free at workos.com)
- Optional: OpenAI API key for semantic search

### Option B: 100% Local Deployment

Run OpenSync entirely on your machine. No cloud services required. Your data never leaves your computer.

**Requirements:**
- Docker (for local Convex backend)
- Node.js 18 or later
- npm or bun package manager
- Optional: OpenAI API key (can run without it)

**Step 1: Start Local Convex Backend**
\`\`\`bash
npx convex dev --local
\`\`\`
This starts a local Convex instance at http://127.0.0.1:3210.

**Step 2: Configure Local Environment**
\`\`\`bash
# .env.local
VITE_CONVEX_URL=http://127.0.0.1:3210
VITE_WORKOS_CLIENT_ID=client_local_dev
VITE_REDIRECT_URI=http://localhost:5173/callback
\`\`\`

**Step 3: Deploy and Run**
\`\`\`bash
npx convex deploy --local
npm run dev
\`\`\`

**Step 4: Configure Plugin**
\`\`\`bash
opencode-sync login
# Enter: http://127.0.0.1:3210 as the Convex URL
\`\`\`

For more details, see https://docs.convex.dev/cli/local-deployments

## Quick Start

### 1. Deploy Your Backend

\`\`\`bash
# Clone the repo
git clone https://github.com/waynesutton/opensync.git
cd opensync

# Install dependencies
npm install

# Deploy to Convex
npx convex dev
\`\`\`

### 2. Get Your API Key

1. Log into your OpenSync dashboard via WorkOS
2. Go to Settings
3. Click Generate API Key
4. Copy the key (starts with \`osk_\`)

### 3. Install a Plugin

For OpenCode:
\`\`\`bash
npm install -g opencode-sync-plugin
opencode-sync login
\`\`\`

For Claude Code:
\`\`\`bash
npm install -g claude-code-sync
claude-code-sync login
\`\`\`

For Codex CLI:
\`\`\`bash
npm install -g codex-sync
codex-sync login
\`\`\`

For Cursor:
\`\`\`bash
npm install -g cursor-sync-plugin
cursor-sync login
\`\`\`

## Dashboard Features

### Overview
The Overview tab shows key metrics: total sessions, tokens, cost, duration, models, and projects. Charts display usage trends over 30 days.

### Sessions View
Browse all synced sessions with sorting, filtering, and source badges (OC for OpenCode, CC for Claude Code, CX for Codex CLI, CR for Cursor). Click a session to view full conversation history.

### Evals Export
Mark sessions as eval-ready for export. Supports DeepEval JSON, OpenAI JSONL, and Filesystem formats for training and evaluation.

### Analytics
Detailed breakdowns by model, provider, and project. Efficiency metrics like cost per session, tokens per message, and prompt/completion ratios.

### Context Search
Full-text search across all sessions and messages. Use for RAG pipelines and context engineering.

## OpenCode Plugin

### Installation
\`\`\`bash
npm install -g opencode-sync-plugin
\`\`\`

### Configuration
\`\`\`bash
opencode-sync login
\`\`\`

Add to your opencode.json:
\`\`\`json
{
  "plugin": ["opencode-sync-plugin"]
}
\`\`\`

### Commands
- \`opencode-sync login\` - Authenticate with the backend
- \`opencode-sync status\` - Check sync status and configuration
- \`opencode-sync sync\` - Manually sync current session

## Claude Code Plugin

### Installation
\`\`\`bash
npm install -g claude-code-sync
\`\`\`

### Configuration
Create \`~/.config/claude-code-sync/config.json\`:
\`\`\`json
{
  "convexUrl": "${convexCloudUrl}",
  "apiKey": "osk_your_api_key"
}
\`\`\`

### Commands
- \`claude-code-sync login\` - Authenticate with the backend
- \`claude-code-sync status\` - Check sync status
- \`claude-code-sync sync\` - Manual sync

## API Reference

All endpoints require authentication via Bearer token (API key or JWT).

### Sessions
\`\`\`bash
curl "${convexUrl}/api/sessions" \\
  -H "Authorization: Bearer osk_your_api_key"
\`\`\`

### Search
\`\`\`bash
curl "${convexUrl}/api/search?q=authentication&type=semantic" \\
  -H "Authorization: Bearer osk_your_api_key"
\`\`\`

### Context
\`\`\`bash
curl "${convexUrl}/api/context?q=react+hooks&format=text&limit=5" \\
  -H "Authorization: Bearer osk_your_api_key"
\`\`\`

### Export
\`\`\`bash
curl "${convexUrl}/api/export?id=session_id&format=markdown" \\
  -H "Authorization: Bearer osk_your_api_key"
\`\`\`

## Search Types

### Full-Text Search
Keyword matching. Fast and exact. Use \`?type=fulltext\`

### Semantic Search
Meaning-based search using embeddings. Use \`?type=semantic\`

### Hybrid Search
Combines both methods using RRF. Use \`?type=hybrid\`

## Authentication

### WorkOS AuthKit
The web dashboard uses WorkOS for enterprise authentication with SSO support.

### API Keys
Plugins use API keys (osk_*) for authentication. Generate in Settings.

## Hosting

### Convex Backend
Deploy to Convex for real-time database with built-in search:
\`\`\`bash
npx convex deploy
\`\`\`

### Netlify Frontend
Deploy the React frontend to Netlify with environment variables:
- VITE_CONVEX_URL
- VITE_WORKOS_CLIENT_ID

## Fork & Self-Host

### Clone Repository
\`\`\`bash
git clone https://github.com/waynesutton/opensync.git
cd opensync
npm install
\`\`\`

### Setup Steps
1. Create a Convex project at convex.dev
2. Create a WorkOS account and configure AuthKit
3. Set environment variables
4. Deploy with \`npx convex deploy\`
5. Deploy frontend to Netlify or Vercel

## Resources

- GitHub: https://github.com/waynesutton/opensync
- OpenCode Plugin: https://www.npmjs.com/package/opencode-sync-plugin
- Claude Code Plugin: https://www.npmjs.com/package/claude-code-sync
- Codex CLI Plugin: https://www.npmjs.com/package/codex-sync
- Cursor Plugin: https://www.npmjs.com/package/cursor-sync-plugin
- Convex Docs: https://docs.convex.dev
- WorkOS Docs: https://workos.com/docs
`;
  }, [convexUrl, convexCloudUrl]);

  // Copy section markdown
  const copySectionMarkdown = async (sectionId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Copy full page markdown
  const copyFullMarkdown = async () => {
    await navigator.clipboard.writeText(generateFullMarkdown);
    setCopiedSection("full");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Current page sections for table of contents
  const currentSections = useMemo(() => {
    const sections: { id: string; title: string; level: number }[] = [];
    docSections.forEach((section) => {
      sections.push({ id: section.id, title: section.title, level: 2 });
      section.subsections?.forEach((sub) => {
        sections.push({ id: sub.id, title: sub.title, level: 3 });
      });
    });
    return sections;
  }, []);

  // Markdown view modal
  if (showMarkdownView) {
    return (
      <div className={cn("min-h-screen", t.bgPrimary)}>
        <header
          className={cn(
            "sticky top-0 z-10 border-b backdrop-blur-sm",
            t.border,
            theme === "dark" ? "bg-[#0E0E0E]/90" : "bg-[#faf8f5]/90",
          )}
        >
          <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-6">
            <button
              onClick={() => setShowMarkdownView(false)}
              className={cn(
                "flex items-center gap-2 text-sm transition-colors",
                t.textSubtle,
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to docs
            </button>
            <span className={cn("text-sm font-medium", t.textMuted)}>
              Markdown View
            </span>
            <CopyButton text={generateFullMarkdown} />
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-8">
          <pre
            className={cn(
              "whitespace-pre-wrap text-xs font-mono p-6 rounded-lg border",
              t.bgCard,
              t.border,
              t.textMuted,
            )}
          >
            {generateFullMarkdown}
          </pre>
        </main>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex", t.bgPrimary, t.textPrimary)}>
      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-72 shadow-xl",
              t.bgPrimary,
            )}
          >
            <DocsSidebar
              activeSection={activeSection}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              onClose={() => setShowMobileSidebar(false)}
              isMobile
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col border-r sticky top-0 h-screen",
          t.border,
        )}
      >
        <div
          className={cn("px-4 py-3 border-b flex items-center gap-2", t.border)}
        >
          <Link
            to="/"
            className={cn("text-sm font-medium transition-colors", t.textMuted)}
          >
            opensync
          </Link>
          <span className={cn("text-xs", t.textDim)}>/</span>
          <span className={cn("text-xs", t.textSubtle)}>docs</span>
        </div>
        <DocsSidebar
          activeSection={activeSection}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className={cn(
            "sticky top-0 z-10 border-b backdrop-blur-sm",
            t.border,
            theme === "dark" ? "bg-[#0E0E0E]/90" : "bg-[#faf8f5]/90",
          )}
        >
          <div className="flex h-12 items-center justify-between px-4 lg:px-6 gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                className={cn("p-1.5 rounded lg:hidden", t.bgHover)}
              >
                <Menu className="h-4 w-4" />
              </button>
              <Link
                to="/"
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors lg:hidden",
                  t.textSubtle,
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                back
              </Link>
            </div>

            {/* Search - centered and flexible width (desktop) */}
            <div className="flex-1 max-w-md hidden sm:block">
              <DocSearch />
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile search button - opens sidebar with search */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                className={cn(
                  "p-1.5 rounded sm:hidden",
                  t.bgHover,
                  t.textSubtle,
                )}
                title="Search docs"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* View as markdown */}
              <button
                onClick={() => setShowMarkdownView(true)}
                className={cn(
                  "hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                  t.textSubtle,
                  t.bgHover,
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                View as Markdown
              </button>

              {/* Copy full markdown */}
              <button
                onClick={copyFullMarkdown}
                className={cn(
                  "hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                  t.textSubtle,
                  t.bgHover,
                )}
              >
                {copiedSection === "full" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy Markdown
              </button>

              {/* Updates link */}
              <Link
                to="/updates"
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                  t.textSubtle,
                  t.bgHover,
                )}
                title="GitHub Updates"
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Updates</span>
              </Link>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  t.textSubtle,
                  t.bgHover,
                )}
                title={
                  theme === "dark"
                    ? "Switch to tan mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content area with right sidebar */}
        <div className="flex-1 flex">
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto scrollbar-hide px-4 lg:px-8 py-8 max-w-4xl"
          >
            {/* Hero */}
            <div className="mb-12">
              <h1 className={cn("text-3xl font-bold mb-4", t.textPrimary)}>
                OpenSync Documentation
              </h1>
              <p className={cn("text-base leading-relaxed", t.textMuted)}>
                Sync, search, and share your AI coding sessions from{" "}
                <a
                  href="https://opencode.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("underline", t.interactive)}
                >
                  OpenCode
                </a>{" "}
                and{" "}
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("underline", t.interactive)}
                >
                  Claude Code
                </a>
                . Cloud-synced dashboards that track session activity, tool
                usage, and token spend across projects.
              </p>

              {/* Quick links */}
              <div className="flex flex-wrap gap-2 mt-6">
                <a
                  href="https://github.com/waynesutton/opensync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    t.border,
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/opencode-sync-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    t.border,
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  <Package className="h-3.5 w-3.5" />
                  opencode-sync-plugin
                </a>
                <a
                  href="https://www.npmjs.com/package/claude-code-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    t.border,
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  <Package className="h-3.5 w-3.5" />
                  claude-code-sync
                </a>
                <a
                  href="https://www.npmjs.com/package/codex-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    t.border,
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  <Package className="h-3.5 w-3.5" />
                  codex-sync
                </a>
                <a
                  href="https://www.npmjs.com/package/cursor-sync-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    t.border,
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  <Package className="h-3.5 w-3.5" />
                  cursor-sync-plugin
                </a>
                <a
                  href="https://www.opensync.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    t.border,
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  opensync.dev
                </a>
              </div>
            </div>

            {/* Use Hosted Version Section */}
            <section id="hosted" data-section className="mb-12">
              <SectionHeader
                id="hosted"
                title="Use the Hosted Version"
                onCopyMarkdown={() =>
                  copySectionMarkdown(
                    "hosted",
                    `## Use the Hosted Version\n\nStart syncing sessions in under 2 minutes with https://www.opensync.dev/\n\n### Install Plugins\n\`\`\`bash\nnpm install -g opencode-sync-plugin\nnpm install -g claude-code-sync\nnpm install -g codex-sync\n\`\`\`\n\n### Login and Sync\n1. Sign in at opensync.dev\n2. Generate an API key in Settings\n3. Run \`opencode-sync login\` or \`claude-code-sync login\` or \`codex-sync login\`\n4. Start coding, sessions sync automatically`,
                  )
                }
              />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                The fastest way to get started. Sign in at{" "}
                <a
                  href="https://www.opensync.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("underline", t.interactive)}
                >
                  opensync.dev
                </a>
                , install a plugin locally, and start syncing in under 2
                minutes.
              </p>

              <div className="mt-6 space-y-6">
                {/* Features */}
                <div id="hosted-features" data-section>
                  <SectionHeader
                    id="hosted-features"
                    title="Features"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 grid gap-3 sm:grid-cols-2",
                      t.textMuted,
                    )}
                  >
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-xs",
                          theme === "dark"
                            ? "text-[#c586c0]"
                            : "text-[#9b4d96]",
                        )}
                      >
                        Sync
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Sessions sync from CLI to cloud automatically as you
                        work
                      </p>
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-xs",
                          theme === "dark"
                            ? "text-[#dcdcaa]"
                            : "text-[#8b7355]",
                        )}
                      >
                        Search
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Full-text and semantic search across all sessions
                      </p>
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-xs",
                          theme === "dark"
                            ? "text-[#ce9178]"
                            : "text-[#a05d3b]",
                        )}
                      >
                        Private
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Your data stays in your account, secured by WorkOS
                      </p>
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-xs",
                          theme === "dark"
                            ? "text-[#9cdcfe]"
                            : "text-[#3d7ea6]",
                        )}
                      >
                        Export
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Export for evals in DeepEval, OpenAI, or plain text
                        formats
                      </p>
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <span className="font-mono text-xs text-[#EB5601]">
                        Delete
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Your control. Delete sessions or your entire account
                        anytime.
                      </p>
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-xs",
                          theme === "dark"
                            ? "text-emerald-400"
                            : "text-emerald-600",
                        )}
                      >
                        API
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Use the REST API for RAG, context injection, and
                        integrations
                      </p>
                    </div>
                  </div>
                </div>

                {/* Install Plugins */}
                <div id="hosted-install" data-section>
                  <SectionHeader
                    id="hosted-install"
                    title="Install Plugins Locally"
                    level={3}
                  />
                  <p className={cn("mt-2 text-xs", t.textSubtle)}>
                    Install one or both plugins globally. They run on your
                    machine and sync to the hosted dashboard.
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {/* OpenCode */}
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-blue-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-blue-400">
                            OC
                          </span>
                        </div>
                        <span
                          className={cn("text-sm font-medium", t.textSecondary)}
                        >
                          OpenCode
                        </span>
                        <a
                          href="https://www.npmjs.com/package/opencode-sync-plugin"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("ml-auto text-[10px]", t.textDim)}
                        >
                          npm
                        </a>
                      </div>
                      <CodeBlock code="npm install -g opencode-sync-plugin" />
                    </div>

                    {/* Claude Code */}
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-amber-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-amber-500">
                            CC
                          </span>
                        </div>
                        <span
                          className={cn("text-sm font-medium", t.textSecondary)}
                        >
                          Claude Code
                        </span>
                        <a
                          href="https://www.npmjs.com/package/claude-code-sync"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("ml-auto text-[10px]", t.textDim)}
                        >
                          npm
                        </a>
                      </div>
                      <CodeBlock code="npm install -g claude-code-sync" />
                    </div>

                    {/* Codex CLI */}
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-purple-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-purple-400">
                            CX
                          </span>
                        </div>
                        <span
                          className={cn("text-sm font-medium", t.textSecondary)}
                        >
                          Codex CLI
                        </span>
                        <a
                          href="https://www.npmjs.com/package/codex-sync"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("ml-auto text-[10px]", t.textDim)}
                        >
                          npm
                        </a>
                      </div>
                      <CodeBlock code="npm install -g codex-sync" />
                    </div>

                    {/* Cursor */}
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-violet-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-violet-400">
                            CR
                          </span>
                        </div>
                        <span
                          className={cn("text-sm font-medium", t.textSecondary)}
                        >
                          Cursor
                        </span>
                        <a
                          href="https://www.npmjs.com/package/cursor-sync-plugin"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("ml-auto text-[10px]", t.textDim)}
                        >
                          npm
                        </a>
                      </div>
                      <CodeBlock code="npm install -g cursor-sync-plugin" />
                    </div>
                  </div>
                </div>

                {/* Login and Sync */}
                <div id="hosted-login" data-section>
                  <SectionHeader
                    id="hosted-login"
                    title="Login and Sync"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 p-4 rounded-lg border",
                      t.bgCard,
                      t.border,
                    )}
                  >
                    <ol
                      className={cn(
                        "space-y-3 text-sm list-decimal list-inside",
                        t.textMuted,
                      )}
                    >
                      <li>
                        Sign in at{" "}
                        <a
                          href="https://www.opensync.dev"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={t.interactive}
                        >
                          opensync.dev
                        </a>
                      </li>
                      <li>
                        Go to <strong>Settings</strong> and click{" "}
                        <strong>Generate API Key</strong>
                      </li>
                      <li>
                        Run the login command:
                        <div className="mt-2 space-y-2 pl-4">
                          <CodeBlock code="opencode-sync login" />
                          <p className={cn("text-xs text-center", t.textDim)}>
                            or
                          </p>
                          <CodeBlock code="claude-code-sync login" />
                          <p className={cn("text-xs text-center", t.textDim)}>
                            or
                          </p>
                          <CodeBlock code="codex-sync login" />
                          <p className={cn("text-xs text-center", t.textDim)}>
                            or
                          </p>
                          <CodeBlock code="cursor-sync login" />
                        </div>
                      </li>
                      <li>
                        Enter the <strong>Convex URL</strong> and{" "}
                        <strong>API key</strong> when prompted
                      </li>
                      <li>Start coding. Sessions sync automatically.</li>
                    </ol>
                  </div>
                  <div
                    className={cn(
                      "mt-4 p-3 rounded-lg border",
                      t.bgCode,
                      t.border,
                    )}
                  >
                    <p className={cn("text-xs", t.textSubtle)}>
                      <strong className={t.textMuted}>
                        Hosted Convex URL:
                      </strong>{" "}
                      <code className={cn("px-1 rounded", t.bgCard)}>
                        https://polished-penguin-622.convex.cloud
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Requirements Section */}
            <section id="requirements" data-section className="mb-12">
              <SectionHeader
                id="requirements"
                title="Requirements for Self-Hosting"
                onCopyMarkdown={() =>
                  copySectionMarkdown(
                    "requirements",
                    `## Requirements for Self-Hosting\n\nTwo options: Cloud (Convex Cloud) or 100% Local (Docker-based).\n\n### Cloud Deployment\n- Node.js 18+\n- Convex account (free)\n- WorkOS account (free)\n- Optional: OpenAI API key\n\n### 100% Local Deployment\n- Docker\n- Node.js 18+\n- No cloud accounts needed`,
                  )
                }
              />
              <div
                className={cn("mt-3 p-3 rounded-lg border", t.bgCode, t.border)}
              >
                <p className={cn("text-xs", t.textSubtle)}>
                  These requirements are only for self-hosting your own OpenSync
                  instance. To use the hosted version at{" "}
                  <a
                    href="https://www.opensync.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={t.interactive}
                  >
                    opensync.dev
                  </a>
                  , you only need Node.js to install the plugins locally.
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {/* Cloud Deployment */}
                <div id="requirements-cloud" data-section>
                  <SectionHeader
                    id="requirements-cloud"
                    title="Option A: Cloud Deployment"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Use Convex Cloud for a managed backend with automatic
                    scaling and zero infrastructure management.
                  </p>
                  <div
                    className={cn(
                      "mt-3 p-4 rounded-lg border",
                      t.bgCard,
                      t.border,
                    )}
                  >
                    <ul className={cn("space-y-2 text-sm", t.textMuted)}>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        Node.js 18 or later
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        npm or bun package manager
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <a
                          href="https://convex.dev"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("underline", t.interactive)}
                        >
                          Convex account
                        </a>{" "}
                        (free tier available)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <a
                          href="https://workos.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("underline", t.interactive)}
                        >
                          WorkOS account
                        </a>{" "}
                        (free tier available)
                      </li>
                      <li className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs px-1.5 rounded",
                            t.bgCode,
                            t.textDim,
                          )}
                        >
                          optional
                        </span>
                        OpenAI API key for semantic search
                      </li>
                    </ul>
                  </div>
                </div>

                {/* 100% Local Deployment */}
                <div id="requirements-local" data-section>
                  <SectionHeader
                    id="requirements-local"
                    title="Option B: 100% Local Deployment"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Run OpenSync entirely on your machine. No cloud services
                    required. Your data never leaves your computer.
                  </p>
                  <div
                    className={cn(
                      "mt-3 p-4 rounded-lg border",
                      t.bgCard,
                      t.border,
                    )}
                  >
                    <ul className={cn("space-y-2 text-sm", t.textMuted)}>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <a
                          href="https://docker.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("underline", t.interactive)}
                        >
                          Docker
                        </a>{" "}
                        (for local Convex backend)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        Node.js 18 or later
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        npm or bun package manager
                      </li>
                      <li className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs px-1.5 rounded",
                            t.bgCode,
                            t.textDim,
                          )}
                        >
                          optional
                        </span>
                        OpenAI API key for semantic search (can run without it)
                      </li>
                    </ul>
                  </div>

                  <div
                    className={cn(
                      "mt-4 p-4 rounded-lg border",
                      t.bgCode,
                      t.border,
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium mb-3",
                        t.textSecondary,
                      )}
                    >
                      Step 1: Start Local Convex Backend
                    </p>
                    <CodeBlock
                      code={`# Start the local Convex backend (requires Docker)
npx convex dev --local`}
                    />
                    <p className={cn("mt-3 text-xs", t.textSubtle)}>
                      This starts a local Convex instance at{" "}
                      <code className={cn("px-1 rounded", t.bgCard)}>
                        http://127.0.0.1:3210
                      </code>
                      . No Convex Cloud account needed.
                    </p>
                  </div>

                  <div
                    className={cn(
                      "mt-4 p-4 rounded-lg border",
                      t.bgCode,
                      t.border,
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium mb-3",
                        t.textSecondary,
                      )}
                    >
                      Step 2: Configure Local Environment
                    </p>
                    <CodeBlock
                      code={`# .env.local
VITE_CONVEX_URL=http://127.0.0.1:3210
VITE_WORKOS_CLIENT_ID=client_local_dev
VITE_REDIRECT_URI=http://localhost:5173/callback`}
                      title=".env.local"
                    />
                  </div>

                  <div
                    className={cn(
                      "mt-4 p-4 rounded-lg border",
                      t.bgCode,
                      t.border,
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium mb-3",
                        t.textSecondary,
                      )}
                    >
                      Step 3: Deploy Schema and Run
                    </p>
                    <CodeBlock
                      code={`# Deploy schema to local backend
npx convex deploy --local

# Start the web UI
npm run dev`}
                    />
                  </div>

                  <div
                    className={cn(
                      "mt-4 p-4 rounded-lg border",
                      t.bgCode,
                      t.border,
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium mb-3",
                        t.textSecondary,
                      )}
                    >
                      Step 4: Configure Plugin for Local Backend
                    </p>
                    <CodeBlock
                      code={`opencode-sync login
# Enter: http://127.0.0.1:3210 as the Convex URL
# Generate an API key from the local dashboard`}
                    />
                  </div>

                  <div
                    className={cn(
                      "mt-4 p-4 rounded-lg border border-amber-800/50 bg-amber-900/20",
                      t.border,
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium mb-2",
                        theme === "dark" ? "text-amber-200" : "text-amber-800",
                      )}
                    >
                      Local Deployment Notes
                    </p>
                    <ul
                      className={cn(
                        "space-y-1 text-xs list-disc list-inside",
                        theme === "dark"
                          ? "text-amber-400/70"
                          : "text-amber-600",
                      )}
                    >
                      <li>
                        Authentication: Bypass WorkOS for local dev or use
                        WorkOS staging
                      </li>
                      <li>
                        Data persistence: Local Convex stores data in Docker
                        volumes
                      </li>
                      <li>
                        Fully offline: Once set up, the entire stack runs
                        without internet
                      </li>
                      <li>
                        Disable semantic search by removing OpenAI calls for
                        100% offline operation
                      </li>
                    </ul>
                    <div className="mt-3">
                      <a
                        href="https://docs.convex.dev/cli/local-deployments"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "text-xs flex items-center gap-1",
                          theme === "dark"
                            ? "text-amber-300"
                            : "text-amber-700",
                        )}
                      >
                        Convex Local Deployments docs
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Start Section */}
            <section id="quickstart" data-section className="mb-12">
              <SectionHeader
                id="quickstart"
                title="Quick Start"
                onCopyMarkdown={() =>
                  copySectionMarkdown(
                    "quickstart",
                    `## Quick Start\n\n### Deploy Backend\n\`\`\`bash\ngit clone https://github.com/waynesutton/opensync.git\ncd opensync\nnpm install\nnpx convex dev\n\`\`\``,
                  )
                }
              />

              <div className="mt-6 space-y-6">
                <div id="quickstart-deploy" data-section>
                  <SectionHeader
                    id="quickstart-deploy"
                    title="1. Deploy Your Backend"
                    level={3}
                  />
                  <div className="mt-3 space-y-3">
                    <CodeBlock
                      code={`# Clone the repo
git clone https://github.com/waynesutton/opensync.git
cd opensync

# Install dependencies
npm install

# Deploy to Convex
npx convex dev`}
                      title="Terminal"
                    />
                    <p className={cn("text-xs", t.textSubtle)}>
                      This starts the Convex development server and deploys your
                      backend. Keep it running during development.
                    </p>
                  </div>
                </div>

                <div id="quickstart-api-key" data-section>
                  <SectionHeader
                    id="quickstart-api-key"
                    title="2. Get Your API Key"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 p-4 rounded-lg border",
                      t.bgCard,
                      t.border,
                    )}
                  >
                    <ol
                      className={cn(
                        "space-y-2 text-sm list-decimal list-inside",
                        t.textMuted,
                      )}
                    >
                      <li>Log into your OpenSync dashboard via WorkOS</li>
                      <li>
                        Go to <strong>Settings</strong>
                      </li>
                      <li>
                        Click <strong>Generate API Key</strong>
                      </li>
                      <li>
                        Copy the key (starts with{" "}
                        <code className={cn("px-1 rounded text-xs", t.bgCode)}>
                          osk_
                        </code>
                        )
                      </li>
                    </ol>
                  </div>
                </div>

                <div id="quickstart-plugin" data-section>
                  <SectionHeader
                    id="quickstart-plugin"
                    title="3. Install a Plugin"
                    level={3}
                  />
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {/* OpenCode */}
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-blue-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-blue-400">
                            OC
                          </span>
                        </div>
                        <span
                          className={cn("text-sm font-medium", t.textSecondary)}
                        >
                          OpenCode
                        </span>
                      </div>
                      <CodeBlock code="npm install -g opencode-sync-plugin" />
                      <p className={cn("mt-2 text-xs", t.textDim)}>
                        Then run{" "}
                        <code className={cn("px-1 rounded", t.bgCode)}>
                          opencode-sync login
                        </code>
                      </p>
                    </div>

                    {/* Claude Code */}
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-amber-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-amber-500">
                            CC
                          </span>
                        </div>
                        <span
                          className={cn("text-sm font-medium", t.textSecondary)}
                        >
                          Claude Code
                        </span>
                      </div>
                      <CodeBlock code="npm install -g claude-code-sync" />
                      <p className={cn("mt-2 text-xs", t.textDim)}>
                        Then run{" "}
                        <code className={cn("px-1 rounded", t.bgCode)}>
                          claude-code-sync login
                        </code>
                      </p>
                    </div>

                    {/* Codex CLI */}
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-purple-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-purple-400">
                            CX
                          </span>
                        </div>
                        <span
                          className={cn("text-sm font-medium", t.textSecondary)}
                        >
                          Codex CLI
                        </span>
                      </div>
                      <CodeBlock code="npm install -g codex-sync" />
                      <p className={cn("mt-2 text-xs", t.textDim)}>
                        Then run{" "}
                        <code className={cn("px-1 rounded", t.bgCode)}>
                          codex-sync login
                        </code>
                      </p>
                    </div>

                    {/* Cursor */}
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        t.bgCard,
                        t.border,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-violet-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-violet-400">
                            CR
                          </span>
                        </div>
                        <span
                          className={cn("text-sm font-medium", t.textSecondary)}
                        >
                          Cursor
                        </span>
                      </div>
                      <CodeBlock code="npm install -g cursor-sync-plugin" />
                      <p className={cn("mt-2 text-xs", t.textDim)}>
                        Then run{" "}
                        <code className={cn("px-1 rounded", t.bgCode)}>
                          cursor-sync login
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Dashboard Features */}
            <section id="dashboard" data-section className="mb-12">
              <SectionHeader id="dashboard" title="Dashboard Features" />

              <div className="mt-6 space-y-6">
                <div id="dashboard-overview" data-section>
                  <SectionHeader
                    id="dashboard-overview"
                    title="Overview"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    The Overview tab shows key metrics at a glance: total
                    sessions, tokens used, total cost, duration, models, and
                    projects. Interactive charts display usage trends over the
                    last 30 days with breakdowns by model and project.
                  </p>
                </div>

                <div id="dashboard-sessions" data-section>
                  <SectionHeader
                    id="dashboard-sessions"
                    title="Sessions View"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Browse all synced sessions with sorting and filtering.
                    Source badges show OC (OpenCode), CC (Claude Code), CX
                    (Codex CLI), or CR (Cursor) origin. List view shows token count, cost, and
                    duration. Timeline view displays sessions chronologically
                    grouped by project.
                  </p>
                </div>

                <div id="dashboard-evals" data-section>
                  <SectionHeader
                    id="dashboard-evals"
                    title="Evals Export"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Mark sessions as eval-ready to build training datasets.
                    Export in multiple formats:
                  </p>
                  <ul
                    className={cn(
                      "mt-2 space-y-1 text-sm list-disc list-inside",
                      t.textSubtle,
                    )}
                  >
                    <li>
                      <strong>DeepEval JSON</strong> - For DeepEval framework
                    </li>
                    <li>
                      <strong>OpenAI JSONL</strong> - For OpenAI Evals and
                      fine-tuning
                    </li>
                    <li>
                      <strong>Filesystem</strong> - Plain text files for custom
                      pipelines
                    </li>
                  </ul>
                </div>

                <div id="dashboard-analytics" data-section>
                  <SectionHeader
                    id="dashboard-analytics"
                    title="Analytics"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Detailed breakdowns by model, provider, and project. View
                    efficiency metrics like cost per session, tokens per
                    message, and prompt/completion ratios. Filter and sort the
                    projects table to identify high-usage areas.
                  </p>
                </div>

                <div id="dashboard-context" data-section>
                  <SectionHeader
                    id="dashboard-context"
                    title="Context Search"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Full-text search across all sessions and messages. Results
                    are paginated and can be used for RAG pipelines and context
                    engineering. No OpenAI key required for basic full-text
                    search.
                  </p>
                </div>
              </div>
            </section>

            {/* OpenCode Plugin */}
            <section id="opencode-plugin" data-section className="mb-12">
              <SectionHeader id="opencode-plugin" title="OpenCode Plugin" />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                Sync your{" "}
                <a
                  href="https://opencode.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("underline", t.interactive)}
                >
                  OpenCode
                </a>{" "}
                sessions to the OpenSync dashboard automatically.
              </p>

              <div className="mt-6 space-y-6">
                <div id="opencode-install" data-section>
                  <SectionHeader
                    id="opencode-install"
                    title="Installation"
                    level={3}
                  />
                  <div className="mt-3">
                    <CodeBlock code="npm install -g opencode-sync-plugin" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="https://github.com/waynesutton/opencode-sync-plugin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        t.interactive,
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
                        "flex items-center gap-1 text-xs",
                        t.interactive,
                      )}
                    >
                      <Package className="h-3 w-3" />
                      npm
                    </a>
                  </div>
                </div>

                <div id="opencode-config" data-section>
                  <SectionHeader
                    id="opencode-config"
                    title="Configuration"
                    level={3}
                  />
                  <div className="mt-3 space-y-3">
                    <CodeBlock
                      code="opencode-sync login"
                      title="Authenticate"
                    />
                    <p className={cn("text-xs", t.textSubtle)}>
                      Enter your Convex URL ({convexCloudUrl}) and API key when
                      prompted.
                    </p>
                    <CodeBlock
                      code={`{
  "plugin": ["opencode-sync-plugin"]
}`}
                      title="opencode.json"
                    />
                  </div>
                </div>

                <div id="opencode-commands" data-section>
                  <SectionHeader
                    id="opencode-commands"
                    title="Commands"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border overflow-hidden",
                      t.border,
                    )}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", t.border, t.bgCard)}>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Command
                          </th>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className={t.textSubtle}>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              opencode-sync login
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Authenticate with the backend
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              opencode-sync status
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Check sync status and configuration
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              opencode-sync sync
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Manually sync current session
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Claude Code Plugin */}
            <section id="claude-plugin" data-section className="mb-12">
              <SectionHeader id="claude-plugin" title="Claude Code Plugin" />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                Sync your{" "}
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("underline", t.interactive)}
                >
                  Claude Code
                </a>{" "}
                sessions to the same OpenSync dashboard.
              </p>

              <div className="mt-6 space-y-6">
                <div id="claude-install" data-section>
                  <SectionHeader
                    id="claude-install"
                    title="Installation"
                    level={3}
                  />
                  <div className="mt-3">
                    <CodeBlock code="npm install -g claude-code-sync" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="https://github.com/waynesutton/claude-code-sync"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        t.interactive,
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
                        "flex items-center gap-1 text-xs",
                        t.interactive,
                      )}
                    >
                      <Package className="h-3 w-3" />
                      npm
                    </a>
                  </div>
                </div>

                <div id="claude-config" data-section>
                  <SectionHeader
                    id="claude-config"
                    title="Configuration"
                    level={3}
                  />
                  <div className="mt-3 space-y-3">
                    <CodeBlock
                      code="claude-code-sync login"
                      title="Authenticate"
                    />
                    <p className={cn("text-xs", t.textSubtle)}>
                      Or create a config file manually:
                    </p>
                    <CodeBlock
                      code={`{
  "convexUrl": "${convexCloudUrl}",
  "apiKey": "osk_your_api_key",
  "autoSync": true,
  "syncToolCalls": true,
  "syncThinking": false
}`}
                      title="~/.config/claude-code-sync/config.json"
                    />
                  </div>
                </div>

                <div id="claude-commands" data-section>
                  <SectionHeader
                    id="claude-commands"
                    title="Commands"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border overflow-hidden",
                      t.border,
                    )}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", t.border, t.bgCard)}>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Command
                          </th>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className={t.textSubtle}>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              claude-code-sync login
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Authenticate with the backend
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              claude-code-sync status
                            </code>
                          </td>
                          <td className="px-3 py-2">Check sync status</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              claude-code-sync sync
                            </code>
                          </td>
                          <td className="px-3 py-2">Manual sync</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Codex CLI Plugin */}
            <section id="codex-plugin" data-section className="mb-12">
              <SectionHeader id="codex-plugin" title="Codex CLI Plugin" />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                Sync your{" "}
                <a
                  href="https://openai.com/codex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("underline", t.interactive)}
                >
                  OpenAI Codex CLI
                </a>{" "}
                sessions to the same OpenSync dashboard.
              </p>

              <div className="mt-6 space-y-6">
                <div id="codex-install" data-section>
                  <SectionHeader
                    id="codex-install"
                    title="Installation"
                    level={3}
                  />
                  <div className="mt-3">
                    <CodeBlock code="npm install -g codex-sync" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="https://github.com/waynesutton/codex-sync-plugin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        t.interactive,
                      )}
                    >
                      <Github className="h-3 w-3" />
                      GitHub
                    </a>
                    <a
                      href="https://www.npmjs.com/package/codex-sync"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        t.interactive,
                      )}
                    >
                      <Package className="h-3 w-3" />
                      npm
                    </a>
                  </div>
                </div>

                <div id="codex-config" data-section>
                  <SectionHeader
                    id="codex-config"
                    title="Configuration"
                    level={3}
                  />
                  <div className="mt-3 space-y-3">
                    <CodeBlock code="codex-sync login" title="Authenticate" />
                    <CodeBlock
                      code="codex-sync setup"
                      title="Configure Codex notify hook"
                    />
                    <CodeBlock
                      code="codex-sync verify"
                      title="Verify connection"
                    />
                    <p className={cn("text-xs", t.textSubtle)}>
                      Or create a config file manually:
                    </p>
                    <CodeBlock
                      code={`{
  "convexUrl": "${convexCloudUrl}",
  "apiKey": "osk_your_api_key",
  "autoSync": true,
  "syncToolCalls": true,
  "syncThinking": false,
  "debug": false
}`}
                      title="~/.config/codex-sync/config.json"
                    />
                    <p className={cn("text-xs", t.textSubtle)}>
                      The setup command adds a notify hook to your Codex config:
                    </p>
                    <CodeBlock
                      code={`notify = ["codex-sync", "hook", "agent-turn-complete"]`}
                      title="~/.codex/config.toml"
                    />
                  </div>
                </div>

                <div id="codex-commands" data-section>
                  <SectionHeader
                    id="codex-commands"
                    title="Commands"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border overflow-hidden",
                      t.border,
                    )}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", t.border, t.bgCard)}>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Command
                          </th>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className={t.textSubtle}>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              codex-sync login
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Authenticate with the backend
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              codex-sync setup
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Configure Codex CLI notify hook
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              codex-sync verify
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Verify connection to backend
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              codex-sync status
                            </code>
                          </td>
                          <td className="px-3 py-2">Check sync status</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              codex-sync sync
                            </code>
                          </td>
                          <td className="px-3 py-2">Manual sync</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Cursor Plugin */}
            <section id="cursor-plugin" data-section className="mb-12">
              <SectionHeader id="cursor-plugin" title="Cursor Plugin" />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                Sync your{" "}
                <a
                  href="https://cursor.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("underline", t.interactive)}
                >
                  Cursor IDE
                </a>{" "}
                sessions to the same OpenSync dashboard.
              </p>

              <div className="mt-6 space-y-6">
                <div id="cursor-install" data-section>
                  <SectionHeader
                    id="cursor-install"
                    title="Installation"
                    level={3}
                  />
                  <div className="mt-3">
                    <CodeBlock code="npm install -g cursor-sync-plugin" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="https://github.com/waynesutton/cursor-cli-sync-plugin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        t.interactive,
                      )}
                    >
                      <Github className="h-3 w-3" />
                      GitHub
                    </a>
                    <a
                      href="https://www.npmjs.com/package/cursor-sync-plugin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        t.interactive,
                      )}
                    >
                      <Package className="h-3 w-3" />
                      npm
                    </a>
                  </div>
                </div>

                <div id="cursor-config" data-section>
                  <SectionHeader
                    id="cursor-config"
                    title="Configuration"
                    level={3}
                  />
                  <div className="mt-3 space-y-3">
                    <CodeBlock code="cursor-sync login" title="Authenticate" />
                    <CodeBlock
                      code="cursor-sync setup"
                      title="Configure Cursor hooks"
                    />
                    <CodeBlock
                      code="cursor-sync verify"
                      title="Verify connection"
                    />
                    <p className={cn("text-xs", t.textSubtle)}>
                      Or create a config file manually:
                    </p>
                    <CodeBlock
                      code={`{
  "convexUrl": "${convexCloudUrl}",
  "apiKey": "osk_your_api_key",
  "autoSync": true,
  "syncToolCalls": true,
  "syncThinking": false,
  "debug": false
}`}
                      title="~/.config/cursor-sync/config.json"
                    />
                    <p className={cn("text-xs", t.textSubtle)}>
                      The setup command configures Cursor hooks in:
                    </p>
                    <CodeBlock
                      code={`{
  "version": 1,
  "hooks": {
    "beforeSubmitPrompt": [{ "command": "cursor-sync hook beforeSubmitPrompt" }],
    "beforeShellExecution": [{ "command": "cursor-sync hook beforeShellExecution" }],
    "beforeMCPExecution": [{ "command": "cursor-sync hook beforeMCPExecution" }],
    "afterFileEdit": [{ "command": "cursor-sync hook afterFileEdit" }],
    "stop": [{ "command": "cursor-sync hook stop" }]
  }
}`}
                      title="~/.cursor/hooks.json"
                    />
                  </div>
                </div>

                <div id="cursor-commands" data-section>
                  <SectionHeader
                    id="cursor-commands"
                    title="Commands"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border overflow-hidden",
                      t.border,
                    )}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", t.border, t.bgCard)}>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Command
                          </th>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className={t.textSubtle}>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              cursor-sync login
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Authenticate with the backend
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              cursor-sync setup
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Configure Cursor hooks
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              cursor-sync verify
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Verify connection and hooks
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              cursor-sync synctest
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            Test connectivity with a test session
                          </td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              cursor-sync status
                            </code>
                          </td>
                          <td className="px-3 py-2">Check connection status</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              cursor-sync logout
                            </code>
                          </td>
                          <td className="px-3 py-2">Clear stored credentials</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api" data-section className="mb-12">
              <SectionHeader id="api" title="API Reference" />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                All endpoints require authentication via Bearer token (API key
                or JWT). Generate an API key in Settings.
              </p>

              <div className="mt-6 space-y-6">
                <div id="api-auth" data-section>
                  <SectionHeader
                    id="api-auth"
                    title="Authentication"
                    level={3}
                  />
                  <div className="mt-3">
                    <CodeBlock
                      code={`# API Key authentication
curl "${convexUrl}/api/sessions" \\
  -H "Authorization: Bearer osk_your_api_key"

# JWT authentication (from WorkOS)
curl "${convexUrl}/api/sessions" \\
  -H "Authorization: Bearer <jwt_token>"`}
                    />
                  </div>
                </div>

                <div id="api-sessions" data-section>
                  <SectionHeader id="api-sessions" title="Sessions" level={3} />
                  <div className="mt-3 space-y-4">
                    <div
                      className={cn(
                        "rounded-lg border p-4",
                        t.border,
                        t.bgCard,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          GET
                        </span>
                        <code className={cn("text-sm", t.textSecondary)}>
                          /api/sessions
                        </code>
                      </div>
                      <p className={cn("text-xs mb-3", t.textSubtle)}>
                        List all sessions for the authenticated user.
                      </p>
                      <CodeBlock
                        code={`curl "${convexUrl}/api/sessions?limit=50" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                      />
                    </div>

                    <div
                      className={cn(
                        "rounded-lg border p-4",
                        t.border,
                        t.bgCard,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          GET
                        </span>
                        <code className={cn("text-sm", t.textSecondary)}>
                          /api/sessions/get
                        </code>
                      </div>
                      <p className={cn("text-xs mb-2", t.textSubtle)}>
                        Get a single session with all messages and parts.
                      </p>
                      <p className={cn("text-[10px] mb-3", t.textDim)}>
                        <span className={t.textSubtle}>Parameters:</span> id
                        (required)
                      </p>
                      <CodeBlock
                        code={`curl "${convexUrl}/api/sessions/get?id=<session_id>" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                      />
                    </div>
                  </div>
                </div>

                <div id="api-search" data-section>
                  <SectionHeader id="api-search" title="Search" level={3} />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border p-4",
                      t.border,
                      t.bgCard,
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        GET
                      </span>
                      <code className={cn("text-sm", t.textSecondary)}>
                        /api/search
                      </code>
                    </div>
                    <p className={cn("text-xs mb-2", t.textSubtle)}>
                      Search sessions. Supports full-text, semantic, and hybrid
                      search.
                    </p>
                    <p className={cn("text-[10px] mb-3", t.textDim)}>
                      <span className={t.textSubtle}>Parameters:</span> q
                      (required), limit, type (fulltext|semantic|hybrid)
                    </p>
                    <CodeBlock
                      code={`curl "${convexUrl}/api/search?q=authentication&type=semantic&limit=20" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                    />
                  </div>
                </div>

                <div id="api-context" data-section>
                  <SectionHeader id="api-context" title="Context" level={3} />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border p-4",
                      t.border,
                      t.bgCard,
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        GET
                      </span>
                      <code className={cn("text-sm", t.textSecondary)}>
                        /api/context
                      </code>
                    </div>
                    <p className={cn("text-xs mb-2", t.textSubtle)}>
                      Get relevant session content for LLM context. Perfect for
                      RAG pipelines.
                    </p>
                    <p className={cn("text-[10px] mb-3", t.textDim)}>
                      <span className={t.textSubtle}>Parameters:</span> q
                      (required), limit, format (text|messages)
                    </p>
                    <CodeBlock
                      code={`curl "${convexUrl}/api/context?q=react+hooks&format=text&limit=5" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                    />
                  </div>
                </div>

                <div id="api-export" data-section>
                  <SectionHeader id="api-export" title="Export" level={3} />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border p-4",
                      t.border,
                      t.bgCard,
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        GET
                      </span>
                      <code className={cn("text-sm", t.textSecondary)}>
                        /api/export
                      </code>
                    </div>
                    <p className={cn("text-xs mb-2", t.textSubtle)}>
                      Export a session in various formats.
                    </p>
                    <p className={cn("text-[10px] mb-3", t.textDim)}>
                      <span className={t.textSubtle}>Parameters:</span> id
                      (required), format (json|markdown|jsonl)
                    </p>
                    <CodeBlock
                      code={`curl "${convexUrl}/api/export?id=<session_id>&format=markdown" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                    />
                  </div>
                </div>

                <div id="api-stats" data-section>
                  <SectionHeader id="api-stats" title="Stats" level={3} />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border p-4",
                      t.border,
                      t.bgCard,
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        GET
                      </span>
                      <code className={cn("text-sm", t.textSecondary)}>
                        /api/stats
                      </code>
                    </div>
                    <p className={cn("text-xs mb-3", t.textSubtle)}>
                      Get usage statistics: session count, tokens, cost, model
                      breakdown.
                    </p>
                    <CodeBlock
                      code={`curl "${convexUrl}/api/stats" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Search Section */}
            <section id="search" data-section className="mb-12">
              <SectionHeader id="search" title="Search" />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                OpenSync supports three search modes to find sessions by
                content.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div
                  id="search-fulltext"
                  data-section
                  className={cn("p-4 rounded-lg border", t.border, t.bgCard)}
                >
                  <h4
                    className={cn("text-sm font-medium mb-2", t.textSecondary)}
                  >
                    Full-Text
                  </h4>
                  <p className={cn("text-xs mb-2", t.textSubtle)}>
                    Keyword matching. Fast and exact. Best for specific terms.
                  </p>
                  <code className={cn("text-[10px] block", t.textDim)}>
                    ?type=fulltext
                  </code>
                </div>

                <div
                  id="search-semantic"
                  data-section
                  className={cn("p-4 rounded-lg border", t.border, t.bgCard)}
                >
                  <h4
                    className={cn("text-sm font-medium mb-2", t.textSecondary)}
                  >
                    Semantic
                  </h4>
                  <p className={cn("text-xs mb-2", t.textSubtle)}>
                    Meaning-based search using embeddings. Finds related
                    concepts.
                  </p>
                  <code className={cn("text-[10px] block", t.textDim)}>
                    ?type=semantic
                  </code>
                </div>

                <div
                  id="search-hybrid"
                  data-section
                  className={cn("p-4 rounded-lg border", t.border, t.bgCard)}
                >
                  <h4
                    className={cn("text-sm font-medium mb-2", t.textSecondary)}
                  >
                    Hybrid
                  </h4>
                  <p className={cn("text-xs mb-2", t.textSubtle)}>
                    Combines both using RRF. Best overall results.
                  </p>
                  <code className={cn("text-[10px] block", t.textDim)}>
                    ?type=hybrid
                  </code>
                </div>
              </div>
            </section>

            {/* Authentication Section */}
            <section id="auth" data-section className="mb-12">
              <SectionHeader id="auth" title="Authentication" />

              <div className="mt-6 space-y-6">
                <div id="auth-workos" data-section>
                  <SectionHeader
                    id="auth-workos"
                    title="WorkOS AuthKit"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 p-4 rounded-lg border",
                      t.bgCard,
                      t.border,
                    )}
                  >
                    <p className={cn("text-sm mb-3", t.textMuted)}>
                      The web dashboard uses WorkOS AuthKit for enterprise
                      authentication:
                    </p>
                    <ul
                      className={cn(
                        "space-y-1 text-xs list-disc list-inside",
                        t.textSubtle,
                      )}
                    >
                      <li>Single Sign-On (SSO) support</li>
                      <li>Magic link authentication</li>
                      <li>Google, GitHub, Microsoft OAuth</li>
                      <li>RS256 JWT validation</li>
                    </ul>
                    <div className="mt-4">
                      <a
                        href="https://docs.convex.dev/auth/authkit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "text-xs flex items-center gap-1",
                          t.interactive,
                        )}
                      >
                        Convex + WorkOS AuthKit docs
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div id="auth-api-keys" data-section>
                  <SectionHeader
                    id="auth-api-keys"
                    title="API Keys"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 p-4 rounded-lg border",
                      t.bgCard,
                      t.border,
                    )}
                  >
                    <p className={cn("text-sm mb-3", t.textMuted)}>
                      Plugins and API access use API keys for authentication:
                    </p>
                    <ul
                      className={cn(
                        "space-y-1 text-xs list-disc list-inside",
                        t.textSubtle,
                      )}
                    >
                      <li>
                        Keys start with{" "}
                        <code className={cn("px-1 rounded", t.bgCode)}>
                          osk_
                        </code>
                      </li>
                      <li>Generated in Dashboard Settings</li>
                      <li>Stored securely server-side</li>
                      <li>Full access to user data</li>
                      <li>No browser authentication required</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Hosting Section */}
            <section id="hosting" data-section className="mb-12">
              <SectionHeader id="hosting" title="Hosting & Deploy" />

              <div className="mt-6 space-y-6">
                <div id="hosting-convex" data-section>
                  <SectionHeader
                    id="hosting-convex"
                    title="Convex Backend"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Convex provides the real-time database, serverless
                    functions, and built-in search capabilities.
                  </p>
                  <div className="mt-3">
                    <CodeBlock
                      code={`# Development
npx convex dev

# Production deployment
npx convex deploy`}
                    />
                  </div>
                </div>

                <div id="hosting-netlify" data-section>
                  <SectionHeader
                    id="hosting-netlify"
                    title="Netlify Frontend"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Deploy the React frontend to Netlify, Vercel, or any static
                    hosting.
                  </p>
                  <div className="mt-3">
                    <CodeBlock
                      code={`# Build
npm run build

# Output in dist/ folder`}
                    />
                  </div>
                </div>

                <div id="hosting-env" data-section>
                  <SectionHeader
                    id="hosting-env"
                    title="Environment Variables"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 rounded-lg border overflow-hidden",
                      t.border,
                    )}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", t.border, t.bgCard)}>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Variable
                          </th>
                          <th
                            className={cn(
                              "px-3 py-2 text-left font-medium",
                              t.textMuted,
                            )}
                          >
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className={t.textSubtle}>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              VITE_CONVEX_URL
                            </code>
                          </td>
                          <td className="px-3 py-2">Convex deployment URL</td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              VITE_WORKOS_CLIENT_ID
                            </code>
                          </td>
                          <td className="px-3 py-2">WorkOS client ID</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              OPENAI_API_KEY
                            </code>
                          </td>
                          <td className="px-3 py-2">
                            For semantic search (Convex env)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Fork Section */}
            <section id="fork" data-section className="mb-12">
              <SectionHeader id="fork" title="Fork & Self-Host" />

              <div className="mt-6 space-y-6">
                <div id="fork-repo" data-section>
                  <SectionHeader
                    id="fork-repo"
                    title="Clone Repository"
                    level={3}
                  />
                  <div className="mt-3">
                    <CodeBlock
                      code={`git clone https://github.com/waynesutton/opensync.git
cd opensync
npm install`}
                    />
                  </div>
                </div>

                <div id="fork-setup" data-section>
                  <SectionHeader
                    id="fork-setup"
                    title="Setup Steps"
                    level={3}
                  />
                  <div
                    className={cn(
                      "mt-3 p-4 rounded-lg border",
                      t.bgCard,
                      t.border,
                    )}
                  >
                    <ol
                      className={cn(
                        "space-y-3 text-sm list-decimal list-inside",
                        t.textMuted,
                      )}
                    >
                      <li>
                        Create a Convex project at{" "}
                        <a
                          href="https://convex.dev"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={t.interactive}
                        >
                          convex.dev
                        </a>
                      </li>
                      <li>
                        Create a WorkOS account and configure AuthKit at{" "}
                        <a
                          href="https://workos.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={t.interactive}
                        >
                          workos.com
                        </a>
                      </li>
                      <li>
                        Copy .env.example to .env.local and fill in values
                      </li>
                      <li>
                        Run{" "}
                        <code className={cn("px-1 rounded", t.bgCode)}>
                          npx convex dev
                        </code>
                      </li>
                      <li>
                        Run{" "}
                        <code className={cn("px-1 rounded", t.bgCode)}>
                          npm run dev
                        </code>
                      </li>
                      <li>Deploy frontend to Netlify or Vercel</li>
                    </ol>
                  </div>
                </div>

                <div id="fork-customize" data-section>
                  <SectionHeader
                    id="fork-customize"
                    title="Customization"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    The codebase is designed to be forked and customized:
                  </p>
                  <ul
                    className={cn(
                      "mt-2 space-y-1 text-xs list-disc list-inside",
                      t.textSubtle,
                    )}
                  >
                    <li>
                      <code className={cn("px-1 rounded", t.bgCode)}>
                        convex/schema.ts
                      </code>{" "}
                      - Database schema
                    </li>
                    <li>
                      <code className={cn("px-1 rounded", t.bgCode)}>
                        src/lib/theme.tsx
                      </code>{" "}
                      - Theme colors
                    </li>
                    <li>
                      <code className={cn("px-1 rounded", t.bgCode)}>
                        src/pages/
                      </code>{" "}
                      - Page components
                    </li>
                    <li>
                      <code className={cn("px-1 rounded", t.bgCode)}>
                        convex/http.ts
                      </code>{" "}
                      - API endpoints
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" data-section className="mb-12">
              <SectionHeader id="troubleshooting" title="Troubleshooting" />

              <div className={cn("mt-4 space-y-3")}>
                <div
                  className={cn("p-4 rounded-lg border", t.bgCard, t.border)}
                >
                  <h4
                    className={cn("text-sm font-medium mb-2", t.textSecondary)}
                  >
                    Plugin not syncing
                  </h4>
                  <ul
                    className={cn(
                      "space-y-1 text-xs list-disc list-inside",
                      t.textSubtle,
                    )}
                  >
                    <li>Check API key is valid and not expired</li>
                    <li>Verify Convex URL is correct</li>
                    <li>
                      Run{" "}
                      <code className={cn("px-1 rounded", t.bgCode)}>
                        opencode-sync status
                      </code>{" "}
                      to check configuration
                    </li>
                    <li>Check Convex dashboard logs for errors</li>
                  </ul>
                </div>

                <div
                  className={cn("p-4 rounded-lg border", t.bgCard, t.border)}
                >
                  <h4
                    className={cn("text-sm font-medium mb-2", t.textSecondary)}
                  >
                    Authentication errors
                  </h4>
                  <ul
                    className={cn(
                      "space-y-1 text-xs list-disc list-inside",
                      t.textSubtle,
                    )}
                  >
                    <li>Clear browser cookies and try again</li>
                    <li>Verify WorkOS configuration in Convex</li>
                    <li>Check VITE_WORKOS_CLIENT_ID is set correctly</li>
                    <li>Ensure redirect URLs are configured in WorkOS</li>
                  </ul>
                </div>

                <div
                  className={cn("p-4 rounded-lg border", t.bgCard, t.border)}
                >
                  <h4
                    className={cn("text-sm font-medium mb-2", t.textSecondary)}
                  >
                    Semantic search not working
                  </h4>
                  <ul
                    className={cn(
                      "space-y-1 text-xs list-disc list-inside",
                      t.textSubtle,
                    )}
                  >
                    <li>Verify OPENAI_API_KEY is set in Convex environment</li>
                    <li>Check OpenAI API quota and billing</li>
                    <li>Embeddings generate asynchronously after sync</li>
                    <li>Wait a few seconds for embeddings to index</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" data-section className="mb-12">
              <SectionHeader id="faq" title="Frequently Asked Questions" />

              <div className="mt-4 space-y-2">
                <FaqItem
                  question="What is OpenSync?"
                  answer="OpenSync is a cloud-based dashboard that syncs, stores, and searches your AI coding sessions from OpenCode and Claude Code. It gives you a unified view of all your AI-assisted coding work with full-text search, semantic search, usage analytics, and API access for context engineering."
                />
                <FaqItem
                  question="Is my data secure?"
                  answer="Yes. All data goes to YOUR Convex deployment - no third parties. Server-side secrets like your OpenAI API key are stored in Convex environment variables and never exposed to the client. Authentication uses WorkOS with industry-standard RS256 JWT validation."
                />
                <FaqItem
                  question="What data gets synced?"
                  answer="Session metadata (project, directory, branch, timestamps), user prompts, assistant responses, tool calls and their outcomes, token usage, and model information. Sensitive data like passwords, tokens, and API keys are automatically redacted before sync."
                />
                <FaqItem
                  question="What is semantic search?"
                  answer="Semantic search uses AI embeddings to find sessions by meaning rather than exact keywords. For example, searching 'authentication issues' will find sessions about 'login bugs' or 'JWT token problems' even if those exact words weren't used. OpenSync uses OpenAI's text-embedding-3-small model."
                />
                <FaqItem
                  question="Can I use my session data with other LLMs?"
                  answer="Yes. The /api/context endpoint retrieves relevant session content formatted for LLM context injection. You can use this for RAG pipelines, context engineering, or feeding your coding history into any LLM. Export options include JSON, Markdown, and JSONL formats."
                />
                <FaqItem
                  question="How do I generate an API key?"
                  answer="Go to Settings in the dashboard and click 'Generate API Key'. Your key will start with 'osk_' and can be used in the Authorization header for all API endpoints. Keep this key secure - it provides full access to your session data."
                />
              </div>
            </section>

            {/* Footer */}
            <footer className={cn("mt-16 pt-8 border-t", t.border)}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className={cn("text-xs", t.textDim)}>
                  Built on{" "}
                  <a
                    href="https://convex.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("transition-colors", t.textSubtle)}
                  >
                    Convex
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://workos.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("transition-colors", t.textSubtle)}
                  >
                    WorkOS
                  </a>
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/waynesutton/opensync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      t.textSubtle,
                    )}
                  >
                    <Github className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                  <Link to="/llms.txt" className={cn("text-xs", t.textSubtle)}>
                    llms.txt
                  </Link>
                </div>
              </div>
            </footer>
          </main>

          {/* Right sidebar - Table of Contents */}
          <TableOfContents
            activeSection={activeSection}
            sections={currentSections}
          />
        </div>
      </div>
    </div>
  );
}
