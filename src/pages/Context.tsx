import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { getSourceLabel, getSourceColorClass } from "../lib/source";
import { useTheme, getThemeClasses } from "../lib/theme";
import type { Id } from "../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Search,
  Settings,
  FileText,
  User,
  LogOut,
  Command,
  ChevronLeft,
  ChevronRight,
  Folder,
  MessageSquare,
  Clock,
  Globe,
  Bot,
  Sun,
  Moon,
  ArrowLeft,
  Loader2,
  Hash,
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  Wrench,
  Cpu,
  Coins,
} from "lucide-react";

// Search mode: sessions or messages
type SearchMode = "sessions" | "messages";

// Results per page
const RESULTS_PER_PAGE = 20;

export function ContextPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("sessions");
  const [cursor, setCursor] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Slide-over panel state
  const [selectedSessionId, setSelectedSessionId] =
    useState<Id<"sessions"> | null>(null);
  const [selectedMessageId, setSelectedMessageId] =
    useState<Id<"messages"> | null>(null);

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCursor(0); // Reset pagination on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    // Escape to clear search
    if (
      e.key === "Escape" &&
      document.activeElement === searchInputRef.current
    ) {
      setSearchQuery("");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Fetch search results using Full Text Search (no OpenAI required)
  const sessionResults = useQuery(
    api.search.searchSessionsPaginated,
    searchMode === "sessions"
      ? { query: debouncedQuery, limit: RESULTS_PER_PAGE, cursor }
      : "skip",
  );

  const messageResults = useQuery(
    api.search.searchMessagesPaginated,
    searchMode === "messages" && debouncedQuery.trim()
      ? { query: debouncedQuery, limit: RESULTS_PER_PAGE, cursor }
      : "skip",
  );

  // Pagination handlers
  const handleNextPage = () => {
    const nextCursor =
      searchMode === "sessions"
        ? sessionResults?.nextCursor
        : messageResults?.nextCursor;
    if (nextCursor !== null && nextCursor !== undefined) {
      setCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursor > 0) {
      setCursor(Math.max(0, cursor - RESULTS_PER_PAGE));
    }
  };

  const hasNextPage =
    searchMode === "sessions"
      ? sessionResults?.nextCursor !== null
      : messageResults?.nextCursor !== null;

  const hasPrevPage = cursor > 0;

  const currentResults =
    searchMode === "sessions"
      ? sessionResults?.sessions || []
      : messageResults?.messages || [];

  const totalResults =
    searchMode === "sessions"
      ? sessionResults?.total || 0
      : messageResults?.total || 0;

  const isLoading =
    searchMode === "sessions"
      ? sessionResults === undefined && debouncedQuery !== ""
      : messageResults === undefined && debouncedQuery !== "";

  // Fetch full session details for slide-over panel
  const selectedSession = useQuery(
    api.sessions.get,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip",
  );

  // Handle opening session in slide-over
  const handleOpenSession = (
    sessionId: Id<"sessions">,
    messageId?: Id<"messages">,
  ) => {
    setSelectedSessionId(sessionId);
    setSelectedMessageId(messageId || null);
  };

  // Handle closing slide-over
  const handleClosePanel = () => {
    setSelectedSessionId(null);
    setSelectedMessageId(null);
  };

  // Close panel on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedSessionId) {
        handleClosePanel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedSessionId]);

  return (
    <div className={cn("min-h-screen flex flex-col", t.bgPrimary)}>
      {/* Header */}
      <header
        className={cn(
          "h-12 border-b flex items-center px-4 gap-4",
          t.border,
          t.bgPrimary,
        )}
      >
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 transition-colors",
            t.textSubtle,
            "hover:opacity-80",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>

        <div className={cn("h-4 w-px", t.border)} />

        <span
          className={cn("font-normal text-sm tracking-tight", t.textSecondary)}
        >
          Context Search
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

        <Link
          to="/docs"
          className={cn(
            "p-1.5 rounded transition-colors",
            t.textSubtle,
            t.bgHover,
          )}
          title="Documentation"
        >
          <FileText className="h-4 w-4" />
        </Link>

        <Link
          to="/settings"
          className={cn(
            "p-1.5 rounded transition-colors",
            t.textSubtle,
            t.bgHover,
          )}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        {/* User menu */}
        <div className="relative group">
          <button
            className={cn(
              "flex items-center gap-2 p-1 rounded transition-colors",
              t.bgHover,
            )}
          >
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt=""
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center",
                  t.bgSecondary,
                )}
              >
                <User className={cn("h-3 w-3", t.textSubtle)} />
              </div>
            )}
          </button>
          <div
            className={cn(
              "absolute right-0 top-full mt-1 w-48 py-1 border rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50",
              t.bgDropdown,
              t.border,
            )}
          >
            <div className={cn("px-3 py-2 border-b", t.border)}>
              <p className={cn("text-sm font-normal", t.textSecondary)}>
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <Link
              to="/settings"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                t.textMuted,
                t.bgHover,
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
            <button
              onClick={signOut}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm w-full text-left text-red-400/80 transition-colors",
                t.bgHover,
              )}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Search header */}
          <div className="text-center mb-8">
            <h1 className={cn("text-2xl font-light mb-2", t.textPrimary)}>
              Search Your Context
            </h1>
            <p className={cn("text-sm", t.textMuted)}>
              Find sessions and messages using full-text search
            </p>
          </div>

          {/* Search input */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5",
                  t.iconMuted,
                )}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchMode === "sessions"
                    ? "Search sessions by title, content..."
                    : "Search messages by content..."
                }
                className={cn(
                  "w-full h-12 pl-12 pr-20 rounded-lg border text-base focus:outline-none transition-colors",
                  t.bgInput,
                  t.borderInput,
                  t.textSecondary,
                  t.textPlaceholder,
                  t.borderFocus,
                )}
                autoFocus
              />
              <div
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none",
                  t.iconMuted,
                )}
              >
                <Command className="h-4 w-4" />
                <span className="text-xs">K</span>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={cn(
                    "absolute right-14 top-1/2 -translate-y-1/2 p-1 rounded transition-colors",
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search mode toggle */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "flex items-center gap-1 rounded-lg p-1 border",
                t.bgToggle,
                t.border,
              )}
            >
              <button
                onClick={() => {
                  setSearchMode("sessions");
                  setCursor(0);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
                  searchMode === "sessions"
                    ? cn(t.bgToggleActive, t.textPrimary)
                    : cn(t.textSubtle, "hover:opacity-80"),
                )}
              >
                <Folder className="h-4 w-4" />
                Sessions
              </button>
              <button
                onClick={() => {
                  setSearchMode("messages");
                  setCursor(0);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
                  searchMode === "messages"
                    ? cn(t.bgToggleActive, t.textPrimary)
                    : cn(t.textSubtle, "hover:opacity-80"),
                )}
              >
                <MessageSquare className="h-4 w-4" />
                Messages
              </button>
            </div>
          </div>

          {/* Results info */}
          {(debouncedQuery || searchMode === "sessions") &&
            currentResults.length > 0 && (
              <div
                className={cn(
                  "flex items-center justify-between mb-4 text-sm",
                  t.textMuted,
                )}
              >
                <span>
                  Showing {cursor + 1} - {cursor + currentResults.length} of{" "}
                  {totalResults} results
                </span>
                <span className={cn("text-xs", t.textDim)}>
                  Full-text search (no API key required)
                </span>
              </div>
            )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className={cn("h-8 w-8 animate-spin", t.textSubtle)} />
            </div>
          )}

          {/* Results */}
          {!isLoading && (
            <div className="space-y-3">
              {searchMode === "sessions"
                ? // Session results
                  (sessionResults?.sessions || []).map((session) => (
                    <SessionResultCard
                      key={session._id}
                      session={session}
                      theme={theme}
                      onClick={() => handleOpenSession(session._id)}
                    />
                  ))
                : // Message results
                  (messageResults?.messages || []).map((message) => (
                    <MessageResultCard
                      key={message._id}
                      message={message}
                      theme={theme}
                      searchQuery={debouncedQuery}
                      onClick={() =>
                        handleOpenSession(message.sessionId, message._id)
                      }
                    />
                  ))}

              {/* Empty state */}
              {currentResults.length === 0 && !isLoading && (
                <div
                  className={cn(
                    "text-center py-16 rounded-lg border",
                    t.bgCard,
                    t.border,
                  )}
                >
                  <Search className={cn("h-12 w-12 mx-auto mb-4", t.textDim)} />
                  {searchMode === "messages" && !debouncedQuery.trim() ? (
                    <>
                      <h3
                        className={cn(
                          "text-lg font-medium mb-2",
                          t.textPrimary,
                        )}
                      >
                        Enter a search query
                      </h3>
                      <p
                        className={cn("text-sm max-w-md mx-auto", t.textMuted)}
                      >
                        Type something to search through your messages
                      </p>
                    </>
                  ) : debouncedQuery.trim() ? (
                    <>
                      <h3
                        className={cn(
                          "text-lg font-medium mb-2",
                          t.textPrimary,
                        )}
                      >
                        No results found
                      </h3>
                      <p
                        className={cn("text-sm max-w-md mx-auto", t.textMuted)}
                      >
                        Try a different search term or check your spelling
                      </p>
                    </>
                  ) : (
                    <>
                      <h3
                        className={cn(
                          "text-lg font-medium mb-2",
                          t.textPrimary,
                        )}
                      >
                        No sessions yet
                      </h3>
                      <p
                        className={cn("text-sm max-w-md mx-auto", t.textMuted)}
                      >
                        Start syncing sessions from Claude Code or OpenCode to
                        see them here
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {currentResults.length > 0 && (hasPrevPage || hasNextPage) && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",
                  hasPrevPage
                    ? cn(t.border, t.textSecondary, t.bgHover)
                    : cn(t.border, t.textDim, "opacity-50 cursor-not-allowed"),
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className={cn("text-sm", t.textMuted)}>
                Page {Math.floor(cursor / RESULTS_PER_PAGE) + 1}
              </span>

              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",
                  hasNextPage
                    ? cn(t.border, t.textSecondary, t.bgHover)
                    : cn(t.border, t.textDim, "opacity-50 cursor-not-allowed"),
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className={cn(
          "h-10 border-t flex items-center justify-center px-4",
          t.border,
          t.bgPrimary,
        )}
      >
        <span className={cn("text-xs", t.textDim)}>
          Powered by Convex Full-Text Search
        </span>
      </footer>

      {/* Session Slide-over Panel */}
      <SessionSlideOver
        isOpen={!!selectedSessionId}
        onClose={handleClosePanel}
        session={selectedSession?.session}
        messages={selectedSession?.messages || []}
        highlightMessageId={selectedMessageId}
        theme={theme}
        onOpenInDashboard={() => {
          if (selectedSessionId) {
            navigate(`/?session=${selectedSessionId}`);
          }
        }}
      />
    </div>
  );
}

// Session result card component
function SessionResultCard({
  session,
  theme,
  onClick,
}: {
  session: {
    _id: Id<"sessions">;
    title?: string;
    projectPath?: string;
    projectName?: string;
    model?: string;
    source?: string;
    totalTokens: number;
    cost: number;
    isPublic: boolean;
    messageCount: number;
    summary?: string;
    createdAt: number;
    updatedAt: number;
  };
  theme: "dark" | "tan";
  onClick: () => void;
}) {
  const t = getThemeClasses(theme);
  const source = session.source || "opencode";
  const sourceLabel = getSourceLabel(source);
  const sourceColor = getSourceColorClass(source, { themed: false });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg border text-left transition-colors",
        t.bgCard,
        t.border,
        t.bgHover,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Folder className={cn("h-4 w-4 shrink-0", t.iconMuted)} />
            <h3 className={cn("text-sm font-medium truncate", t.textPrimary)}>
              {session.title || "Untitled Session"}
            </h3>
            {/* Source badge */}
            <span
              className={cn(
                "shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
                sourceColor,
              )}
            >
              {sourceLabel}
            </span>
            {session.isPublic && (
              <Globe className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            )}
          </div>

          {session.projectPath && (
            <p className={cn("text-xs mb-2 truncate", t.textDim)}>
              {session.projectName || session.projectPath}
            </p>
          )}

          {session.summary && (
            <p className={cn("text-sm line-clamp-2 mb-2", t.textMuted)}>
              {session.summary}
            </p>
          )}

          <div className={cn("flex items-center gap-4 text-xs", t.textDim)}>
            {session.model && (
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {session.model}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {session.totalTokens.toLocaleString()} tokens
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {session.messageCount} messages
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeAgo(session.updatedAt)}
            </span>
          </div>
        </div>

        <ChevronRight className={cn("h-5 w-5 shrink-0", t.textDim)} />
      </div>
    </button>
  );
}

// Message result card component
function MessageResultCard({
  message,
  theme,
  searchQuery,
  onClick,
}: {
  message: {
    _id: Id<"messages">;
    sessionId: Id<"sessions">;
    role: "user" | "assistant" | "system" | "tool" | "unknown";
    textContent?: string;
    model?: string;
    createdAt: number;
    sessionTitle?: string;
    projectPath?: string;
    projectName?: string;
  };
  theme: "dark" | "tan";
  searchQuery: string;
  onClick: () => void;
}) {
  const t = getThemeClasses(theme);
  const isUser = message.role === "user";

  // Highlight matching text
  const highlightedText = message.textContent
    ? highlightMatch(message.textContent, searchQuery, 300)
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg border text-left transition-colors",
        t.bgCard,
        t.border,
        t.bgHover,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Role icon */}
        <div
          className={cn(
            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser ? t.bgUserBubble : t.bgAssistantBubble,
          )}
        >
          {isUser ? (
            <User className={cn("h-4 w-4", t.textMuted)} />
          ) : (
            <Bot className={cn("h-4 w-4", t.textSubtle)} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Session info */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-medium", t.textMuted)}>
              {isUser ? "User" : "Assistant"}
            </span>
            <span className={cn("text-xs", t.textDim)}>in</span>
            <span className={cn("text-xs truncate", t.textSubtle)}>
              {message.sessionTitle || "Untitled Session"}
            </span>
          </div>

          {/* Message content with highlighting */}
          <p
            className={cn("text-sm whitespace-pre-wrap", t.textSecondary)}
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />

          {/* Metadata */}
          <div
            className={cn("flex items-center gap-3 mt-2 text-xs", t.textDim)}
          >
            {message.projectName || message.projectPath ? (
              <span className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {message.projectName || message.projectPath}
              </span>
            ) : null}
            {message.model && (
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {message.model}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeAgo(message.createdAt)}
            </span>
          </div>
        </div>

        <ChevronRight className={cn("h-5 w-5 shrink-0 mt-1", t.textDim)} />
      </div>
    </button>
  );
}

// Highlight matching text helper
function highlightMatch(
  text: string,
  query: string,
  maxLength: number,
): string {
  if (!query.trim() || !text) return truncateText(text, maxLength);

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(Boolean);

  // Find first match position
  let firstMatchIndex = -1;
  for (const word of queryWords) {
    const index = lowerText.indexOf(word);
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index;
    }
  }

  // Extract context around the match
  let startIndex = 0;
  let displayText = text;

  if (firstMatchIndex !== -1 && firstMatchIndex > 50) {
    startIndex = Math.max(0, firstMatchIndex - 50);
    displayText = "..." + text.slice(startIndex);
  }

  // Truncate if too long
  if (displayText.length > maxLength) {
    displayText = displayText.slice(0, maxLength) + "...";
  }

  // Highlight all query words
  let highlighted = escapeHtml(displayText);
  for (const word of queryWords) {
    if (word.length > 1) {
      const regex = new RegExp(`(${escapeRegex(word)})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<mark class="bg-yellow-500/30 text-inherit rounded px-0.5">$1</mark>',
      );
    }
  }

  return highlighted;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return escapeHtml(text);
  return escapeHtml(text.slice(0, maxLength)) + "...";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Session Slide-over Panel Component
function SessionSlideOver({
  isOpen,
  onClose,
  session,
  messages,
  highlightMessageId,
  theme,
  onOpenInDashboard,
}: {
  isOpen: boolean;
  onClose: () => void;
  session?: {
    _id: Id<"sessions">;
    title?: string;
    projectPath?: string;
    projectName?: string;
    model?: string;
    provider?: string;
    source?: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    durationMs?: number;
    isPublic: boolean;
    publicSlug?: string;
    createdAt: number;
  };
  messages: Array<{
    _id: Id<"messages">;
    role: "user" | "assistant" | "system" | "tool" | "unknown";
    textContent?: string;
    createdAt: number;
    parts: Array<{ type: string; content: any }>;
  }>;
  highlightMessageId: Id<"messages"> | null;
  theme: "dark" | "tan";
  onOpenInDashboard: () => void;
}) {
  const t = getThemeClasses(theme);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const highlightedMessageRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted message when panel opens
  useEffect(() => {
    if (isOpen && highlightMessageId && highlightedMessageRef.current) {
      setTimeout(() => {
        highlightedMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [isOpen, highlightMessageId]);

  // Get markdown for copy
  const markdown = useQuery(
    api.sessions.getMarkdown,
    session?._id ? { sessionId: session._id } : "skip",
  );

  const handleCopy = async () => {
    if (markdown) {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (markdown && session) {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${session.title || "session"}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const source = session?.source || "opencode";
  const sourceLabel = getSourceLabel(source);
  const sourceColor = getSourceColorClass(source, { themed: false });

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity z-40",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full max-w-2xl shadow-2xl transition-transform duration-300 ease-out z-50 flex flex-col",
          t.bgPrimary,
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Loading state */}
        {isOpen && !session && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className={cn("h-8 w-8 animate-spin", t.textSubtle)} />
          </div>
        )}

        {/* Content */}
        {session && (
          <>
            {/* Header */}
            <div className={cn("border-b p-4", t.border)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2
                      className={cn(
                        "text-lg font-medium truncate",
                        t.textPrimary,
                      )}
                    >
                      {session.title || "Untitled Session"}
                    </h2>
                    {/* Source badge */}
                    <span
                      className={cn(
                        "shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
                        sourceColor,
                      )}
                    >
                      {sourceLabel}
                    </span>
                    {session.isPublic && (
                      <Globe className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-3 text-sm",
                      t.textMuted,
                    )}
                  >
                    {session.projectPath && (
                      <span className="flex items-center gap-1">
                        <Folder className="h-3 w-3" />
                        {session.projectName || session.projectPath}
                      </span>
                    )}
                    {session.model && (
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {session.model}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {session.totalTokens.toLocaleString()} tokens
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />${session.cost.toFixed(4)}
                    </span>
                    {session.durationMs && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(session.durationMs)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    t.textSubtle,
                    t.bgHover,
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Actions bar */}
              <div className="flex items-center gap-1 mt-3">
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                    t.textMuted,
                    t.bgHover,
                  )}
                  title="Copy as Markdown"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
                <button
                  onClick={handleDownload}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                    t.textMuted,
                    t.bgHover,
                  )}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                {session.isPublic && session.publicSlug && (
                  <a
                    href={`/s/${session.publicSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                      t.textMuted,
                      t.bgHover,
                    )}
                    title="Open Public Link"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Public Link</span>
                  </a>
                )}
                <div className="flex-1" />
                <button
                  onClick={onOpenInDashboard}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                    theme === "dark"
                      ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                      : "bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e0ded9]",
                  )}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in Dashboard</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className={cn("text-center py-12", t.textMuted)}>
                  <MessageSquare
                    className={cn("h-12 w-12 mx-auto mb-4", t.textDim)}
                  />
                  <p>No messages in this session</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    ref={
                      message._id === highlightMessageId
                        ? highlightedMessageRef
                        : undefined
                    }
                    className={cn(
                      "transition-colors rounded-lg",
                      message._id === highlightMessageId &&
                        "ring-2 ring-yellow-500/50",
                    )}
                  >
                    <SlideOverMessageBlock message={message} theme={theme} />
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

// Message block for slide-over (simplified version)
function SlideOverMessageBlock({
  message,
  theme,
}: {
  message: {
    _id: Id<"messages">;
    role: "user" | "assistant" | "system" | "tool" | "unknown";
    textContent?: string;
    createdAt: number;
    parts: Array<{ type: string; content: any }>;
  };
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  // Check if parts have any displayable content (text, tool-call, or tool-result with actual data)
  const hasPartsContent = message.parts?.some((part: any) => {
    if (part.type === "text") {
      const text = getTextContentFromPart(part.content);
      return text && text.trim().length > 0;
    }
    if (part.type === "tool-call") {
      // Check if tool-call has extractable name
      return part.content && (part.content.name || part.content.toolName);
    }
    if (part.type === "tool-result") {
      // Check if tool-result has extractable result
      const result =
        part.content?.result || part.content?.output || part.content;
      return result !== null && result !== undefined;
    }
    return false;
  });

  // Use textContent as fallback if no parts have content
  const showFallback = !hasPartsContent && message.textContent;

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? t.bgUserBubble
            : isSystem
              ? "bg-yellow-500/20"
              : t.bgAssistantBubble,
        )}
      >
        {isUser ? (
          <User className={cn("h-4 w-4", t.textMuted)} />
        ) : isSystem ? (
          <Wrench className="h-4 w-4 text-yellow-500" />
        ) : (
          <Bot className={cn("h-4 w-4", t.textSubtle)} />
        )}
      </div>

      <div
        className={cn("flex-1 max-w-full", isUser && "flex flex-col items-end")}
      >
        <div
          className={cn(
            "rounded-lg p-3",
            isUser ? t.bgUserBubble : cn(t.bgCard, "border", t.border),
          )}
        >
          {showFallback ? (
            <div
              className={cn(
                "prose prose-sm max-w-none",
                theme === "dark"
                  ? "prose-invert"
                  : "text-[#1a1a1a] prose-headings:text-[#1a1a1a] prose-p:text-[#1a1a1a] prose-strong:text-[#1a1a1a] prose-li:text-[#1a1a1a]",
              )}
            >
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.textContent || ""}
              </ReactMarkdown>
            </div>
          ) : (
            message.parts?.map((part: any, i: number) => (
              <SlideOverPartRenderer key={i} part={part} theme={theme} />
            ))
          )}
        </div>
        <span className={cn("text-xs mt-1", t.textDim)}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

// Helper to extract text content from various formats
function getTextContentFromPart(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content.text || content.content || "";
}

// Helper to extract tool call details
function getToolCallDetails(content: any): { name: string; args: any } {
  if (!content) return { name: "Unknown Tool", args: {} };
  return {
    name: content.name || content.toolName || "Unknown Tool",
    args: content.args || content.arguments || content.input || {},
  };
}

// Helper to extract tool result
function getToolResult(content: any): string {
  if (!content) return "";
  const result = content.result || content.output || content;
  if (typeof result === "string") return result;
  return JSON.stringify(result, null, 2);
}

// Part renderer for slide-over
function SlideOverPartRenderer({
  part,
  theme,
}: {
  part: any;
  theme: "dark" | "tan";
}) {
  const t = getThemeClasses(theme);

  if (part.type === "text") {
    const textContent = getTextContentFromPart(part.content);
    if (!textContent) return null;

    return (
      <div
        className={cn(
          "prose prose-sm max-w-none",
          theme === "dark"
            ? "prose-invert"
            : "text-[#1a1a1a] prose-headings:text-[#1a1a1a] prose-p:text-[#1a1a1a] prose-strong:text-[#1a1a1a] prose-li:text-[#1a1a1a]",
        )}
      >
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {textContent}
        </ReactMarkdown>
      </div>
    );
  }

  if (part.type === "tool-call") {
    const { name, args } = getToolCallDetails(part.content);
    return (
      <div className={cn("my-2 p-3 rounded border", t.bgSecondary, t.border)}>
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            t.textPrimary,
          )}
        >
          <Wrench className="h-4 w-4" />
          {name}
        </div>
        <pre className={cn("mt-2 text-xs overflow-x-auto", t.textMuted)}>
          {JSON.stringify(args, null, 2)}
        </pre>
      </div>
    );
  }

  if (part.type === "tool-result") {
    const result = getToolResult(part.content);
    return (
      <div className="my-2 p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
        <pre className={cn("text-xs overflow-x-auto", t.textPrimary)}>
          {result}
        </pre>
      </div>
    );
  }

  return null;
}
