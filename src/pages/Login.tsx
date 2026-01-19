import { useAuth } from "../lib/auth";
import { useAuth as useAuthKit } from "@workos-inc/authkit-react";
import { Navigate } from "react-router-dom";
import { Loader2, Sun, Moon, Github } from "lucide-react";
import { useTheme } from "../lib/theme";

const ASCII_LOGO = `
 ██████╗ ██████╗ ███████╗███╗   ██╗███████╗██╗   ██╗███╗   ██╗ ██████╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
██║   ██║██████╔╝█████╗  ██╔██╗ ██║███████╗ ╚████╔╝ ██╔██╗ ██║██║     
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║╚════██║  ╚██╔╝  ██║╚██╗██║██║     
╚██████╔╝██║     ███████╗██║ ╚████║███████║   ██║   ██║ ╚████║╚██████╗
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝`;

// Mock session data for the dashboard preview with source badges
const MOCK_SESSIONS = [
  { id: "01", title: "auth-flow-setup", time: "2m ago", tokens: "1.2k", source: "cc" as const },
  { id: "02", title: "api-refactor", time: "15m ago", tokens: "3.4k", source: "oc" as const },
  { id: "03", title: "search-component", time: "1h ago", tokens: "892", source: "cc" as const },
  { id: "04", title: "db-migration", time: "3h ago", tokens: "2.1k", source: "oc" as const },
];

