import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useAuth as useAuthKit } from "@workos-inc/authkit-react";
import {
  Loader2,
  Sun,
  Moon,
  Github,
  MessageCircleQuestion,
  Trophy,
  Zap,
  MessagesSquare,
} from "lucide-react";
import { useTheme } from "../lib/theme";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  LegalModal,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
} from "../components/LegalModal";

const ASCII_LOGO = `
 ██████╗ ██████╗ ███████╗███╗   ██╗███████╗██╗   ██╗███╗   ██╗ ██████╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
██║   ██║██████╔╝█████╗  ██╔██╗ ██║███████╗ ╚████╔╝ ██╔██╗ ██║██║     
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║╚════██║  ╚██╔╝  ██║╚██╗██║██║     
╚██████╔╝██║     ███████╗██║ ╚████║███████║   ██║   ██║ ╚████║╚██████╗
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝`;

// Mock session data for the dashboard preview with source badges
const MOCK_SESSIONS = [
  {
    id: "01",
    title: "auth-flow-setup",
    time: "2m ago",
    tokens: "1.2k",
    source: "cc" as const,
  },
  {
    id: "02",
    title: "api-refactor",
    time: "15m ago",
    tokens: "3.4k",
    source: "oc" as const,
  },
  {
    id: "03",
    title: "search-component",
    time: "1h ago",
    tokens: "892",
    source: "cc" as const,
  },
  {
    id: "04",
    title: "db-migration",
    time: "3h ago",
    tokens: "2.1k",
    source: "oc" as const,
  },
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
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

// Legal links component for footer (Terms and Privacy)
function LegalLinks() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowTerms(true)}
        className={`text-xs transition-colors ${
          isDark
            ? "text-zinc-600 hover:text-zinc-400"
            : "text-[#8b7355] hover:text-[#6b6b6b]"
        }`}
      >
        Terms
      </button>
      <span className={isDark ? "text-zinc-700" : "text-[#ccc7c0]"}>|</span>
      <button
        onClick={() => setShowPrivacy(true)}
        className={`text-xs transition-colors ${
          isDark
            ? "text-zinc-600 hover:text-zinc-400"
            : "text-[#8b7355] hover:text-[#6b6b6b]"
        }`}
      >
        Privacy
      </button>

      {/* Legal modals */}
      <LegalModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
        content={TERMS_OF_SERVICE}
      />
      <LegalModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
        content={PRIVACY_POLICY}
      />
    </>
  );
}

// Helper to format large numbers (e.g., 1234567 -> "1.2M")
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "k";
  }
  return num.toLocaleString();
}

// Helper to get display name for CLI source
function getSourceDisplayName(source: string): string {
  const names: Record<string, string> = {
    opencode: "OpenCode",
    "claude-code": "Claude Code",
    cursor: "Cursor",
    droid: "Droid",
    codex: "Codex",
    "codex-cli": "Codex CLI",
    amp: "Amp",
  };
  return names[source] || source;
}

