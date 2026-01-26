import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";
import {
  ArrowLeft,
  Sun,
  Moon,
  Settings,
  FileText,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Github,
} from "lucide-react";

// GitHub API types
interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubLabel {
  id: number;
  name: string;
  color: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  comments: number;
  labels: GitHubLabel[];
  state: string;
}

interface GitHubDiscussion {
  id: number;
  number: number;
  title: string;
  html_url: string;
  user: GitHubUser;
  created_at: string;
  comments: number;
  category?: {
    name: string;
  };
}

// Format relative time (e.g., "2 days ago")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

// GitHub repo config
const GITHUB_OWNER = "waynesutton";
const GITHUB_REPO = "opensync";
const ISSUES_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=10&sort=updated`;
const DISCUSSIONS_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/discussions?per_page=10`;
const REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;

export function UpdatesPage() {
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";

  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [discussions, setDiscussions] = useState<GitHubDiscussion[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [discussionsLoading, setDiscussionsLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [discussionsError, setDiscussionsError] = useState<string | null>(null);

  // Fetch issues from GitHub
  const fetchIssues = async () => {
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const response = await fetch(ISSUES_URL, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      const data = await response.json();
      // Filter out pull requests (they show up in issues API)
      const issuesOnly = data.filter((item: any) => !item.pull_request);
      setIssues(issuesOnly);
    } catch (err) {
      setIssuesError(err instanceof Error ? err.message : "Failed to fetch issues");
    } finally {
      setIssuesLoading(false);
    }
  };

  // Fetch discussions from GitHub (using search API as fallback)
  const fetchDiscussions = async () => {
    setDiscussionsLoading(true);
    setDiscussionsError(null);
    try {
      // Note: GitHub REST API for discussions is limited
      // We'll try the discussions endpoint, but it may not work without auth
      const response = await fetch(DISCUSSIONS_URL, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data);
      } else {
        // Discussions API requires auth, so we'll show a fallback
        setDiscussions([]);
        setDiscussionsError("Discussions require GitHub authentication to fetch via API");
      }
    } catch (err) {
      setDiscussionsError("Discussions API not available");
      setDiscussions([]);
    } finally {
      setDiscussionsLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchIssues();
    fetchDiscussions();
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    fetchIssues();
    fetchDiscussions();
  };

  return (
    <div className={cn("min-h-screen", t.bgPrimary)}>
      {/* Header */}
      <header className={cn("h-12 border-b flex items-center px-3 sm:px-4 gap-2 sm:gap-4", t.border, t.bgPrimary)}>
        <Link
          to="/dashboard"
          className={cn("flex items-center gap-1.5 text-xs transition-colors", t.textSubtle, "hover:opacity-80")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back</span>
        </Link>

        <div className={cn("h-4 w-px", isDark ? "bg-zinc-800" : "bg-[#e6e4e1]")} />

        <h1 className={cn("text-sm font-normal", t.textSecondary)}>Updates</h1>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

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
      </header>

      {/* Main content */}
      <main className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Github className={cn("h-5 w-5", t.textMuted)} />
            <h2 className={cn("text-lg font-normal", t.textPrimary)}>GitHub Activity</h2>
          </div>
          <p className={cn("text-sm", t.textMuted)}>
            Recent issues and discussions from the{" "}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("underline", t.interactive, t.interactiveHover)}
            >
              opensync repository
            </a>
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Issues column */}
          <div className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}>
            <div className={cn("px-4 py-3 border-b flex items-center justify-between", t.border)}>
              <div className="flex items-center gap-2">
                <AlertCircle className={cn("h-4 w-4", t.textMuted)} />
                <h3 className={cn("text-xs font-normal", t.textMuted)}>Open Issues</h3>
              </div>
              <a
                href={`${REPO_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("text-xs flex items-center gap-1", t.interactive, t.interactiveHover)}
              >
                View all
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className={cn("divide-y", t.divide)}>
              {issuesLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className={cn("h-5 w-5 animate-spin", t.textMuted)} />
                </div>
              ) : issuesError ? (
                <div className="p-4 text-center">
                  <p className={cn("text-sm", t.textMuted)}>{issuesError}</p>
                </div>
              ) : issues.length === 0 ? (
                <div className="p-4 text-center">
                  <p className={cn("text-sm", t.textMuted)}>No open issues</p>
                </div>
              ) : (
                issues.map((issue) => (
                  <a
                    key={issue.id}
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("block px-4 py-3 transition-colors", t.bgHover)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={issue.user.avatar_url}
                        alt={issue.user.login}
                        className="h-6 w-6 rounded-full shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className={cn("text-sm font-normal line-clamp-2", t.textPrimary)}>
                          {issue.title}
                        </h4>
                        <div className={cn("flex items-center gap-2 mt-1.5 text-xs flex-wrap", t.textMuted)}>
                          <span>#{issue.number}</span>
                          <span className={cn("w-1 h-1 rounded-full", isDark ? "bg-zinc-600" : "bg-[#c4c4c4]")} />
                          <span>{issue.user.login}</span>
                          <span className={cn("w-1 h-1 rounded-full", isDark ? "bg-zinc-600" : "bg-[#c4c4c4]")} />
                          <span>{formatRelativeTime(issue.updated_at)}</span>
                          {issue.comments > 0 && (
                            <>
                              <span className={cn("w-1 h-1 rounded-full", isDark ? "bg-zinc-600" : "bg-[#c4c4c4]")} />
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {issue.comments}
                              </span>
                            </>
                          )}
                        </div>
                        {issue.labels.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {issue.labels.slice(0, 3).map((label) => (
                              <span
                                key={label.id}
                                className="px-1.5 py-0.5 text-[10px] rounded"
                                style={{
                                  backgroundColor: `#${label.color}20`,
                                  color: isDark ? `#${label.color}` : `#${label.color}`,
                                  border: `1px solid #${label.color}40`,
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Discussions column */}
          <div className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}>
            <div className={cn("px-4 py-3 border-b flex items-center justify-between", t.border)}>
              <div className="flex items-center gap-2">
                <MessageCircle className={cn("h-4 w-4", t.textMuted)} />
                <h3 className={cn("text-xs font-normal", t.textMuted)}>Discussions</h3>
              </div>
              <a
                href={`${REPO_URL}/discussions`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("text-xs flex items-center gap-1", t.interactive, t.interactiveHover)}
              >
                View all
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className={cn("divide-y", t.divide)}>
              {discussionsLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className={cn("h-5 w-5 animate-spin", t.textMuted)} />
                </div>
              ) : discussionsError || discussions.length === 0 ? (
                <div className="p-6">
                  {/* Fallback card when discussions API isn't available */}
                  <div className={cn("rounded-lg border p-4 text-center", isDark ? "bg-zinc-900/50 border-zinc-700" : "bg-white border-[#e5e0d8]")}>
                    <MessageCircle className={cn("h-8 w-8 mx-auto mb-3", t.textMuted)} />
                    <h4 className={cn("text-sm font-normal mb-1", t.textPrimary)}>
                      Join the Discussion
                    </h4>
                    <p className={cn("text-xs mb-3", t.textMuted)}>
                      Ask questions, share ideas, and connect with the community.
                    </p>
                    <a
                      href={`${REPO_URL}/discussions`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors",
                        isDark
                          ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                          : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                      )}
                    >
                      <Github className="h-3.5 w-3.5" />
                      Open Discussions
                    </a>
                  </div>
                </div>
              ) : (
                discussions.map((discussion) => (
                  <a
                    key={discussion.id}
                    href={discussion.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("block px-4 py-3 transition-colors", t.bgHover)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={discussion.user.avatar_url}
                        alt={discussion.user.login}
                        className="h-6 w-6 rounded-full shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className={cn("text-sm font-normal line-clamp-2", t.textPrimary)}>
                          {discussion.title}
                        </h4>
                        <div className={cn("flex items-center gap-2 mt-1.5 text-xs flex-wrap", t.textMuted)}>
                          <span>#{discussion.number}</span>
                          <span className={cn("w-1 h-1 rounded-full", isDark ? "bg-zinc-600" : "bg-[#c4c4c4]")} />
                          <span>{discussion.user.login}</span>
                          <span className={cn("w-1 h-1 rounded-full", isDark ? "bg-zinc-600" : "bg-[#c4c4c4]")} />
                          <span>{formatRelativeTime(discussion.created_at)}</span>
                          {discussion.comments > 0 && (
                            <>
                              <span className={cn("w-1 h-1 rounded-full", isDark ? "bg-zinc-600" : "bg-[#c4c4c4]")} />
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {discussion.comments}
                              </span>
                            </>
                          )}
                        </div>
                        {discussion.category && (
                          <div className="mt-2">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 text-[10px] rounded",
                                isDark
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-[#EB5601]/10 text-[#EB5601] border border-[#EB5601]/20"
                              )}
                            >
                              {discussion.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className={cn("text-xs text-center mt-6", t.textMuted)}>
          Data fetched from GitHub API. Rate limited to 60 requests/hour.
        </p>
      </main>
    </div>
  );
}
