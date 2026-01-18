import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github, ChevronDown, Sun, Moon } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";

// FAQ data
const faqs = [
  {
    question: "What is OpenSync?",
    answer:
      "OpenSync is a cloud-based dashboard that syncs, stores, and searches your AI coding sessions from OpenCode and Claude Code. It gives you a unified view of all your AI-assisted coding work with full-text search, semantic search, usage analytics, and API access for context engineering.",
  },
  {
    question: "What's the difference between OpenCode and Claude Code support?",
    answer:
      "Both are fully supported. OpenCode sessions sync via the opencode-sync-plugin npm package. Claude Code sessions sync via a separate claude-code-sync plugin that hooks into Claude Code's lifecycle events. Both plugins send data to the same Convex backend, giving you a unified dashboard for all your AI coding sessions.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data goes to YOUR Convex deployment - no third parties. Server-side secrets like your OpenAI API key are stored in Convex environment variables and never exposed to the client. Authentication uses WorkOS with industry-standard RS256 JWT validation. All API endpoints enforce user data isolation.",
  },
  {
    question: "Are my API keys exposed in the frontend?",
    answer:
      "No. The only client-side variables are VITE_CONVEX_URL and VITE_WORKOS_CLIENT_ID - these are public identifiers by design, similar to Firebase config or Auth0 client IDs. Your OpenAI API key and user API keys (osk_*) remain server-side only.",
  },
  {
    question: "What data gets synced from my coding sessions?",
    answer:
      "Session metadata (project, directory, branch, timestamps), user prompts, assistant responses, tool calls and their outcomes, token usage, and model information. Sensitive data like passwords, tokens, and API keys are automatically redacted before sync. Full file contents are not synced - only paths and lengths.",
  },
  {
    question: "What is semantic search?",
    answer:
      "Semantic search uses AI embeddings to find sessions by meaning rather than exact keywords. For example, searching 'authentication issues' will find sessions about 'login bugs' or 'JWT token problems' even if those exact words weren't used. OpenSync uses OpenAI's text-embedding-3-small model for this.",
  },
  {
    question: "Can I use my session data with other LLMs?",
    answer:
      "Yes. The /api/context endpoint retrieves relevant session content formatted for LLM context injection. You can use this for RAG pipelines, context engineering, or feeding your coding history into any LLM. Export options include JSON, Markdown, and JSONL formats.",
  },
  {
    question: "How do I generate an API key?",
    answer:
      "Go to Settings in the dashboard and click 'Generate API Key'. Your key will start with 'osk_' and can be used in the Authorization header for all API endpoints. Keep this key secure - it provides full access to your session data.",
  },
];

// FAQ Item component
function FaqItem({ question, answer, theme }: { question: string; answer: string; theme: "dark" | "tan" }) {
  const [isOpen, setIsOpen] = useState(false);
  const t = getThemeClasses(theme);

  return (
    <div className={cn("rounded-lg border", t.border, t.bgCard)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn("flex w-full items-center justify-between p-4 text-left transition-colors", t.bgHover)}
      >
        <span className={cn("text-sm font-medium", t.textSecondary)}>{question}</span>
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
          <p className={cn("text-xs leading-relaxed", t.textSubtle)}>{answer}</p>
        </div>
      )}
    </div>
  );
}

