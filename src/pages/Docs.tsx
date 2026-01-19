import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";

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
        className
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
function CodeBlock({
  code,
  title,
}: {
  code: string;
  title?: string;
}) {
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
            t.textDim
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
            t.textMuted
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
            : cn("text-sm font-medium", t.textSecondary)
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
            t.textSubtle
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
        isMobile ? "w-full" : "w-56 shrink-0"
      )}
    >
      {/* Mobile header */}
      {isMobile && (
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-b",
            t.border
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
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
                    : cn(t.textMuted, t.bgHover)
                )}
              >
                <span className={t.iconSubtle}>{section.icon}</span>
                <span className="flex-1 text-left">{section.title}</span>
                {section.subsections && (
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 transition-transform",
                      isExpanded && "rotate-90"
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
                          : cn(t.textSubtle, t.bgHover)
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
            t.bgHover
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
            t.bgHover
          )}
        >
          <Package className="h-3.5 w-3.5" />
          npm
          <ExternalLink className="h-3 w-3 ml-auto" />
        </a>
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
            t.textDim
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
                  : cn(t.textSubtle, "hover:opacity-80")
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
function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  return (
    <div className={cn("rounded-lg border", t.border, t.bgCard)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between p-4 text-left transition-colors",
          t.bgHover
        )}
      >
        <span className={cn("text-sm font-medium", t.textSecondary)}>
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            t.textSubtle,
            isOpen ? "rotate-180" : ""
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
    new Set(["hosted", "quickstart", "dashboard", "api"])
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
      { rootMargin: "-100px 0px -80% 0px" }
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

### Login and Sync

1. Sign in at https://www.opensync.dev
2. Go to Settings and click Generate API Key
3. Run the login command:

