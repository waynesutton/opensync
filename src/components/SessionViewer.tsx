import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "../lib/utils";
import { ConfirmModal } from "./ConfirmModal";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Check,
  Download,
  Globe,
  Lock,
  Trash2,
  ExternalLink,
  User,
  Bot,
  Wrench,
  Cpu,
  Clock,
  Coins,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface SessionViewerProps {
  session: {
    _id: Id<"sessions">;
    title?: string;
    projectPath?: string;
    model?: string;
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
    role: "user" | "assistant" | "system" | "unknown";
    textContent?: string;
    createdAt: number;
    parts: Array<{ type: string; content: any }>;
  }>;
}

export function SessionViewer({ session, messages }: SessionViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const setVisibility = useMutation(api.sessions.setVisibility);
  const deleteSession = useMutation(api.sessions.remove);
  const markdown = useQuery(api.sessions.getMarkdown, { sessionId: session._id });

  const handleCopy = async () => {
    if (markdown) {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (markdown) {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${session.title || "session"}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleToggleVisibility = async () => {
    await setVisibility({
      sessionId: session._id,
      isPublic: !session.isPublic,
    });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteSession({ sessionId: session._id });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {session.title || "Untitled Session"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              {session.projectPath && <span>{session.projectPath}</span>}
              {session.model && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    {session.model}
                  </span>
                </>
              )}
              <span>·</span>
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                {session.totalTokens.toLocaleString()} tokens
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                ${session.cost.toFixed(4)}
              </span>
              {session.durationMs && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(session.durationMs)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Copy as Markdown"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handleToggleVisibility}
              className={cn(
                "p-2 rounded hover:bg-accent",
                session.isPublic ? "text-green-500" : "text-muted-foreground hover:text-foreground"
              )}
              title={session.isPublic ? "Make Private" : "Make Public"}
            >
              {session.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
            {session.isPublic && session.publicSlug && (
              <a
                href={`/s/${session.publicSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Open Public Link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={handleDelete}
              className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <MessageBlock key={message._id} message={message} />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Session"
        message="Delete this session? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

function MessageBlock({ message }: { message: any }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : isSystem
            ? "bg-yellow-500/20 text-yellow-500"
            : "bg-accent text-accent-foreground"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isSystem ? (
          <Wrench className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div className={cn("flex-1 max-w-3xl", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-lg p-4",
            isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"
          )}
        >
          {message.parts.map((part: any, i: number) => (
            <PartRenderer key={i} part={part} isUser={isUser} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function PartRenderer({ part, isUser }: { part: any; isUser: boolean }) {
  if (part.type === "text") {
    return (
      <div className={cn("prose prose-sm max-w-none", isUser ? "prose-invert" : "dark:prose-invert")}>
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
          {part.content}
        </ReactMarkdown>
      </div>
    );
  }

  if (part.type === "tool-call") {
    return (
      <div className="my-2 p-3 rounded bg-accent/50 border border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Wrench className="h-4 w-4" />
          {part.content.name}
        </div>
        <pre className="mt-2 text-xs overflow-x-auto text-muted-foreground">
          {JSON.stringify(part.content.args, null, 2)}
        </pre>
      </div>
    );
  }

  if (part.type === "tool-result") {
    return (
      <div className="my-2 p-3 rounded bg-green-500/10 border border-green-500/20">
        <pre className="text-xs overflow-x-auto text-foreground">
          {typeof part.content.result === "string"
            ? part.content.result
            : JSON.stringify(part.content.result, null, 2)}
        </pre>
      </div>
    );
  }

  return null;
}