// Small theme switcher component for footer
function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`p-1.5 rounded-md transition-colors ${
        isDark
          ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
      }`}
      title={isDark ? "Switch to tan mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

export function LoginPage() {
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth();
  // Get WorkOS user state directly to detect auth sync issues
  const { user: workosUser, isLoading: workosLoading } = useAuthKit();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Show loading state while processing callback or checking auth
  if (isLoading || workosLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0E0E0E]" : "bg-[#faf8f5]"}`}>
        <div className="text-center">
          <Loader2 className={`h-6 w-6 animate-spin mx-auto ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`} />
          <p className={`mt-3 text-sm ${isDark ? "text-zinc-500" : "text-[#6b6b6b]"}`}>Signing in...</p>
        </div>
      </div>
    );
  }

  // If fully authenticated with both WorkOS and Convex, go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user is logged into WorkOS but Convex auth failed
  const hasWorkosUser = !!workosUser;
  const authSyncIssue = hasWorkosUser && !isAuthenticated;

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0E0E0E] text-zinc-100" : "bg-[#faf8f5] text-[#1a1a1a]"}`}>
      {/* Subtle gradient overlay */}
      <div className={`pointer-events-none fixed inset-0 ${
        isDark 
          ? "bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.02),_transparent_50%)]"
          : "bg-[radial-gradient(ellipse_at_top,_rgba(139,115,85,0.03),_transparent_50%)]"
      }`} />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        {/* Main content */}
        <main className="flex flex-1 items-center">
          <div className="grid w-full gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left side: ASCII logo and text */}
            <div className="flex flex-col justify-center">
              {/* ASCII Logo */}
              <pre className={`overflow-x-auto text-[7px] leading-tight md:text-[9px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}>
                {ASCII_LOGO}
              </pre>

              {/* Tagline */}
              <h2 className={`mt-6 text-lg font-medium sm:text-xl ${isDark ? "text-zinc-200" : "text-[#1a1a1a]"}`}>
                Dashboards for OpenCode and Claude coding sessions
              </h2>
              <p className={`mt-2 text-sm sm:text-base ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}>
                Cloud-synced dashboards that track session activity, tool usage, and token spend. Build eval datasets across projects.
              </p>

              {/* Feature list - colors from VSCode TypeScript theme */}
              <div className={`mt-6 space-y-2 text-sm ${isDark ? "text-zinc-500" : "text-[#6b6b6b]"}`}>
                <p>
                  <span className={`font-mono ${isDark ? "text-[#c586c0]" : "text-[#9b4d96]"}`}>Sync</span> sessions from CLI
                  to cloud
                </p>
                <p>
                  <span className={`font-mono ${isDark ? "text-[#EBC101]" : "text-[#8b7355]"}`}>Search</span> with full text
                  and semantic lookup
                </p>
                <p>
                  <span className={`font-mono ${isDark ? "text-[#EB1301]" : "text-[#a05d3b]"}`}>Private</span> your data stays
                  in your account. 
                </p>
                <p>
                  <span className={`font-mono ${isDark ? "text-[#A3DD2E]" : "text-[#a05d3b]"}`}>Tag</span> sessions with custom labels for eval organization
                </p>
                <p>
                  <span className={`font-mono ${isDark ? "text-[#9cdcfe]" : "text-[#3d7ea6]"}`}>Export</span> sessions for evals in DeepEval, OpenAI, or plain text
                </p>
                <p>
                  <span className="text-[#EB5601] font-mono">Delete</span> your data, your control, delete your sessions anytime.
                </p>
              </div>

              {/* CTA */}
              {authSyncIssue ? (
                <div className="mt-8 space-y-3">
                  <div className={`rounded-md border px-4 py-3 ${
                    isDark 
                      ? "border-amber-800/50 bg-amber-900/20" 
                      : "border-amber-600/30 bg-amber-50"
                  }`}>
                    <p className={`text-sm ${isDark ? "text-amber-200" : "text-amber-800"}`}>
                      Signed in as {workosUser?.email}
                    </p>
                    <p className={`mt-1 text-xs ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>
                      Backend sync pending. Try signing out and back in.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={signOut}
                      className={`w-fit rounded-md border px-6 py-2.5 text-sm font-medium transition-colors ${
                        isDark
                          ? "border-zinc-700 bg-[#0E0E0E] text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900"
                          : "border-[#e6e4e1] bg-[#faf8f5] text-[#1a1a1a] hover:border-[#8b7355] hover:bg-[#f5f3f0]"
                      }`}
                    >
                      Sign out
                    </button>
                    <button
                      onClick={signIn}
                      className={`w-fit rounded-md border px-6 py-2.5 text-sm font-medium transition-colors ${
                        isDark
                          ? "border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                          : "border-[#8b7355] bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e6e4e1]"
                      }`}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={signIn}
                    className={`w-fit rounded-md border px-6 py-2.5 text-sm font-medium transition-colors ${
                      isDark
                        ? "border-zinc-700 bg-[#0E0E0E] text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900"
                        : "border-[#e6e4e1] bg-[#faf8f5] text-[#1a1a1a] hover:border-[#8b7355] hover:bg-[#f5f3f0]"
                    }`}
                  >
                    Sign in
                  </button>
                  <a
                    href="/docs"
                    className={`w-fit rounded-md border px-6 py-2.5 text-sm font-medium transition-colors ${
                      isDark
                        ? "border-zinc-700 bg-[#0E0E0E] text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900"
                        : "border-[#e6e4e1] bg-[#faf8f5] text-[#1a1a1a] hover:border-[#8b7355] hover:bg-[#f5f3f0]"
                    }`}
                  >
                    Docs
                  </a>
                </div>
              )}

              {/* Export formats */}
              <div className={`mt-6 flex flex-wrap gap-4 text-xs ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>
                <span>JSON</span>
                <span>JSONL</span>
                <span>Markdown</span>
                <span>Token stats</span>
              </div>

              {/* Trust message */}
              <div className={`mt-6 rounded-md border px-4 py-3 ${
                isDark 
                  ? "border-zinc-800 bg-zinc-900/50" 
                  : "border-[#e6e4e1] bg-[#f5f3f0]"
              }`}>
                <p className={`text-xs ${isDark ? "text-zinc-100" : "text-[#6b6b6b]"}`}>
                  Your sessions stay private. Unsync or delete your data from the database anytime.
                </p>
              </div>
            </div>

            {/* Right side: Mini dashboard mock (desktop only) + Getting started (all screens) */}
            <div className="flex flex-col gap-6">
              {/* Dashboard preview - desktop only */}
              <div className={`hidden lg:block overflow-hidden rounded-lg border ${
                isDark ? "border-zinc-800 bg-[#161616]" : "border-[#e6e4e1] bg-[#f5f3f0]"
              }`}>
                {/* Window chrome */}
                <div className={`flex items-center gap-2 border-b px-4 py-3 ${
                  isDark ? "border-zinc-800" : "border-[#e6e4e1]"
                }`}>
                  <div className="flex gap-1.5">
                    <div className={`h-3 w-3 rounded-full ${isDark ? "bg-zinc-700" : "bg-[#e6e4e1]"}`} />
                    <div className={`h-3 w-3 rounded-full ${isDark ? "bg-zinc-700" : "bg-[#e6e4e1]"}`} />
                    <div className={`h-3 w-3 rounded-full ${isDark ? "bg-zinc-700" : "bg-[#e6e4e1]"}`} />
                  </div>
                  <span className={`ml-2 text-xs ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}>
                    opensync dashboard
                  </span>
                  {/* View tabs */}
                  <div className={`ml-auto flex items-center gap-1 rounded p-0.5 ${
                    isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"
                  }`}>
                    {["overview", "sessions", "evals", "analytics"].map((tab, i) => (
                      <span
                        key={tab}
                        className={`px-2 py-0.5 text-[9px] rounded capitalize ${
                          i === 0
                            ? isDark
                              ? "bg-zinc-700 text-zinc-200"
                              : "bg-white text-[#1a1a1a]"
                            : isDark
                              ? "text-zinc-500"
                              : "text-[#8b7355]"
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="flex">
                  {/* Sidebar */}
                  <div className={`w-48 border-r p-3 ${isDark ? "border-zinc-800" : "border-[#e6e4e1]"}`}>
                    <p className={`mb-2 text-[10px] font-medium uppercase tracking-wider ${
                      isDark ? "text-zinc-600" : "text-[#8b7355]"
                    }`}>
                      Sessions
                    </p>
                    <div className="space-y-1">
                      {MOCK_SESSIONS.map((session, i) => (
                        <div
                          key={session.id}
                          className={`cursor-pointer rounded px-2 py-1.5 text-xs ${
                            i === 0
                              ? isDark 
                                ? "bg-zinc-800 text-zinc-200" 
                                : "bg-[#ebe9e6] text-[#1a1a1a]"
                              : isDark 
                                ? "text-zinc-500 hover:bg-zinc-800/50" 
                                : "text-[#6b6b6b] hover:bg-[#ebe9e6]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {/* Source badge */}
                            <span className={`shrink-0 px-1 py-0.5 rounded text-[8px] font-medium uppercase ${
                              session.source === "cc"
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-blue-500/15 text-blue-400"
                            }`}>
                              {session.source}
                            </span>
                            <span className="truncate">{session.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main panel */}
                  <div className="flex-1 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}>
                          auth-flow-setup
                        </p>
                        <p className={`text-xs ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>2 minutes ago</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] ${
                          isDark ? "bg-zinc-800 text-zinc-400" : "bg-[#ebe9e6] text-[#6b6b6b]"
                        }`}>
                          1.2k tokens
                        </span>
                        <span className={`rounded px-2 py-0.5 text-[10px] ${
                          isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          synced
                        </span>
                      </div>
                    </div>

                    {/* Mock message preview */}
                    <div className={`space-y-3 rounded border p-3 ${
                      isDark ? "border-zinc-800 bg-[#0E0E0E]" : "border-[#e6e4e1] bg-[#faf8f5]"
                    }`}>
                      <div className="text-xs">
                        <p className={`mb-1 ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>user</p>
                        <p className={isDark ? "text-zinc-400" : "text-[#6b6b6b]"}>
                          Add authentication to the API routes
                        </p>
                      </div>
                      <div className="text-xs">
                        <p className={`mb-1 ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>assistant</p>
                        <p className={isDark ? "text-zinc-400" : "text-[#6b6b6b]"}>
                          I'll add JWT validation middleware...
                        </p>
                      </div>
                    </div>

                    {/* Stats row - 4 stats matching dashboard */}
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      <div className={`rounded p-2 ${isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"}`}>
                        <p className={`text-lg font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}>24</p>
                        <p className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>sessions</p>
                      </div>
                      <div className={`rounded p-2 ${isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"}`}>
                        <p className={`text-lg font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}>
                          42.1k
                        </p>
                        <p className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>tokens</p>
                      </div>
                      <div className={`rounded p-2 ${isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"}`}>
                        <p className={`text-lg font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}>$1.24</p>
                        <p className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>cost</p>
                      </div>
                      <div className={`rounded p-2 ${isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"}`}>
                        <p className={`text-lg font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}>2h 14m</p>
                        <p className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>duration</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Getting started section */}
              <div className={`rounded-lg border p-4 ${
                isDark ? "border-zinc-800 bg-[#161616]" : "border-[#e6e4e1] bg-[#f5f3f0]"
              }`}>
                <h3 className={`text-sm font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}>
                  Getting started
                </h3>
                <p className={`mt-2 text-[11px] ${isDark ? "text-zinc-500" : "text-[#6b6b6b]"}`}>
                  Install one of the sync plugins to send session data to your dashboard.
                </p>

                <div className="mt-3 space-y-2">
                  {/* Claude Code Sync */}
                  <a
                    href="https://www.npmjs.com/package/claude-code-sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                      isDark 
                        ? "border-zinc-800 bg-[#0E0E0E] hover:border-zinc-700" 
                        : "border-[#e6e4e1] bg-[#faf8f5] hover:border-[#8b7355]"
                    }`}
                  >
                    <span className={`font-mono text-xs ${
                      isDark 
                        ? "text-zinc-100 group-hover:text-zinc-300" 
                        : "text-[#6b6b6b] group-hover:text-[#1a1a1a]"
                    }`}>
                      claude-code-sync
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                      isDark ? "bg-zinc-800 text-zinc-600" : "bg-[#ebe9e6] text-[#8b7355]"
                    }`}>
                      npm
                    </span>
                  </a>

                  {/* OpenCode Sync Plugin */}
                  <a
                    href="https://www.npmjs.com/package/opencode-sync-plugin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                      isDark 
                        ? "border-zinc-800 bg-[#0E0E0E] hover:border-zinc-700" 
                        : "border-[#e6e4e1] bg-[#faf8f5] hover:border-[#8b7355]"
                    }`}
                  >
                    <span className={`font-mono text-xs ${
                      isDark 
                        ? "text-zinc-100 group-hover:text-zinc-300" 
                        : "text-[#6b6b6b] group-hover:text-[#1a1a1a]"
                    }`}>
                      opencode-sync-plugin
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                      isDark ? "bg-zinc-800 text-zinc-600" : "bg-[#ebe9e6] text-[#8b7355]"
                    }`}>
                      npm
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={`mt-8 flex flex-col items-center gap-3 text-xs ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>
          <a
            href="https://github.com/waynesutton/opensync"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors ${isDark ? "text-zinc-500 hover:text-zinc-300" : "text-[#6b6b6b] hover:text-[#1a1a1a]"}`}
          >
            Open Source project
          </a>
          <div className="flex flex-col items-center gap-2">
            <span>built with</span>
            <div className="flex items-center gap-3">
              <a
                href="https://convex.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
                title="Convex"
              >
                <img
                  src="/convex.svg"
                  alt="Convex"
                  className={`h-2 w-auto ${isDark ? "invert" : ""}`}
                />
              </a>
              <span className={isDark ? "text-zinc-500" : "text-[#8b7355]"}>+</span>
              <a
                href="https://workos.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
                title="WorkOS"
              >
                <img
                  src="/workos.svg"
                  alt="WorkOS"
                  className={`h-3 w-auto ${isDark ? "invert" : ""}`}
                />
              </a>
              <span className={isDark ? "text-zinc-500" : "text-[#8b7355]"}>+</span>
              <a
                href="https://netlify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
                title="Netlify"
              >
                <img
                  src="/netlify-logo.svg"
                  alt="Netlify"
                  className={`h-5 w-auto ${isDark ? "" : "invert"}`}
                />
              </a>
            </div>
          </div>

          {/* GitHub link - positioned in bottom left */}
          <div className="fixed bottom-4 left-4">
            <a
              href="https://github.com/waynesutton/opensync"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
              }`}
              title="View on GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>

          {/* Theme switcher - positioned in bottom right */}
          <div className="fixed bottom-4 right-4">
            <ThemeSwitcher />
          </div>
        </footer>
      </div>
    </div>
  );
}