\`\`\`bash
opencode-sync login
# or
claude-code-sync login
\`\`\`

4. Enter the Convex URL and API key when prompted
5. Start coding. Sessions sync automatically.

**Hosted Convex URL:** \`https://polished-penguin-622.convex.cloud\`

---

## Requirements for Self-Hosting

These requirements are only for self-hosting your own OpenSync instance. To use the hosted version at opensync.dev, you only need Node.js to install the plugins locally.

Before getting started with self-hosting, make sure you have:

- Node.js 18 or later
- npm or bun package manager
- A Convex account (free at convex.dev)
- A WorkOS account (free at workos.com)
- Optional: OpenAI API key for semantic search

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

## Dashboard Features

### Overview
The Overview tab shows key metrics: total sessions, tokens, cost, duration, models, and projects. Charts display usage trends over 30 days.

### Sessions View
Browse all synced sessions with sorting, filtering, and source badges (OC for OpenCode, CC for Claude Code). Click a session to view full conversation history.

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
            theme === "dark" ? "bg-[#0E0E0E]/90" : "bg-[#faf8f5]/90"
          )}
        >
          <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-6">
            <button
              onClick={() => setShowMarkdownView(false)}
              className={cn(
                "flex items-center gap-2 text-sm transition-colors",
                t.textSubtle
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
              t.textMuted
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
              t.bgPrimary
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
          t.border
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
            theme === "dark" ? "bg-[#0E0E0E]/90" : "bg-[#faf8f5]/90"
          )}
        >
          <div className="flex h-12 items-center justify-between px-4 lg:px-6">
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
                  t.textSubtle
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                back
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {/* View as markdown */}
              <button
                onClick={() => setShowMarkdownView(true)}
                className={cn(
                  "hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                  t.textSubtle,
                  t.bgHover
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
                  t.bgHover
                )}
              >
                {copiedSection === "full" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy Markdown
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  t.textSubtle,
                  t.bgHover
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
          </div>
        </header>

        {/* Content area with right sidebar */}
        <div className="flex-1 flex">
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto px-4 lg:px-8 py-8 max-w-4xl"
          >
            {/* Hero */}
            <div className="mb-12">
              <h1 className={cn("text-3xl font-bold mb-4", t.textPrimary)}>
                OpenSync Documentation
              </h1>
              <p className={cn("text-base leading-relaxed", t.textMuted)}>
                Sync, search, and share your AI coding sessions from OpenCode
                and Claude Code. Cloud-synced dashboards that track session
                activity, tool usage, and token spend across projects.
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
                    t.bgHover
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
                    t.bgHover
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
                    t.bgHover
                  )}
                >
                  <Package className="h-3.5 w-3.5" />
                  claude-code-sync
                </a>
                <a
                  href="https://www.opensync.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    t.border,
                    t.textSubtle,
                    t.bgHover
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
                    `## Use the Hosted Version\n\nStart syncing sessions in under 2 minutes with https://www.opensync.dev/\n\n### Install Plugins\n\`\`\`bash\nnpm install -g opencode-sync-plugin\nnpm install -g claude-code-sync\n\`\`\`\n\n### Login and Sync\n1. Sign in at opensync.dev\n2. Generate an API key in Settings\n3. Run \`opencode-sync login\` or \`claude-code-sync login\`\n4. Start coding, sessions sync automatically`
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
                , install a plugin locally, and start syncing in under 2 minutes.
              </p>

              <div className="mt-6 space-y-6">
                {/* Features */}
                <div id="hosted-features" data-section>
                  <SectionHeader
                    id="hosted-features"
                    title="Features"
                    level={3}
                  />
                  <div className={cn("mt-3 grid gap-3 sm:grid-cols-2", t.textMuted)}>
                    <div className={cn("p-3 rounded-lg border", t.bgCard, t.border)}>
                      <span className={cn("font-mono text-xs", theme === "dark" ? "text-[#c586c0]" : "text-[#9b4d96]")}>
                        Sync
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Sessions sync from CLI to cloud automatically as you work
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-lg border", t.bgCard, t.border)}>
                      <span className={cn("font-mono text-xs", theme === "dark" ? "text-[#dcdcaa]" : "text-[#8b7355]")}>
                        Search
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Full-text and semantic search across all sessions
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-lg border", t.bgCard, t.border)}>
                      <span className={cn("font-mono text-xs", theme === "dark" ? "text-[#ce9178]" : "text-[#a05d3b]")}>
                        Private
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Your data stays in your account, secured by WorkOS
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-lg border", t.bgCard, t.border)}>
                      <span className={cn("font-mono text-xs", theme === "dark" ? "text-[#9cdcfe]" : "text-[#3d7ea6]")}>
                        Export
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Export for evals in DeepEval, OpenAI, or plain text formats
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-lg border", t.bgCard, t.border)}>
                      <span className="font-mono text-xs text-[#EB5601]">
                        Delete
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Your control. Delete sessions or your entire account anytime.
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-lg border", t.bgCard, t.border)}>
                      <span className={cn("font-mono text-xs", theme === "dark" ? "text-emerald-400" : "text-emerald-600")}>
                        API
                      </span>
                      <p className={cn("mt-1 text-xs", t.textSubtle)}>
                        Use the REST API for RAG, context injection, and integrations
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
                    Install one or both plugins globally. They run on your machine and sync to the hosted dashboard.
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {/* OpenCode */}
                    <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-blue-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-blue-400">
                            OC
                          </span>
                        </div>
                        <span className={cn("text-sm font-medium", t.textSecondary)}>
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
                    <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-amber-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-amber-500">
                            CC
                          </span>
                        </div>
                        <span className={cn("text-sm font-medium", t.textSecondary)}>
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
                  </div>
                </div>

                {/* Login and Sync */}
                <div id="hosted-login" data-section>
                  <SectionHeader
                    id="hosted-login"
                    title="Login and Sync"
                    level={3}
                  />
                  <div className={cn("mt-3 p-4 rounded-lg border", t.bgCard, t.border)}>
                    <ol className={cn("space-y-3 text-sm list-decimal list-inside", t.textMuted)}>
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
                        Go to <strong>Settings</strong> and click <strong>Generate API Key</strong>
                      </li>
                      <li>
                        Run the login command:
                        <div className="mt-2 space-y-2 pl-4">
                          <CodeBlock code="opencode-sync login" />
                          <p className={cn("text-xs text-center", t.textDim)}>or</p>
                          <CodeBlock code="claude-code-sync login" />
                        </div>
                      </li>
                      <li>
                        Enter the <strong>Convex URL</strong> and <strong>API key</strong> when prompted
                      </li>
                      <li>
                        Start coding. Sessions sync automatically.
                      </li>
                    </ol>
                  </div>
                  <div className={cn("mt-4 p-3 rounded-lg border", t.bgCode, t.border)}>
                    <p className={cn("text-xs", t.textSubtle)}>
                      <strong className={t.textMuted}>Hosted Convex URL:</strong>{" "}
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
                    `## Requirements for Self-Hosting\n\nThese are only needed if you want to run your own OpenSync instance. For the hosted version at opensync.dev, skip to the section above.\n\n- Node.js 18 or later\n- npm or bun\n- Convex account\n- WorkOS account\n- Optional: OpenAI API key`
                  )
                }
              />
              <div className={cn("mt-3 p-3 rounded-lg border", t.bgCode, t.border)}>
                <p className={cn("text-xs", t.textSubtle)}>
                  These requirements are only for self-hosting your own OpenSync instance.
                  To use the hosted version at{" "}
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
              <div className={cn("mt-4 p-4 rounded-lg border", t.bgCard, t.border)}>
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
                    <span className={cn("text-xs px-1.5 rounded", t.bgCode, t.textDim)}>
                      optional
                    </span>
                    OpenAI API key for semantic search
                  </li>
                </ul>
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
                    `## Quick Start\n\n### Deploy Backend\n\`\`\`bash\ngit clone https://github.com/waynesutton/opensync.git\ncd opensync\nnpm install\nnpx convex dev\n\`\`\``
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
                  <div className={cn("mt-3 p-4 rounded-lg border", t.bgCard, t.border)}>
                    <ol className={cn("space-y-2 text-sm list-decimal list-inside", t.textMuted)}>
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
                    <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-blue-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-blue-400">
                            OC
                          </span>
                        </div>
                        <span className={cn("text-sm font-medium", t.textSecondary)}>
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
                    <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-amber-500/15 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-amber-500">
                            CC
                          </span>
                        </div>
                        <span className={cn("text-sm font-medium", t.textSecondary)}>
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
                    The Overview tab shows key metrics at a glance: total sessions,
                    tokens used, total cost, duration, models, and projects. Interactive
                    charts display usage trends over the last 30 days with breakdowns
                    by model and project.
                  </p>
                </div>

                <div id="dashboard-sessions" data-section>
                  <SectionHeader
                    id="dashboard-sessions"
                    title="Sessions View"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Browse all synced sessions with sorting and filtering. Source badges
                    show OC (OpenCode) or CC (Claude Code) origin. List view shows token
                    count, cost, and duration. Timeline view displays sessions
                    chronologically grouped by project.
                  </p>
                </div>

                <div id="dashboard-evals" data-section>
                  <SectionHeader
                    id="dashboard-evals"
                    title="Evals Export"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Mark sessions as eval-ready to build training datasets. Export in
                    multiple formats:
                  </p>
                  <ul className={cn("mt-2 space-y-1 text-sm list-disc list-inside", t.textSubtle)}>
                    <li>
                      <strong>DeepEval JSON</strong> - For DeepEval framework
                    </li>
                    <li>
                      <strong>OpenAI JSONL</strong> - For OpenAI Evals and fine-tuning
                    </li>
                    <li>
                      <strong>Filesystem</strong> - Plain text files for custom pipelines
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
                    Detailed breakdowns by model, provider, and project. View efficiency
                    metrics like cost per session, tokens per message, and prompt/completion
                    ratios. Filter and sort the projects table to identify high-usage areas.
                  </p>
                </div>

                <div id="dashboard-context" data-section>
                  <SectionHeader
                    id="dashboard-context"
                    title="Context Search"
                    level={3}
                  />
                  <p className={cn("mt-2 text-sm", t.textMuted)}>
                    Full-text search across all sessions and messages. Results are paginated
                    and can be used for RAG pipelines and context engineering. No OpenAI key
                    required for basic full-text search.
                  </p>
                </div>
              </div>
            </section>

            {/* OpenCode Plugin */}
            <section id="opencode-plugin" data-section className="mb-12">
              <SectionHeader id="opencode-plugin" title="OpenCode Plugin" />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                Sync your OpenCode sessions to the OpenSync dashboard automatically.
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
                        t.interactive
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
                        t.interactive
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
                    <CodeBlock code="opencode-sync login" title="Authenticate" />
                    <p className={cn("text-xs", t.textSubtle)}>
                      Enter your Convex URL ({convexCloudUrl}) and API key when prompted.
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
                  <div className={cn("mt-3 rounded-lg border overflow-hidden", t.border)}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", t.border, t.bgCard)}>
                          <th className={cn("px-3 py-2 text-left font-medium", t.textMuted)}>
                            Command
                          </th>
                          <th className={cn("px-3 py-2 text-left font-medium", t.textMuted)}>
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
                          <td className="px-3 py-2">Authenticate with the backend</td>
                        </tr>
                        <tr className={cn("border-b", t.borderLight)}>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              opencode-sync status
                            </code>
                          </td>
                          <td className="px-3 py-2">Check sync status and configuration</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">
                            <code className={cn("px-1 rounded", t.bgCode)}>
                              opencode-sync sync
                            </code>
                          </td>
                          <td className="px-3 py-2">Manually sync current session</td>
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
                Sync your Claude Code sessions to the same OpenSync dashboard.
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
                        t.interactive
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
                        t.interactive
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
                    <CodeBlock code="claude-code-sync login" title="Authenticate" />
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
                  <div className={cn("mt-3 rounded-lg border overflow-hidden", t.border)}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", t.border, t.bgCard)}>
                          <th className={cn("px-3 py-2 text-left font-medium", t.textMuted)}>
                            Command
                          </th>
                          <th className={cn("px-3 py-2 text-left font-medium", t.textMuted)}>
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
                          <td className="px-3 py-2">Authenticate with the backend</td>
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

            {/* API Reference */}
            <section id="api" data-section className="mb-12">
              <SectionHeader id="api" title="API Reference" />
              <p className={cn("mt-2 text-sm", t.textMuted)}>
                All endpoints require authentication via Bearer token (API key or JWT).
                Generate an API key in Settings.
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
                  <SectionHeader
                    id="api-sessions"
                    title="Sessions"
                    level={3}
                  />
                  <div className="mt-3 space-y-4">
                    <div className={cn("rounded-lg border p-4", t.border, t.bgCard)}>
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

                    <div className={cn("rounded-lg border p-4", t.border, t.bgCard)}>
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
                        <span className={t.textSubtle}>Parameters:</span> id (required)
                      </p>
                      <CodeBlock
                        code={`curl "${convexUrl}/api/sessions/get?id=<session_id>" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                      />
                    </div>
                  </div>
                </div>

                <div id="api-search" data-section>
                  <SectionHeader
                    id="api-search"
                    title="Search"
                    level={3}
                  />
                  <div className={cn("mt-3 rounded-lg border p-4", t.border, t.bgCard)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        GET
                      </span>
                      <code className={cn("text-sm", t.textSecondary)}>
                        /api/search
                      </code>
                    </div>
                    <p className={cn("text-xs mb-2", t.textSubtle)}>
                      Search sessions. Supports full-text, semantic, and hybrid search.
                    </p>
                    <p className={cn("text-[10px] mb-3", t.textDim)}>
                      <span className={t.textSubtle}>Parameters:</span> q (required),
                      limit, type (fulltext|semantic|hybrid)
                    </p>
                    <CodeBlock
                      code={`curl "${convexUrl}/api/search?q=authentication&type=semantic&limit=20" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                    />
                  </div>
                </div>

                <div id="api-context" data-section>
                  <SectionHeader
                    id="api-context"
                    title="Context"
                    level={3}
                  />
                  <div className={cn("mt-3 rounded-lg border p-4", t.border, t.bgCard)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        GET
                      </span>
                      <code className={cn("text-sm", t.textSecondary)}>
                        /api/context
                      </code>
                    </div>
                    <p className={cn("text-xs mb-2", t.textSubtle)}>
                      Get relevant session content for LLM context. Perfect for RAG pipelines.
                    </p>
                    <p className={cn("text-[10px] mb-3", t.textDim)}>
                      <span className={t.textSubtle}>Parameters:</span> q (required),
                      limit, format (text|messages)
                    </p>
                    <CodeBlock
                      code={`curl "${convexUrl}/api/context?q=react+hooks&format=text&limit=5" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                    />
                  </div>
                </div>

                <div id="api-export" data-section>
                  <SectionHeader
                    id="api-export"
                    title="Export"
                    level={3}
                  />
                  <div className={cn("mt-3 rounded-lg border p-4", t.border, t.bgCard)}>
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
                      <span className={t.textSubtle}>Parameters:</span> id (required),
                      format (json|markdown|jsonl)
                    </p>
                    <CodeBlock
                      code={`curl "${convexUrl}/api/export?id=<session_id>&format=markdown" \\
  -H "Authorization: Bearer osk_your_api_key"`}
                    />
                  </div>
                </div>

                <div id="api-stats" data-section>
                  <SectionHeader
                    id="api-stats"
                    title="Stats"
                    level={3}
                  />
                  <div className={cn("mt-3 rounded-lg border p-4", t.border, t.bgCard)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        GET
                      </span>
                      <code className={cn("text-sm", t.textSecondary)}>
                        /api/stats
                      </code>
                    </div>
                    <p className={cn("text-xs mb-3", t.textSubtle)}>
                      Get usage statistics: session count, tokens, cost, model breakdown.
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
                OpenSync supports three search modes to find sessions by content.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div
                  id="search-fulltext"
                  data-section
                  className={cn("p-4 rounded-lg border", t.border, t.bgCard)}
                >
                  <h4 className={cn("text-sm font-medium mb-2", t.textSecondary)}>
                    Full-Text
                  </h4>
                  <p className={cn("text-xs mb-2", t.textSubtle)}>
                    Keyword matching. Fast and exact. Best for specific terms.
                  </p>
                  <code className={cn("text-[10px] block", t.textDim)}>?type=fulltext</code>
                </div>

                <div
                  id="search-semantic"
                  data-section
                  className={cn("p-4 rounded-lg border", t.border, t.bgCard)}
                >
                  <h4 className={cn("text-sm font-medium mb-2", t.textSecondary)}>
                    Semantic
                  </h4>
                  <p className={cn("text-xs mb-2", t.textSubtle)}>
                    Meaning-based search using embeddings. Finds related concepts.
                  </p>
                  <code className={cn("text-[10px] block", t.textDim)}>?type=semantic</code>
                </div>

                <div
                  id="search-hybrid"
                  data-section
                  className={cn("p-4 rounded-lg border", t.border, t.bgCard)}
                >
                  <h4 className={cn("text-sm font-medium mb-2", t.textSecondary)}>
                    Hybrid
                  </h4>
                  <p className={cn("text-xs mb-2", t.textSubtle)}>
                    Combines both using RRF. Best overall results.
                  </p>
                  <code className={cn("text-[10px] block", t.textDim)}>?type=hybrid</code>
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
                  <div className={cn("mt-3 p-4 rounded-lg border", t.bgCard, t.border)}>
                    <p className={cn("text-sm mb-3", t.textMuted)}>
                      The web dashboard uses WorkOS AuthKit for enterprise authentication:
                    </p>
                    <ul className={cn("space-y-1 text-xs list-disc list-inside", t.textSubtle)}>
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
                        className={cn("text-xs flex items-center gap-1", t.interactive)}
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
                  <div className={cn("mt-3 p-4 rounded-lg border", t.bgCard, t.border)}>
                    <p className={cn("text-sm mb-3", t.textMuted)}>
                      Plugins and API access use API keys for authentication:
                    </p>
                    <ul className={cn("space-y-1 text-xs list-disc list-inside", t.textSubtle)}>
                      <li>
                        Keys start with{" "}
                        <code className={cn("px-1 rounded", t.bgCode)}>osk_</code>
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
                    Convex provides the real-time database, serverless functions, and
                    built-in search capabilities.
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
                    Deploy the React frontend to Netlify, Vercel, or any static hosting.
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
                  <div className={cn("mt-3 rounded-lg border overflow-hidden", t.border)}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cn("border-b", t.border, t.bgCard)}>
                          <th className={cn("px-3 py-2 text-left font-medium", t.textMuted)}>
                            Variable
                          </th>
                          <th className={cn("px-3 py-2 text-left font-medium", t.textMuted)}>
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
                          <td className="px-3 py-2">For semantic search (Convex env)</td>
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
                  <div className={cn("mt-3 p-4 rounded-lg border", t.bgCard, t.border)}>
                    <ol className={cn("space-y-3 text-sm list-decimal list-inside", t.textMuted)}>
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
                      <li>Copy .env.example to .env.local and fill in values</li>
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
                  <ul className={cn("mt-2 space-y-1 text-xs list-disc list-inside", t.textSubtle)}>
                    <li>
                      <code className={cn("px-1 rounded", t.bgCode)}>convex/schema.ts</code>{" "}
                      - Database schema
                    </li>
                    <li>
                      <code className={cn("px-1 rounded", t.bgCode)}>src/lib/theme.tsx</code>{" "}
                      - Theme colors
                    </li>
                    <li>
                      <code className={cn("px-1 rounded", t.bgCode)}>src/pages/</code>{" "}
                      - Page components
                    </li>
                    <li>
                      <code className={cn("px-1 rounded", t.bgCode)}>convex/http.ts</code>{" "}
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
                <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                  <h4 className={cn("text-sm font-medium mb-2", t.textSecondary)}>
                    Plugin not syncing
                  </h4>
                  <ul className={cn("space-y-1 text-xs list-disc list-inside", t.textSubtle)}>
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

                <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                  <h4 className={cn("text-sm font-medium mb-2", t.textSecondary)}>
                    Authentication errors
                  </h4>
                  <ul className={cn("space-y-1 text-xs list-disc list-inside", t.textSubtle)}>
                    <li>Clear browser cookies and try again</li>
                    <li>Verify WorkOS configuration in Convex</li>
                    <li>Check VITE_WORKOS_CLIENT_ID is set correctly</li>
                    <li>Ensure redirect URLs are configured in WorkOS</li>
                  </ul>
                </div>

                <div className={cn("p-4 rounded-lg border", t.bgCard, t.border)}>
                  <h4 className={cn("text-sm font-medium mb-2", t.textSecondary)}>
                    Semantic search not working
                  </h4>
                  <ul className={cn("space-y-1 text-xs list-disc list-inside", t.textSubtle)}>
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
                    className={cn("flex items-center gap-1 text-xs", t.textSubtle)}
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
