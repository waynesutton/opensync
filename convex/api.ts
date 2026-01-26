import { v } from "convex/values";
import { internalQuery, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Type definitions for function returns
type SessionResult = {
  _id: Id<"sessions">;
  externalId: string;
  title?: string;
  projectPath?: string;
  projectName?: string;
  model?: string;
  totalTokens: number;
  cost: number;
  isPublic: boolean;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
};

type SessionWithMessages = {
  session: {
    id: Id<"sessions">;
    externalId: string;
    title?: string;
    projectPath?: string;
    projectName?: string;
    model?: string;
    provider?: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    durationMs?: number;
    isPublic: boolean;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
  };
  messages: {
    id: Id<"messages">;
    externalId: string;
    role: "user" | "assistant" | "system" | "tool" | "unknown";
    textContent?: string;
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    durationMs?: number;
    createdAt: number;
    parts: { type: string; content: any }[];
  }[];
} | null;

// ============================================================================
// QUERIES
// ============================================================================

// List sessions for user
export const listSessions = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  returns: v.array(
    v.object({
      id: v.id("sessions"),
      externalId: v.string(),
      title: v.optional(v.string()),
      projectPath: v.optional(v.string()),
      projectName: v.optional(v.string()),
      model: v.optional(v.string()),
      provider: v.optional(v.string()),
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
      cost: v.number(),
      durationMs: v.optional(v.number()),
      isPublic: v.boolean(),
      messageCount: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { userId, limit }) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return sessions.map((s) => ({
      id: s._id,
      externalId: s.externalId,
      title: s.title,
      projectPath: s.projectPath,
      projectName: s.projectName,
      model: s.model,
      provider: s.provider,
      promptTokens: s.promptTokens,
      completionTokens: s.completionTokens,
      totalTokens: s.totalTokens,
      cost: s.cost,
      durationMs: s.durationMs,
      isPublic: s.isPublic,
      messageCount: s.messageCount,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  },
});

// Get session with messages
export const getSession = internalQuery({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      session: v.object({
        id: v.id("sessions"),
        externalId: v.string(),
        title: v.optional(v.string()),
        projectPath: v.optional(v.string()),
        projectName: v.optional(v.string()),
        model: v.optional(v.string()),
        provider: v.optional(v.string()),
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
        cost: v.number(),
        durationMs: v.optional(v.number()),
        isPublic: v.boolean(),
        messageCount: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
      messages: v.array(
        v.object({
          id: v.id("messages"),
          externalId: v.string(),
          role: v.union(
            v.literal("user"),
            v.literal("assistant"),
            v.literal("system"),
            v.literal("tool"),
            v.literal("unknown")
          ),
          textContent: v.optional(v.string()),
          model: v.optional(v.string()),
          promptTokens: v.optional(v.number()),
          completionTokens: v.optional(v.number()),
          durationMs: v.optional(v.number()),
          createdAt: v.number(),
          parts: v.array(
            v.object({
              type: v.string(),
              content: v.any(),
            })
          ),
        })
      ),
    })
  ),
  handler: async (ctx, { userId, sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== userId) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_session_created", (q) => q.eq("sessionId", sessionId))
      .collect();

    const messagesWithParts = await Promise.all(
      messages.map(async (msg) => {
        const parts = await ctx.db
          .query("parts")
          .withIndex("by_message", (q) => q.eq("messageId", msg._id))
          .collect();

        return {
          id: msg._id,
          externalId: msg.externalId,
          role: msg.role,
          textContent: msg.textContent,
          model: msg.model,
          promptTokens: msg.promptTokens,
          completionTokens: msg.completionTokens,
          durationMs: msg.durationMs,
          createdAt: msg.createdAt,
          parts: parts.sort((a, b) => a.order - b.order).map((p) => ({
            type: p.type,
            content: p.content,
          })),
        };
      })
    );

    return {
      session: {
        id: session._id,
        externalId: session.externalId,
        title: session.title,
        projectPath: session.projectPath,
        projectName: session.projectName,
        model: session.model,
        provider: session.provider,
        promptTokens: session.promptTokens,
        completionTokens: session.completionTokens,
        totalTokens: session.totalTokens,
        cost: session.cost,
        durationMs: session.durationMs,
        isPublic: session.isPublic,
        messageCount: session.messageCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      messages: messagesWithParts,
    };
  },
});

// Full-text search
export const fullTextSearch = internalQuery({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.number(),
  },
  returns: v.array(
    v.object({
      id: v.id("sessions"),
      externalId: v.string(),
      title: v.optional(v.string()),
      projectPath: v.optional(v.string()),
      model: v.optional(v.string()),
      totalTokens: v.number(),
      cost: v.number(),
      messageCount: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { userId, query, limit }) => {
    const results = await ctx.db
      .query("sessions")
      .withSearchIndex("search_sessions", (q) =>
        q.search("searchableText", query).eq("userId", userId)
      )
      .take(limit);

    return results.map((s) => ({
      id: s._id,
      externalId: s.externalId,
      title: s.title,
      projectPath: s.projectPath,
      model: s.model,
      totalTokens: s.totalTokens,
      cost: s.cost,
      messageCount: s.messageCount,
      createdAt: s.createdAt,
    }));
  },
});

// Helper to extract text content from various formats
// Claude Code may store content as { text: "..." } or { content: "..." }
function getTextContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content.text || content.content || "";
}

// Export session
export const exportSession = internalQuery({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    format: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      content: v.string(),
      filename: v.string(),
    }),
    v.object({
      session: v.object({
        id: v.id("sessions"),
        title: v.optional(v.string()),
        model: v.optional(v.string()),
      }),
      messages: v.array(
        v.object({
          role: v.union(
            v.literal("user"),
            v.literal("assistant"),
            v.literal("system"),
            v.literal("tool"),
            v.literal("unknown")
          ),
          content: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, { userId, sessionId, format }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== userId) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_session_created", (q) => q.eq("sessionId", sessionId))
      .collect();

    if (format === "markdown") {
      let md = `# ${session.title || "Untitled"}\n\n`;
      md += `- **Project:** ${session.projectPath || "N/A"}\n`;
      md += `- **Model:** ${session.model || "N/A"}\n`;
      md += `- **Tokens:** ${session.totalTokens}\n`;
      md += `- **Cost:** $${session.cost.toFixed(4)}\n\n---\n\n`;

      for (const msg of messages) {
        const parts = await ctx.db
          .query("parts")
          .withIndex("by_message", (q) => q.eq("messageId", msg._id))
          .collect();

        md += `## ${msg.role === "user" ? "User" : "Assistant"}\n\n`;
        
        // Collect text content from parts
        let hasContent = false;
        for (const part of parts.sort((a, b) => a.order - b.order)) {
          if (part.type === "text") {
            const textContent = getTextContent(part.content);
            if (textContent) {
              md += `${textContent}\n\n`;
              hasContent = true;
            }
          }
        }
        
        // Fallback: use message.textContent if no parts have content
        if (!hasContent && msg.textContent) {
          md += `${msg.textContent}\n\n`;
        }
      }

      return {
        content: md,
        filename: `${session.title?.replace(/[^a-z0-9]/gi, "-") || "session"}.md`,
      };
    }

    if (format === "jsonl") {
      const lines = [];
      for (const msg of messages) {
        const parts = await ctx.db
          .query("parts")
          .withIndex("by_message", (q) => q.eq("messageId", msg._id))
          .collect();

        // Extract text content from parts with normalization
        const textParts = parts
          .filter((p) => p.type === "text")
          .map((p) => getTextContent(p.content))
          .filter((t) => t);
        
        // Use textContent as fallback if no text parts
        const content = textParts.length > 0 
          ? textParts.join("\n") 
          : (msg.textContent || "");

        lines.push(
          JSON.stringify({
            role: msg.role,
            content,
          })
        );
      }
      return {
        content: lines.join("\n"),
        filename: `${session.title?.replace(/[^a-z0-9]/gi, "-") || "session"}.jsonl`,
      };
    }

    // Default: OpenAI messages format
    const openaiMessages = [];
    for (const msg of messages) {
      const parts = await ctx.db
        .query("parts")
        .withIndex("by_message", (q) => q.eq("messageId", msg._id))
        .collect();

      // Extract text content from parts with normalization
      const textParts = parts
        .filter((p) => p.type === "text")
        .map((p) => getTextContent(p.content))
        .filter((t) => t);
      
      // Use textContent as fallback if no text parts
      const content = textParts.length > 0 
        ? textParts.join("\n") 
        : (msg.textContent || "");

      openaiMessages.push({
        role: msg.role,
        content,
      });
    }

    return {
      session: {
        id: session._id,
        title: session.title,
        model: session.model,
      },
      messages: openaiMessages,
    };
  },
});

// Get stats
export const getStats = internalQuery({
  args: { userId: v.id("users") },
  returns: v.object({
    sessionCount: v.number(),
    messageCount: v.number(),
    totalTokens: v.number(),
    totalCost: v.number(),
    totalDurationMs: v.number(),
    modelUsage: v.record(
      v.string(),
      v.object({
        tokens: v.number(),
        cost: v.number(),
        sessions: v.number(),
      })
    ),
  }),
  handler: async (ctx, { userId }) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalTokens = sessions.reduce((acc, s) => acc + s.totalTokens, 0);
    const totalCost = sessions.reduce((acc, s) => acc + s.cost, 0);
    const totalMessages = sessions.reduce((acc, s) => acc + s.messageCount, 0);
    const totalDuration = sessions.reduce((acc, s) => acc + (s.durationMs || 0), 0);

    const modelUsage: Record<string, { tokens: number; cost: number; sessions: number }> = {};
    for (const s of sessions) {
      const model = s.model || "unknown";
      if (!modelUsage[model]) {
        modelUsage[model] = { tokens: 0, cost: 0, sessions: 0 };
      }
      modelUsage[model].tokens += s.totalTokens;
      modelUsage[model].cost += s.cost;
      modelUsage[model].sessions += 1;
    }

    return {
      sessionCount: sessions.length,
      messageCount: totalMessages,
      totalTokens,
      totalCost,
      totalDurationMs: totalDuration,
      modelUsage,
    };
  },
});

// ============================================================================
// ACTIONS
// ============================================================================

// Semantic search
export const semanticSearch = internalAction({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("sessions"),
      externalId: v.string(),
      title: v.optional(v.string()),
      projectPath: v.optional(v.string()),
      projectName: v.optional(v.string()),
      model: v.optional(v.string()),
      totalTokens: v.number(),
      cost: v.number(),
      isPublic: v.boolean(),
      messageCount: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { userId, query, limit }): Promise<SessionResult[]> => {
    // Generate embedding
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query.slice(0, 8000),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${await response.text()}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    // Vector search
    const results = await ctx.vectorSearch("sessionEmbeddings", "by_embedding", {
      vector: embedding,
      limit: limit * 2,
      filter: (q) => q.eq("userId", userId),
    });

    // Load sessions
    const sessions: SessionResult[] = await ctx.runQuery(internal.search.loadSessionsFromEmbeddings, {
      embeddingIds: results.map((r) => r._id),
    });

    return sessions.slice(0, limit);
  },
});

// Hybrid search
export const hybridSearch = internalAction({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.number(),
  },
  returns: v.array(
    v.union(
      v.object({
        id: v.id("sessions"),
        externalId: v.string(),
        title: v.optional(v.string()),
        projectPath: v.optional(v.string()),
        model: v.optional(v.string()),
        totalTokens: v.number(),
        cost: v.number(),
        messageCount: v.number(),
        createdAt: v.number(),
      }),
      v.object({
        _id: v.id("sessions"),
        externalId: v.string(),
        title: v.optional(v.string()),
        projectPath: v.optional(v.string()),
        projectName: v.optional(v.string()),
        model: v.optional(v.string()),
        totalTokens: v.number(),
        cost: v.number(),
        isPublic: v.boolean(),
        messageCount: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    )
  ),
  handler: async (ctx, { userId, query, limit }) => {
    const [fullText, semantic] = await Promise.all([
      ctx.runQuery(internal.api.fullTextSearch, { userId, query, limit }),
      ctx.runAction(internal.api.semanticSearch, { userId, query, limit }),
    ]);

    // Merge with RRF
    const scores = new Map<string, { session: any; score: number }>();

    fullText.forEach((s: any, i: number) => {
      const rrf = 1 / (60 + i);
      scores.set(s.id, { session: s, score: rrf });
    });

    semantic.forEach((s: any, i: number) => {
      const rrf = 1 / (60 + i);
      const existing = scores.get(s._id);
      if (existing) {
        existing.score += rrf;
      } else {
        scores.set(s._id, { session: s, score: rrf });
      }
    });

    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.session);
  },
});

// Helper to extract text content in actions (same logic as getTextContent)
function extractTextContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content.text || content.content || "";
}

// Get context for external LLM
export const getContext = internalAction({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.number(),
    format: v.string(),
  },
  returns: v.union(
    v.object({
      text: v.string(),
      sessionCount: v.number(),
    }),
    v.object({
      messages: v.array(
        v.object({
          role: v.union(
            v.literal("user"),
            v.literal("assistant"),
            v.literal("system"),
            v.literal("tool"),
            v.literal("unknown")
          ),
          content: v.string(),
          metadata: v.object({
            sessionId: v.id("sessions"),
            sessionTitle: v.optional(v.string()),
          }),
        })
      ),
      sessionCount: v.number(),
    })
  ),
  handler: async (ctx, { userId, query, limit, format }): Promise<
    | { text: string; sessionCount: number }
    | { messages: { role: "user" | "assistant" | "system" | "tool" | "unknown"; content: string; metadata: { sessionId: Id<"sessions">; sessionTitle?: string } }[]; sessionCount: number }
  > => {
    // Get relevant sessions via semantic search
    const sessions: SessionResult[] = await ctx.runAction(internal.api.semanticSearch, {
      userId,
      query,
      limit,
    });

    if (format === "text") {
      // Plain text for LLM context
      let text = `Relevant coding sessions for: "${query}"\n\n`;

      for (const session of sessions) {
        const data: SessionWithMessages = await ctx.runQuery(internal.api.getSession, {
          userId,
          sessionId: session._id,
        });

        if (data) {
          text += `--- Session: ${data.session.title || "Untitled"} ---\n`;
          text += `Project: ${data.session.projectPath || "N/A"}\n`;
          text += `Model: ${data.session.model || "N/A"}\n\n`;

          for (const msg of data.messages.slice(-10)) {
            text += `[${msg.role.toUpperCase()}]\n`;
            
            // Extract text content with normalization
            const textParts = msg.parts
              .filter((p: { type: string; content: any }) => p.type === "text")
              .map((p: { type: string; content: any }) => extractTextContent(p.content))
              .filter((t: string) => t);
            
            // Use textContent as fallback if no text parts
            const content = textParts.length > 0 
              ? textParts.join("\n") 
              : (msg.textContent || "");
            
            text += `${content}\n\n`;
          }

          text += "\n";
        }
      }

      return { text, sessionCount: sessions.length };
    }

    // OpenAI messages format
    const messages: { role: "user" | "assistant" | "system" | "tool" | "unknown"; content: string; metadata: { sessionId: Id<"sessions">; sessionTitle?: string } }[] = [];

    for (const session of sessions) {
      const data: SessionWithMessages = await ctx.runQuery(internal.api.getSession, {
        userId,
        sessionId: session._id,
      });

      if (data) {
        for (const msg of data.messages.slice(-10)) {
          // Extract text content with normalization
          const textParts = msg.parts
            .filter((p: { type: string; content: any }) => p.type === "text")
            .map((p: { type: string; content: any }) => extractTextContent(p.content))
            .filter((t: string) => t);
          
          // Use textContent as fallback if no text parts
          const content = textParts.length > 0 
            ? textParts.join("\n") 
            : (msg.textContent || "");

          messages.push({
            role: msg.role,
            content,
            metadata: {
              sessionId: session._id,
              sessionTitle: data.session.title,
            },
          });
        }
      }
    }

    return { messages, sessionCount: sessions.length };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Log API access
export const logAccess = internalMutation({
  args: {
    userId: v.id("users"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    responseTimeMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("apiLogs", {
      ...args,
      createdAt: Date.now(),
    });

    return null;
  },
});