// Real-time platform leaderboard component (two boxes: Top Models, Top CLI)
function PlatformLeaderboard({ isDark }: { isDark: boolean }) {
  const platformStats = useQuery(api.analytics.publicPlatformStats);

  // No spinner - Convex is real-time, data appears when ready
  // Show the container with "No data yet" if empty
  const topModels = platformStats?.topModels ?? [];
  const topSources = platformStats?.topSources ?? [];

  return (
    <div
      className={`mt-10 rounded-lg border p-5 ${
        isDark
          ? "border-zinc-800 bg-[#161616]"
          : "border-[#e6e4e1] bg-[#f5f3f0]"
      }`}
    >
      <h3
        className={`text-sm font-medium mb-5 flex items-center gap-2 ${
          isDark ? "text-zinc-300" : "text-[#1a1a1a]"
        }`}
      >
        <Zap
          className={`h-4 w-4 ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
        />
        Platform Stats
        <span
          className={`ml-auto text-[10px] font-normal ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
        >
          real-time
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top Models */}
        <div
          className={`rounded-md border p-4 ${
            isDark
              ? "border-zinc-800 bg-[#0E0E0E]"
              : "border-[#e6e4e1] bg-[#faf8f5]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Trophy
                className={`h-3 w-3 ${isDark ? "text-amber-500" : "text-amber-600"}`}
              />
              <p
                className={`text-[10px] uppercase tracking-wider ${
                  isDark ? "text-zinc-600" : "text-[#8b7355]"
                }`}
              >
                Top Models
              </p>
            </div>
            <span
              className={`text-[10px] uppercase tracking-wider ${
                isDark ? "text-zinc-600" : "text-[#8b7355]"
              }`}
            >
              tokens
            </span>
          </div>
          <div className="space-y-1.5">
            {topModels.length === 0 ? (
              <p
                className={`text-xs ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
              >
                No data yet
              </p>
            ) : (
              topModels.map((item, index) => (
                <div
                  key={item.model}
                  className="flex items-center justify-between"
                >
                  <span
                    className={`text-xs truncate max-w-[140px] ${
                      isDark ? "text-zinc-400" : "text-[#6b6b6b]"
                    }`}
                  >
                    <span
                      className={`mr-1.5 ${
                        index === 0
                          ? isDark
                            ? "text-amber-500"
                            : "text-amber-600"
                          : isDark
                            ? "text-zinc-600"
                            : "text-[#8b7355]"
                      }`}
                    >
                      {index + 1}.
                    </span>
                    {item.model}
                  </span>
                  <span
                    className={`text-[10px] tabular-nums ${
                      isDark ? "text-zinc-500" : "text-[#8b7355]"
                    }`}
                  >
                    {formatNumber(item.totalTokens)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top CLI (sources: opencode, claude-code, cursor, droid, codex, amp, etc.) */}
        <div
          className={`rounded-md border p-4 ${
            isDark
              ? "border-zinc-800 bg-[#0E0E0E]"
              : "border-[#e6e4e1] bg-[#faf8f5]"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Zap
              className={`h-3 w-3 ${isDark ? "text-blue-400" : "text-[#EB5601]"}`}
            />
            <p
              className={`text-[10px] uppercase tracking-wider ${
                isDark ? "text-zinc-600" : "text-[#8b7355]"
              }`}
            >
              Top CLI
            </p>
          </div>
          <div className="space-y-1.5">
            {topSources.length === 0 ? (
              <p
                className={`text-xs ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
              >
                No data yet
              </p>
            ) : (
              topSources.map((item, index) => (
                <div
                  key={item.source}
                  className="flex items-center justify-between"
                >
                  <span
                    className={`text-xs truncate max-w-[140px] ${
                      isDark ? "text-zinc-400" : "text-[#6b6b6b]"
                    }`}
                  >
                    <span
                      className={`mr-1.5 ${
                        index === 0
                          ? isDark
                            ? "text-blue-400"
                            : "text-[#EB5601]"
                          : isDark
                            ? "text-zinc-600"
                            : "text-[#8b7355]"
                      }`}
                    >
                      {index + 1}.
                    </span>
                    {getSourceDisplayName(item.source)}
                  </span>
                  <span
                    className={`text-[10px] tabular-nums ${
                      isDark ? "text-zinc-500" : "text-[#8b7355]"
                    }`}
                  >
                    {item.sessions} sessions
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// TEMP: Stats components moved to /stats page
// See src/pages/Stats.tsx for MessageMilestoneCounter and AnimatedGrowthChart

export function LoginPage() {
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth();
  // Get WorkOS user state directly to detect auth sync issues
  const { user: workosUser, isLoading: workosLoading } = useAuthKit();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Show loading state while processing callback or checking auth
  if (isLoading || workosLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0E0E0E]" : "bg-[#faf8f5]"}`}
      >
        <div className="text-center">
          <Loader2
            className={`h-6 w-6 animate-spin mx-auto ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
          />
          <p
            className={`mt-3 text-sm ${isDark ? "text-zinc-500" : "text-[#6b6b6b]"}`}
          >
            Signing in...
          </p>
        </div>
      </div>
    );
  }

  // Check if user is logged into WorkOS but Convex auth failed
  const hasWorkosUser = !!workosUser;
  const authSyncIssue = hasWorkosUser && !isAuthenticated;

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-[#0E0E0E] text-zinc-100" : "bg-[#faf8f5] text-[#1a1a1a]"}`}
    >
      {/* Subtle gradient overlay */}
      <div
        className={`pointer-events-none fixed inset-0 ${
          isDark
            ? "bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.02),_transparent_50%)]"
            : "bg-[radial-gradient(ellipse_at_top,_rgba(139,115,85,0.03),_transparent_50%)]"
        }`}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12 lg:py-20">
        {/* Main content */}
        <main className="flex flex-1 items-center">
          <div className="grid w-full gap-16 lg:grid-cols-2 lg:gap-24">
            {/* Left side: ASCII logo and text */}
            <div className="flex flex-col justify-center">
              {/* ASCII Logo */}
              <pre
                className={`overflow-x-auto text-[7px] leading-tight md:text-[9px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
              >
                {ASCII_LOGO}
              </pre>

              {/* Tagline */}
              <h2
                className={`mt-8 text-lg font-medium sm:text-xl ${isDark ? "text-zinc-200" : "text-[#1a1a1a]"}`}
              >
                Dashboards for OpenCode, Claude Code, Codex, Factory Droid, and
                more.
              </h2>
              <p
                className={`mt-3 text-sm sm:text-base leading-relaxed ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
              >
                Cloud dashboards that sync session activity, tool usage, and
                token spend. Build and export eval datasets across projects.
              </p>

              {/* Feature list - colors from VSCode TypeScript theme */}
              <div
                className={`mt-10 space-y-3 text-sm ${isDark ? "text-zinc-500" : "text-[#6b6b6b]"}`}
              >
                <p>
                  <span
                    className={`font-mono ${isDark ? "text-[#c586c0]" : "text-[#9b4d96]"}`}
                  >
                    Sync
                  </span>{" "}
                  sessions from CLI to cloud
                </p>
                <p>
                  <span
                    className={`font-mono ${isDark ? "text-[#EBC101]" : "text-[#8b7355]"}`}
                  >
                    Search
                  </span>{" "}
                  with full text and semantic lookup
                </p>
                <p>
                  <span
                    className={`font-mono ${isDark ? "text-[#EB1301]" : "text-[#a05d3b]"}`}
                  >
                    Private
                  </span>{" "}
                  your data stays in your account.
                </p>
                <p>
                  <span
                    className={`font-mono ${isDark ? "text-[#A3DD2E]" : "text-[#a05d3b]"}`}
                  >
                    Tag
                  </span>{" "}
                  sessions with custom labels for eval organization
                </p>
                <p>
                  <span
                    className={`font-mono ${isDark ? "text-[#9cdcfe]" : "text-[#3d7ea6]"}`}
                  >
                    Export
                  </span>{" "}
                  sessions for evals in DeepEval, OpenAI, or plain text
                </p>
                <p>
                  <span className="text-[#EB5601] font-mono">Delete</span> your
                  data, your control, delete your sessions anytime.
                </p>
              </div>

              {/* CTA - different buttons based on auth state */}
              {isAuthenticated ? (
                // Logged in: show dashboard link
                <div className="mt-10 flex flex-wrap gap-3">
                  <a
                    href="/dashboard"
                    className={`w-fit rounded-md border px-6 py-2.5 text-sm font-medium transition-colors ${
                      isDark
                        ? "border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                        : "border-[#8b7355] bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e6e4e1]"
                    }`}
                  >
                    Go to Dashboard
                  </a>
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
                </div>
              ) : authSyncIssue ? (
                // WorkOS user but Convex sync failed
                <div className="mt-10 space-y-3">
                  <div
                    className={`rounded-md border px-4 py-3 ${
                      isDark
                        ? "border-amber-800/50 bg-amber-900/20"
                        : "border-amber-600/30 bg-amber-50"
                    }`}
                  >
                    <p
                      className={`text-sm ${isDark ? "text-amber-200" : "text-amber-800"}`}
                    >
                      Signed in as {workosUser?.email}
                    </p>
                    <p
                      className={`mt-1 text-xs ${isDark ? "text-amber-400/70" : "text-amber-600"}`}
                    >
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
                // Not logged in: show sign in
                <div className="mt-10 flex flex-wrap gap-3">
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
                  <a
                    href="https://x.com/waynesutton/status/2013373368117141745?s=20"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-fit rounded-md border px-6 py-2.5 text-sm font-medium transition-colors ${
                      isDark
                        ? "border-zinc-700 bg-[#0E0E0E] text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900"
                        : "border-[#e6e4e1] bg-[#faf8f5] text-[#1a1a1a] hover:border-[#8b7355] hover:bg-[#f5f3f0]"
                    }`}
                  >
                    Watch the demo
                  </a>
                </div>
              )}

              {/* Export formats */}
              <div
                className={`mt-8 flex flex-wrap gap-4 text-xs ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
              >
                <span>JSON</span>
                <span>JSONL</span>
                <span>Markdown</span>
                <span>Token stats</span>
              </div>

              {/* Trust message */}
              <div
                className={`mt-8 rounded-md border px-5 py-4 ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/50"
                    : "border-[#e6e4e1] bg-[#f5f3f0]"
                }`}
              >
                <p
                  className={`text-xs ${isDark ? "text-zinc-100" : "text-[#6b6b6b]"}`}
                >
                  Your sessions stay private. Unsync or delete your data from
                  the database anytime.
                </p>
                <p
                  className={`mt-2 text-xs ${isDark ? "text-zinc-400" : "text-[#8b7355]"}`}
                >
                  This is the cloud version. Run 100% local with{" "}
                  <a
                    href="/docs#requirements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline underline-offset-2 transition-colors ${
                      isDark ? "hover:text-zinc-200" : "hover:text-[#1a1a1a]"
                    }`}
                  >
                    Convex local deployments
                  </a>
                  .
                </p>
              </div>

              {/* Real-time Platform Stats - same width as trust box */}
              <PlatformLeaderboard isDark={isDark} />

              {/* TEMP: Message milestone counter - MOVED TO /stats page */}
            </div>

            {/* Right side: Mini dashboard mock (desktop only) + Getting started (all screens) */}
            <div className="flex flex-col gap-8">
              {/* Dashboard preview - desktop only */}
              <div
                className={`hidden lg:block overflow-hidden rounded-lg border ${
                  isDark
                    ? "border-zinc-800 bg-[#161616]"
                    : "border-[#e6e4e1] bg-[#f5f3f0]"
                }`}
              >
                {/* Window chrome */}
                <div
                  className={`flex items-center gap-2 border-b px-4 py-3 ${
                    isDark ? "border-zinc-800" : "border-[#e6e4e1]"
                  }`}
                >
                  <div className="flex gap-1.5">
                    <div
                      className={`h-3 w-3 rounded-full ${isDark ? "bg-zinc-700" : "bg-[#e6e4e1]"}`}
                    />
                    <div
                      className={`h-3 w-3 rounded-full ${isDark ? "bg-zinc-700" : "bg-[#e6e4e1]"}`}
                    />
                    <div
                      className={`h-3 w-3 rounded-full ${isDark ? "bg-zinc-700" : "bg-[#e6e4e1]"}`}
                    />
                  </div>
                  <span
                    className={`ml-2 text-xs ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
                  >
                    opensync dashboard
                  </span>
                  {/* View tabs */}
                  <div
                    className={`ml-auto flex items-center gap-1 rounded p-0.5 ${
                      isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"
                    }`}
                  >
                    {["overview", "sessions", "evals", "analytics"].map(
                      (tab, i) => (
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
                      ),
                    )}
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="flex">
                  {/* Sidebar */}
                  <div
                    className={`w-48 border-r p-3 ${isDark ? "border-zinc-800" : "border-[#e6e4e1]"}`}
                  >
                    <p
                      className={`mb-2 text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? "text-zinc-600" : "text-[#8b7355]"
                      }`}
                    >
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
                            <span
                              className={`shrink-0 px-1 py-0.5 rounded text-[8px] font-medium uppercase ${
                                session.source === "cc"
                                  ? "bg-amber-500/15 text-amber-500"
                                  : "bg-blue-500/15 text-blue-400"
                              }`}
                            >
                              {session.source}
                            </span>
                            <span className="truncate">{session.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main panel */}
                  <div className="flex-1 p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                        >
                          auth-flow-setup
                        </p>
                        <p
                          className={`text-xs ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
                        >
                          2 minutes ago
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] ${
                            isDark
                              ? "bg-zinc-800 text-zinc-400"
                              : "bg-[#ebe9e6] text-[#6b6b6b]"
                          }`}
                        >
                          1.2k tokens
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] ${
                            isDark
                              ? "bg-emerald-900/30 text-emerald-400"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          synced
                        </span>
                      </div>
                    </div>

                    {/* Mock message preview */}
                    <div
                      className={`space-y-3 rounded border p-3 ${
                        isDark
                          ? "border-zinc-800 bg-[#0E0E0E]"
                          : "border-[#e6e4e1] bg-[#faf8f5]"
                      }`}
                    >
                      <div className="text-xs">
                        <p
                          className={`mb-1 ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
                        >
                          user
                        </p>
                        <p
                          className={
                            isDark ? "text-zinc-400" : "text-[#6b6b6b]"
                          }
                        >
                          Add authentication to the API routes
                        </p>
                      </div>
                      <div className="text-xs">
                        <p
                          className={`mb-1 ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
                        >
                          assistant
                        </p>
                        <p
                          className={
                            isDark ? "text-zinc-400" : "text-[#6b6b6b]"
                          }
                        >
                          I'll add JWT validation middleware...
                        </p>
                      </div>
                    </div>

                    {/* Stats row - 4 stats matching dashboard */}
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      <div
                        className={`rounded p-2 ${isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"}`}
                      >
                        <p
                          className={`text-lg font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                        >
                          24
                        </p>
                        <p
                          className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
                        >
                          sessions
                        </p>
                      </div>
                      <div
                        className={`rounded p-2 ${isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"}`}
                      >
                        <p
                          className={`text-lg font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                        >
                          42.1k
                        </p>
                        <p
                          className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
                        >
                          tokens
                        </p>
                      </div>
                      <div
                        className={`rounded p-2 ${isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"}`}
                      >
                        <p
                          className={`text-lg font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                        >
                          $1.24
                        </p>
                        <p
                          className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
                        >
                          cost
                        </p>
                      </div>
                      <div
                        className={`rounded p-2 ${isDark ? "bg-zinc-800/50" : "bg-[#ebe9e6]"}`}
                      >
                        <p
                          className={`text-lg font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                        >
                          2h 14m
                        </p>
                        <p
                          className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
                        >
                          duration
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Syncs with section */}
              <div
                className={`rounded-lg border p-5 ${
                  isDark
                    ? "border-zinc-800 bg-[#161616]"
                    : "border-[#e6e4e1] bg-[#f5f3f0]"
                }`}
              >
                <h3
                  className={`text-sm font-medium mb-5 ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                >
                  Syncs with
                </h3>
                <div className="flex items-end justify-center gap-8 flex-wrap">
                  {/* OpenCode */}
                  <div
                    className="flex flex-col items-center gap-1.5"
                    title="OpenCode"
                  >
                    <img
                      src={
                        isDark ? "/opencode-dark.svg" : "/opencode-light.svg"
                      }
                      alt="OpenCode"
                      className="h-8 w-8"
                    />
                    <span
                      className={`text-[10px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
                    >
                      OpenCode
                    </span>
                  </div>

                  {/* Claude Code */}
                  <div
                    className="flex flex-col items-center gap-1.5"
                    title="Claude Code"
                  >
                    <svg
                      className={`h-8 w-8 ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                      fill="currentColor"
                      fillRule="evenodd"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
                    </svg>
                    <span
                      className={`text-[10px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
                    >
                      Claude Code
                    </span>
                  </div>

                  {/* Factory Droid */}
                  <div
                    className="flex flex-col items-center gap-1.5"
                    title="Factory Droid"
                  >
                    <svg
                      className={`h-8 w-8 ${isDark ? "text-zinc-300" : "text-[#424242]"}`}
                      fill="currentColor"
                      viewBox="100 90 700 700"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M582.594 251.356C581.452 251.073 580.385 250.547 579.466 249.813C578.546 249.08 577.795 248.156 577.266 247.106C576.736 246.055 576.44 244.903 576.397 243.728C576.354 242.552 576.565 241.381 577.017 240.295C592.606 202.357 599.485 172.002 588.384 159.294C558.984 125.58 441.083 192.624 403.49 215.331C402.484 215.936 401.358 216.316 400.19 216.446C399.023 216.577 397.841 216.454 396.725 216.086C395.61 215.718 394.587 215.113 393.727 214.314C392.866 213.515 392.188 212.539 391.739 211.453C375.937 173.596 359.325 147.264 342.487 146.122C297.857 143.068 261.885 273.85 251.355 316.475C251.074 317.616 250.55 318.683 249.817 319.603C249.085 320.522 248.162 321.273 247.113 321.803C246.064 322.332 244.912 322.629 243.738 322.672C242.563 322.715 241.393 322.504 240.308 322.052C202.37 306.463 172.002 299.584 159.307 310.685C125.593 340.085 192.624 457.987 215.33 495.579C215.938 496.585 216.32 497.711 216.451 498.879C216.583 500.047 216.46 501.229 216.092 502.346C215.724 503.462 215.119 504.485 214.318 505.346C213.517 506.206 212.54 506.883 211.453 507.33C173.609 523.132 147.277 539.744 146.121 556.581C143.08 601.211 273.85 637.184 316.488 647.714C317.627 647.998 318.691 648.525 319.608 649.259C320.525 649.992 321.273 650.914 321.801 651.963C322.329 653.011 322.624 654.161 322.668 655.335C322.711 656.508 322.501 657.677 322.052 658.761C306.463 696.699 299.584 727.067 310.685 739.762C340.084 773.476 458 706.445 495.592 683.739C496.598 683.131 497.724 682.749 498.892 682.618C500.06 682.486 501.243 682.609 502.359 682.977C503.475 683.345 504.498 683.95 505.358 684.751C506.219 685.552 506.896 686.529 507.344 687.616C523.145 725.46 539.744 751.792 556.594 752.948C601.224 755.989 637.196 625.219 647.713 582.581C647.998 581.441 648.525 580.375 649.259 579.457C649.993 578.539 650.917 577.79 651.967 577.262C653.017 576.733 654.169 576.438 655.344 576.396C656.519 576.354 657.689 576.566 658.775 577.018C696.712 592.607 727.067 599.472 739.775 588.384C773.49 558.985 706.445 441.069 683.738 403.477C683.136 402.47 682.757 401.345 682.628 400.178C682.499 399.011 682.622 397.83 682.99 396.715C683.358 395.6 683.961 394.577 684.76 393.717C685.558 392.856 686.532 392.177 687.616 391.726C725.473 375.924 751.805 359.312 752.947 342.475C756.001 297.845 625.219 261.873 582.594 251.356ZM531.391 208.572C539.969 223.948 495.765 326.408 462.886 398.073C462.337 399.271 461.433 400.273 460.297 400.942C459.161 401.611 457.847 401.917 456.532 401.817C455.217 401.717 453.964 401.217 452.942 400.384C451.92 399.551 451.178 398.424 450.816 397.157C437.537 350.561 422.36 295.813 406.12 249.338C405.482 247.514 405.513 245.522 406.209 243.719C406.905 241.917 408.219 240.42 409.917 239.498C450.471 217.349 519.865 187.936 531.391 208.572ZM337.044 221.253C353.974 226.06 395.165 329.767 422.585 403.69C423.042 404.925 423.111 406.271 422.781 407.546C422.451 408.821 421.739 409.965 420.74 410.824C419.741 411.683 418.503 412.215 417.193 412.35C415.882 412.485 414.562 412.215 413.409 411.577C371.037 388.061 321.627 360.043 277.276 338.664C275.539 337.822 274.157 336.39 273.377 334.625C272.596 332.86 272.468 330.875 273.013 329.023C286.066 284.726 314.297 214.813 337.044 221.253ZM208.585 367.651C223.948 359.073 326.42 403.278 398.073 436.156C399.271 436.706 400.272 437.61 400.942 438.746C401.611 439.882 401.916 441.196 401.816 442.51C401.717 443.825 401.217 445.078 400.383 446.1C399.55 447.122 398.424 447.864 397.156 448.227C350.575 461.506 295.813 476.683 249.337 492.923C247.515 493.557 245.526 493.524 243.727 492.828C241.927 492.133 240.433 490.82 239.511 489.125C217.402 448.572 187.936 379.177 208.585 367.651ZM221.266 561.999C226.06 545.069 329.78 503.878 403.703 476.457C404.938 476 406.284 475.932 407.559 476.262C408.834 476.592 409.978 477.304 410.837 478.303C411.695 479.301 412.228 480.539 412.363 481.85C412.498 483.16 412.228 484.48 411.59 485.633C388.06 528.006 360.042 577.416 338.663 621.754C337.827 623.496 336.398 624.884 334.631 625.668C332.864 626.451 330.876 626.579 329.023 626.029C284.725 613.056 214.813 584.746 221.266 561.999ZM367.664 690.458C359.073 675.094 403.291 572.622 436.169 500.97C436.719 499.772 437.623 498.77 438.759 498.101C439.895 497.431 441.209 497.126 442.523 497.226C443.838 497.326 445.091 497.826 446.113 498.659C447.135 499.492 447.877 500.618 448.24 501.886C461.518 548.468 476.696 603.23 492.936 649.705C493.569 651.529 493.534 653.518 492.836 655.318C492.137 657.118 490.822 658.612 489.125 659.532C448.585 681.641 379.177 711.106 367.704 690.458H367.664ZM562.012 677.777C545.068 672.983 503.877 569.263 476.457 495.34C475.997 494.103 475.927 492.754 476.257 491.477C476.587 490.199 477.301 489.053 478.302 488.193C479.304 487.334 480.545 486.802 481.858 486.669C483.171 486.537 484.493 486.81 485.646 487.452C528.005 510.969 577.429 539 621.767 560.379C623.507 561.217 624.891 562.648 625.672 564.414C626.453 566.181 626.58 568.168 626.029 570.02C612.989 614.384 584.759 684.23 562.012 677.777ZM690.47 531.378C675.094 539.97 572.635 495.751 500.969 462.873C499.771 462.323 498.77 461.42 498.1 460.284C497.431 459.148 497.126 457.834 497.226 456.519C497.325 455.204 497.825 453.952 498.659 452.93C499.492 451.908 500.618 451.165 501.886 450.803C548.481 437.524 603.229 422.346 649.705 406.106C651.531 405.472 653.522 405.508 655.325 406.206C657.127 406.904 658.622 408.219 659.544 409.918C681.64 450.458 711.106 519.866 690.47 531.378ZM677.789 337.03C672.983 353.974 569.275 395.165 495.353 422.586C494.116 423.046 492.767 423.115 491.489 422.785C490.212 422.455 489.066 421.742 488.206 420.74C487.346 419.739 486.815 418.498 486.682 417.185C486.55 415.872 486.823 414.549 487.465 413.396C510.982 371.037 539 321.614 560.379 277.276C561.219 275.537 562.65 274.154 564.416 273.374C566.182 272.593 568.168 272.465 570.019 273.013C614.317 286.053 684.23 314.284 677.789 337.03Z" />
                    </svg>
                    <span
                      className={`text-[10px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
                    >
                      Droid
                    </span>
                  </div>

                  {/* Codex CLI */}
                  <div
                    className="flex flex-col items-center gap-1.5"
                    title="Codex CLI"
                  >
                    <svg
                      className={`h-8 w-8 ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                    </svg>
                    <span
                      className={`text-[10px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
                    >
                      Codex CLI
                    </span>
                  </div>

                  {/* Cursor - Coming Soon */}
                  <div
                    className="flex flex-col items-center gap-1.5 relative"
                    title="Cursor (Coming Soon)"
                  >
                    <span
                      className={`absolute -top-5 text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                        isDark
                          ? "bg-zinc-800 text-zinc-500"
                          : "bg-[#ebe9e6] text-[#8b7355]"
                      }`}
                    >
                      coming soon
                    </span>
                    <svg
                      className={`h-8 w-8 ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      fillRule="evenodd"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z" />
                    </svg>
                    <span
                      className={`text-[10px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
                    >
                      Cursor
                    </span>
                  </div>
                </div>
              </div>

              {/* Getting started section */}
              <div
                className={`rounded-lg border p-5 ${
                  isDark
                    ? "border-zinc-800 bg-[#161616]"
                    : "border-[#e6e4e1] bg-[#f5f3f0]"
                }`}
              >
                <h3
                  className={`text-sm font-medium ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`}
                >
                  Getting started
                </h3>
                <p
                  className={`mt-3 text-[11px] ${isDark ? "text-zinc-500" : "text-[#6b6b6b]"}`}
                >
                  Install one of the sync plugins to send session data to your
                  dashboard.
                </p>

                <div className="mt-4 space-y-3">
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
                    <span
                      className={`font-mono text-xs ${
                        isDark
                          ? "text-zinc-100 group-hover:text-zinc-300"
                          : "text-[#6b6b6b] group-hover:text-[#1a1a1a]"
                      }`}
                    >
                      claude-code-sync
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        isDark
                          ? "bg-zinc-800 text-zinc-600"
                          : "bg-[#ebe9e6] text-[#8b7355]"
                      }`}
                    >
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
                    <span
                      className={`font-mono text-xs ${
                        isDark
                          ? "text-zinc-100 group-hover:text-zinc-300"
                          : "text-[#6b6b6b] group-hover:text-[#1a1a1a]"
                      }`}
                    >
                      opencode-sync-plugin
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        isDark
                          ? "bg-zinc-800 text-zinc-600"
                          : "bg-[#ebe9e6] text-[#8b7355]"
                      }`}
                    >
                      npm
                    </span>
                  </a>

                  {/* Droid Sync - Community Submitted */}
                  <a
                    href="https://www.npmjs.com/package/droid-sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                      isDark
                        ? "border-zinc-800 bg-[#0E0E0E] hover:border-zinc-700"
                        : "border-[#e6e4e1] bg-[#faf8f5] hover:border-[#8b7355]"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs ${
                        isDark
                          ? "text-zinc-100 group-hover:text-zinc-300"
                          : "text-[#6b6b6b] group-hover:text-[#1a1a1a]"
                      }`}
                    >
                      droid-sync
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          isDark
                            ? "bg-emerald-900/30 text-emerald-400"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        community
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          isDark
                            ? "bg-zinc-800 text-zinc-600"
                            : "bg-[#ebe9e6] text-[#8b7355]"
                        }`}
                      >
                        npm
                      </span>
                    </div>
                  </a>

                  {/* Codex Sync */}
                  <a
                    href="https://www.npmjs.com/package/codex-sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                      isDark
                        ? "border-zinc-800 bg-[#0E0E0E] hover:border-zinc-700"
                        : "border-[#e6e4e1] bg-[#faf8f5] hover:border-[#8b7355]"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs ${
                        isDark
                          ? "text-zinc-100 group-hover:text-zinc-300"
                          : "text-[#6b6b6b] group-hover:text-[#1a1a1a]"
                      }`}
                    >
                      codex-sync
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        isDark
                          ? "bg-zinc-800 text-zinc-600"
                          : "bg-[#ebe9e6] text-[#8b7355]"
                      }`}
                    >
                      npm
                    </span>
                  </a>
                </div>
              </div>

              {/* TEMP: Animated message growth chart - MOVED TO /stats page */}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          className={`mt-12 flex flex-col items-center gap-4 text-xs ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
        >
          <a
            href="https://github.com/waynesutton/opensync"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors ${isDark ? "text-zinc-500 hover:text-zinc-300" : "text-[#6b6b6b] hover:text-[#1a1a1a]"}`}
          >
            Open Source project
          </a>
          <div className="flex flex-col items-center gap-3">
            <span>built with</span>
            <div className="flex items-center gap-4">
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
              <span className={isDark ? "text-zinc-500" : "text-[#8b7355]"}>
                +
              </span>
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
              <span className={isDark ? "text-zinc-500" : "text-[#8b7355]"}>
                +
              </span>
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

          {/* Social links - positioned in bottom left */}
          <div className="fixed bottom-4 left-4 flex items-center gap-1">
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
            <a
              href="https://convex.dev/community"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
              }`}
              title="Join Discord Community"
            >
              {/* Discord icon */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
            </a>
            <a
              href="https://github.com/waynesutton/opensync/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
              }`}
              title="Get Support"
            >
              <MessageCircleQuestion className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/waynesutton/opensync/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
              }`}
              title="Join Discussions"
            >
              <MessagesSquare className="h-4 w-4" />
            </a>
          </div>

          {/* Terms, Privacy, and Theme switcher - positioned in bottom right */}
          <div className="fixed bottom-4 right-4 flex items-center gap-2">
            <LegalLinks />
            <ThemeSwitcher />
          </div>
        </footer>
      </div>
    </div>
  );
}