export function DocsPage() {
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const convexUrl =
    import.meta.env.VITE_CONVEX_URL?.replace(".cloud", ".site") ||
    "https://your-app.convex.site";

  return (
    <div className={cn("min-h-screen", t.bgPrimary, t.textPrimary)}>
      {/* Subtle gradient overlay */}
      <div className={cn(
        "pointer-events-none fixed inset-0",
        theme === "dark" 
          ? "bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.02),_transparent_50%)]"
          : "bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.02),_transparent_50%)]"
      )} />

      {/* Header */}
      <header className={cn("sticky top-0 z-10 border-b backdrop-blur-sm", t.border, theme === "dark" ? "bg-[#0E0E0E]/90" : "bg-[#faf8f5]/90")}>
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-6">
          <Link
            to="/"
            className={cn("flex items-center gap-2 text-sm transition-colors", t.textSubtle)}
          >
            <ArrowLeft className="h-4 w-4" />
            back
          </Link>
          <span className={cn("text-sm font-medium", t.textMuted)}>opensync</span>
          <button
            onClick={toggleTheme}
            className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
            title={theme === "dark" ? "Switch to tan mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Page title */}
        <h1 className={cn("text-2xl font-semibold", t.textPrimary)}>Documentation</h1>
        <p className={cn("mt-2 text-sm", t.textSubtle)}>
          Sync, search, and share your OpenCode and Claude Code sessions with
          Convex
        </p>

        {/* OpenCode Sync Plugin */}
        <section className="mt-12">
          <h2 className={cn("mb-4 text-sm font-medium uppercase tracking-wider", t.textSubtle)}>
            OpenCode Sync Plugin
          </h2>
          <p className={cn("mb-4 text-xs", t.textSubtle)}>
            Sync your OpenCode sessions to the cloud automatically.
          </p>
          <div className="space-y-3">
            <div className={cn("rounded-lg border p-4", t.border, t.bgCard)}>
              <p className={cn("mb-2 text-sm", t.textSecondary)}>1. Install the plugin</p>
              <pre className={cn("overflow-x-auto rounded p-3 text-xs", t.bgCode, t.textMuted)}>
                <code>npm install -g opencode-sync-plugin</code>
              </pre>
            </div>

            <div className={cn("rounded-lg border p-4", t.border, t.bgCard)}>
              <p className={cn("mb-2 text-sm", t.textSecondary)}>2. Authenticate</p>
              <pre className={cn("overflow-x-auto rounded p-3 text-xs", t.bgCode, t.textMuted)}>
                <code>opencode-sync login</code>
              </pre>
              <p className={cn("mt-2 text-xs", t.textDim)}>
                Enter the Convex URL:{" "}
                <code className={cn("rounded px-1", t.bgCode)}>{convexUrl}</code>
              </p>
            </div>

            <div className={cn("rounded-lg border p-4", t.border, t.bgCard)}>
              <p className={cn("mb-2 text-sm", t.textSecondary)}>
                3. Add to your opencode.json
              </p>
              <pre className={cn("overflow-x-auto rounded p-3 text-xs", t.bgCode, t.textMuted)}>
                <code>{`{
  "plugin": ["opencode-sync-plugin"]
}`}</code>
              </pre>
            </div>

            <div className={cn("rounded-lg border p-4", t.border, t.bgCard)}>
              <p className={cn("mb-2 text-sm", t.textSecondary)}>Commands</p>
              <div className={cn("space-y-2 text-xs", t.textSubtle)}>
                <div>
                  <code className={cn("rounded px-1", t.bgCode)}>opencode-sync login</code>
                  <span className="ml-2">Authenticate with the backend</span>
                </div>
                <div>
                  <code className={cn("rounded px-1", t.bgCode)}>opencode-sync status</code>
                  <span className="ml-2">Check sync status and configuration</span>
                </div>
                <div>
                  <code className={cn("rounded px-1", t.bgCode)}>opencode-sync sync</code>
                  <span className="ml-2">Manually sync current session</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Claude Code Sync Plugin */}
        <section className="mt-12">
          <h2 className={cn("mb-4 text-sm font-medium uppercase tracking-wider", t.textSubtle)}>
            Claude Code Sync Plugin
          </h2>
          <p className={cn("mb-4 text-xs", t.textSubtle)}>
            Sync your Claude Code sessions to the same dashboard.
          </p>
          <div className="space-y-3">
            <div className={cn("rounded-lg border p-4", t.border, t.bgCard)}>
              <p className={cn("mb-2 text-sm", t.textSecondary)}>1. Install from marketplace</p>
              <pre className={cn("overflow-x-auto rounded p-3 text-xs", t.bgCode, t.textMuted)}>
                <code>/plugin install yourusername/claude-code-sync</code>
              </pre>
              <p className={cn("mt-2 text-xs", t.textDim)}>
                Or during development:
              </p>
              <pre className={cn("mt-2 overflow-x-auto rounded p-3 text-xs", t.bgCode, t.textMuted)}>
                <code>claude --plugin-dir /path/to/claude-code-sync</code>
              </pre>
            </div>

            <div className={cn("rounded-lg border p-4", t.border, t.bgCard)}>
              <p className={cn("mb-2 text-sm", t.textSecondary)}>2. Configure</p>
              <p className={cn("mb-2 text-xs", t.textDim)}>
                Create <code className={cn("rounded px-1", t.bgCode)}>~/.claude-code-sync.json</code>:
              </p>
              <pre className={cn("overflow-x-auto rounded p-3 text-xs", t.bgCode, t.textMuted)}>
                <code>{`{
  "convex_url": "${convexUrl.replace(".site", ".cloud")}",
  "api_key": "osk_your_api_key",
  "auto_sync": true,
  "sync_tool_calls": true,
  "sync_thinking": false
}`}</code>
              </pre>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <p className="mb-2 text-sm text-zinc-300">Configuration options</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-zinc-500">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="pb-2 text-left font-medium text-zinc-400">Option</th>
                      <th className="pb-2 text-left font-medium text-zinc-400">Default</th>
                      <th className="pb-2 text-left font-medium text-zinc-400">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    <tr>
                      <td className="py-2"><code>convex_url</code></td>
                      <td className="py-2">required</td>
                      <td className="py-2">Your Convex deployment URL</td>
                    </tr>
                    <tr>
                      <td className="py-2"><code>api_key</code></td>
                      <td className="py-2">optional</td>
                      <td className="py-2">API key from Settings page</td>
                    </tr>
                    <tr>
                      <td className="py-2"><code>auto_sync</code></td>
                      <td className="py-2">true</td>
                      <td className="py-2">Sync when sessions end</td>
                    </tr>
                    <tr>
                      <td className="py-2"><code>sync_tool_calls</code></td>
                      <td className="py-2">true</td>
                      <td className="py-2">Include tool call details</td>
                    </tr>
                    <tr>
                      <td className="py-2"><code>sync_thinking</code></td>
                      <td className="py-2">false</td>
                      <td className="py-2">Include reasoning traces</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <p className="mb-2 text-sm text-zinc-300">Commands</p>
              <div className="space-y-2 text-xs text-zinc-500">
                <div>
                  <code className="rounded bg-zinc-800 px-1">/claude-code-sync:sync-status</code>
                  <span className="ml-2">Check configuration and connection</span>
                </div>
                <div>
                  <code className="rounded bg-zinc-800 px-1">/claude-code-sync:sync-now</code>
                  <span className="ml-2">Manually sync current session</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <p className="mb-2 text-sm text-zinc-300">What gets synced</p>
              <ul className="list-inside list-disc space-y-1 text-xs text-zinc-500">
                <li>Session metadata: project, directory, branch, timestamps</li>
                <li>User prompts (truncated for privacy)</li>
                <li>Tool calls and their outcomes</li>
                <li>Token usage: input and output counts</li>
                <li>Model information</li>
              </ul>
              <p className="mt-2 text-xs text-zinc-600">
                Sensitive data like passwords and API keys are automatically redacted.
              </p>
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            API Reference
          </h2>
          <p className="mb-4 text-xs text-zinc-600">
            All endpoints require authentication via Bearer token (API key or
            JWT). Generate an API key in Settings.
          </p>

          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  GET
                </span>
                <code className="text-sm text-zinc-300">/api/sessions</code>
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                List all sessions for the authenticated user.
              </p>
              <pre className="overflow-x-auto rounded bg-[#0E0E0E] p-3 text-[11px] text-zinc-500">
                {`curl "${convexUrl}/api/sessions" \\
  -H "Authorization: Bearer osk_your_api_key"`}
              </pre>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  GET
                </span>
                <code className="text-sm text-zinc-300">/api/sessions/get</code>
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                Get a single session with all messages and parts.
              </p>
              <p className="mb-2 text-[10px] text-zinc-600">
                <span className="text-zinc-500">Parameters:</span> id (required)
              </p>
              <pre className="overflow-x-auto rounded bg-[#0E0E0E] p-3 text-[11px] text-zinc-500">
                {`curl "${convexUrl}/api/sessions/get?id=session_id" \\
  -H "Authorization: Bearer osk_your_api_key"`}
              </pre>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  GET
                </span>
                <code className="text-sm text-zinc-300">/api/search</code>
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                Search sessions. Supports full-text, semantic, and hybrid
                search.
              </p>
              <p className="mb-2 text-[10px] text-zinc-600">
                <span className="text-zinc-500">Parameters:</span> q (required),
                limit, type (fulltext|semantic|hybrid)
              </p>
              <pre className="overflow-x-auto rounded bg-[#0E0E0E] p-3 text-[11px] text-zinc-500">
                {`curl "${convexUrl}/api/search?q=authentication&type=semantic" \\
  -H "Authorization: Bearer osk_your_api_key"`}
              </pre>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  GET
                </span>
                <code className="text-sm text-zinc-300">/api/context</code>
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                Get relevant session content for LLM context. Perfect for RAG
                pipelines.
              </p>
              <p className="mb-2 text-[10px] text-zinc-600">
                <span className="text-zinc-500">Parameters:</span> q (required),
                limit, format (text|messages)
              </p>
              <pre className="overflow-x-auto rounded bg-[#0E0E0E] p-3 text-[11px] text-zinc-500">
                {`curl "${convexUrl}/api/context?q=react+hooks&format=text&limit=5" \\
  -H "Authorization: Bearer osk_your_api_key"`}
              </pre>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  GET
                </span>
                <code className="text-sm text-zinc-300">/api/export</code>
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                Export a session in various formats.
              </p>
              <p className="mb-2 text-[10px] text-zinc-600">
                <span className="text-zinc-500">Parameters:</span> id
                (required), format (json|markdown|jsonl)
              </p>
              <pre className="overflow-x-auto rounded bg-[#0E0E0E] p-3 text-[11px] text-zinc-500">
                {`curl "${convexUrl}/api/export?id=session_id&format=markdown" \\
  -H "Authorization: Bearer osk_your_api_key"`}
              </pre>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  GET
                </span>
                <code className="text-sm text-zinc-300">/api/stats</code>
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                Get usage statistics: session count, tokens, cost, model breakdown.
              </p>
              <pre className="overflow-x-auto rounded bg-[#0E0E0E] p-3 text-[11px] text-zinc-500">
                {`curl "${convexUrl}/api/stats" \\
  -H "Authorization: Bearer osk_your_api_key"`}
              </pre>
            </div>
          </div>
        </section>

        {/* Search Types */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Search Types
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <p className="text-sm font-medium text-zinc-300">Full-Text</p>
              <p className="mt-1 text-xs text-zinc-500">
                Keyword matching. Fast and exact.
              </p>
              <code className="mt-2 block text-[10px] text-zinc-600">
                ?type=fulltext
              </code>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <p className="text-sm font-medium text-zinc-300">Semantic</p>
              <p className="mt-1 text-xs text-zinc-500">
                Meaning-based search using embeddings.
              </p>
              <code className="mt-2 block text-[10px] text-zinc-600">
                ?type=semantic
              </code>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
              <p className="text-sm font-medium text-zinc-300">Hybrid</p>
              <p className="mt-1 text-xs text-zinc-500">
                Combines both methods using RRF.
              </p>
              <code className="mt-2 block text-[10px] text-zinc-600">
                ?type=hybrid
              </code>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Privacy
          </h2>
          <div className="rounded-lg border border-zinc-800 bg-[#161616] p-4">
            <ul className="list-inside list-disc space-y-1 text-xs text-zinc-500">
              <li>All data goes to YOUR Convex deployment. No third parties.</li>
              <li>Sensitive fields (passwords, tokens, keys) are redacted before sync.</li>
              <li>Full file contents are not synced, only paths and lengths.</li>
              <li>Thinking traces are off by default.</li>
              <li>You control what gets synced via configuration.</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className={cn("mb-4 text-sm font-medium uppercase tracking-wider", t.textSubtle)}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <FaqItem key={index} question={faq.question} answer={faq.answer} theme={theme} />
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Resources
          </h2>
          <div className="space-y-2">
            <a
              href="https://github.com/your-org/opencode-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-[#161616] p-3 transition-colors hover:border-zinc-700"
            >
              <Github className="h-4 w-4 text-zinc-500" />
              <span className="flex-1 text-sm text-zinc-300">
                OpenCode Sync Plugin
              </span>
              <ExternalLink className="h-3 w-3 text-zinc-600" />
            </a>
            <a
              href="https://github.com/your-org/claude-code-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-[#161616] p-3 transition-colors hover:border-zinc-700"
            >
              <Github className="h-4 w-4 text-zinc-500" />
              <span className="flex-1 text-sm text-zinc-300">
                Claude Code Sync Plugin
              </span>
              <ExternalLink className="h-3 w-3 text-zinc-600" />
            </a>
            <a
              href="https://docs.convex.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-[#161616] p-3 transition-colors hover:border-zinc-700"
            >
              <ExternalLink className="h-4 w-4 text-zinc-500" />
              <span className="flex-1 text-sm text-zinc-300">
                Convex Documentation
              </span>
              <ExternalLink className="h-3 w-3 text-zinc-600" />
            </a>
            <a
              href="https://docs.convex.dev/auth/authkit/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-[#161616] p-3 transition-colors hover:border-zinc-700"
            >
              <ExternalLink className="h-4 w-4 text-zinc-500" />
              <span className="flex-1 text-sm text-zinc-300">
                Convex + WorkOS AuthKit
              </span>
              <ExternalLink className="h-3 w-3 text-zinc-600" />
            </a>
            <a
              href="https://docs.convex.dev/search/vector-search"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-[#161616] p-3 transition-colors hover:border-zinc-700"
            >
              <ExternalLink className="h-4 w-4 text-zinc-500" />
              <span className="flex-1 text-sm text-zinc-300">
                Convex Vector Search
              </span>
              <ExternalLink className="h-3 w-3 text-zinc-600" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className={cn("mt-16 border-t pt-8 text-center", t.border)}>
          <p className={cn("text-xs", t.textDim)}>
            Built on{" "}
            <a
              href="https://convex.dev"
              className={cn("transition-colors", t.textSubtle)}
            >
              Convex
            </a>{" "}
            and{" "}
            <a
              href="https://workos.com"
              className={cn("transition-colors", t.textSubtle)}
            >
              WorkOS
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
