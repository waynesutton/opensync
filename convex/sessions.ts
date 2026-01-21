import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { nanoid } from "nanoid";

// List sessions for current user
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("sessions")),
  },
  handler: async (ctx, { limit = 50 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { sessions: [], hasMore: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return { sessions: [], hasMore: false };

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit + 1);

    const hasMore = sessions.length > limit;
    const result = hasMore ? sessions.slice(0, limit) : sessions;

    return {
      sessions: result.map((s) => ({
        _id: s._id,
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
        publicSlug: s.publicSlug,
        summary: s.summary,
        messageCount: s.messageCount,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      hasMore,
    };
  },
});

// Get single session with messages
export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return null;

    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== user._id) return null;

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
        return { ...msg, parts: parts.sort((a, b) => a.order - b.order) };
      })
    );

    return { session, messages: messagesWithParts };
  },
});

// Get public session by slug
export const getPublic = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_public_slug", (q) => q.eq("publicSlug", slug))
      .first();

    if (!session || !session.isPublic) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_session_created", (q) => q.eq("sessionId", session._id))
      .collect();

    const messagesWithParts = await Promise.all(
      messages.map(async (msg) => {
        const parts = await ctx.db
          .query("parts")
          .withIndex("by_message", (q) => q.eq("messageId", msg._id))
          .collect();
        return { ...msg, parts: parts.sort((a, b) => a.order - b.order) };
      })
    );

    // Don't expose userId
    const { userId, searchableText, ...publicSession } = session;

    return { session: publicSession, messages: messagesWithParts };
  },
});

// Toggle session visibility
export const setVisibility = mutation({
  args: {
    sessionId: v.id("sessions"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, { sessionId, isPublic }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    const updates: any = { isPublic, updatedAt: Date.now() };

    if (isPublic && !session.publicSlug) {
      updates.publicSlug = nanoid(10);
    }

    await ctx.db.patch(sessionId, updates);

    return {
      isPublic,
      publicSlug: updates.publicSlug || session.publicSlug,
    };
  },
});

// Delete session
export const remove = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    // Delete parts
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    for (const msg of messages) {
      const parts = await ctx.db
        .query("parts")
        .withIndex("by_message", (q) => q.eq("messageId", msg._id))
        .collect();
      for (const part of parts) {
        await ctx.db.delete(part._id);
      }
      await ctx.db.delete(msg._id);
    }

    // Delete embeddings
    const embeddings = await ctx.db
      .query("sessionEmbeddings")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const emb of embeddings) {
      await ctx.db.delete(emb._id);
    }

    await ctx.db.delete(sessionId);
    return true;
  },
});

// Export as markdown
export const getMarkdown = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_session_created", (q) => q.eq("sessionId", sessionId))
      .collect();

    let md = `# ${session.title || "Untitled Session"}\n\n`;
    md += `| Property | Value |\n|----------|-------|\n`;
    md += `| Project | ${session.projectPath || "N/A"} |\n`;
    md += `| Model | ${session.model || "N/A"} |\n`;
    md += `| Tokens | ${session.totalTokens.toLocaleString()} |\n`;
    md += `| Cost | $${session.cost.toFixed(4)} |\n`;
    md += `| Date | ${new Date(session.createdAt).toLocaleString()} |\n\n`;
    md += `---\n\n`;

    for (const message of messages) {
      const parts = await ctx.db
        .query("parts")
        .withIndex("by_message", (q) => q.eq("messageId", message._id))
        .collect();

      const role = message.role === "user" ? "## User" : "## Assistant";
      md += `${role}\n\n`;

      // Check if we have parts with content
      const sortedParts = parts.sort((a, b) => a.order - b.order);
      let hasContent = false;

      for (const part of sortedParts) {
        if (part.type === "text" && part.content) {
          // Handle both string content and object with text property
          const textContent = typeof part.content === "string" 
            ? part.content 
            : part.content?.text || part.content?.content || "";
          if (textContent) {
            md += `${textContent}\n\n`;
            hasContent = true;
          }
        } else if (part.type === "tool-call" && part.content) {
          const toolName = part.content.name || part.content.toolName || "Unknown Tool";
          const toolArgs = part.content.args || part.content.arguments || part.content.input || {};
          md += `**Tool: ${toolName}**\n\`\`\`json\n${JSON.stringify(toolArgs, null, 2)}\n\`\`\`\n\n`;
          hasContent = true;
        } else if (part.type === "tool-result" && part.content) {
          const result = part.content.result || part.content.output || part.content;
          const resultStr = typeof result === "string" ? result : JSON.stringify(result, null, 2);
          md += `**Result:**\n\`\`\`\n${resultStr}\n\`\`\`\n\n`;
          hasContent = true;
        }
      }

      // Fallback: if no parts content, use message.textContent
      if (!hasContent && message.textContent) {
        md += `${message.textContent}\n\n`;
      }
    }

    return md;
  },
});

// Internal: upsert session from sync
export const upsert = internalMutation({
  args: {
    userId: v.id("users"),
    externalId: v.string(),
    title: v.optional(v.string()),
    projectPath: v.optional(v.string()),
    projectName: v.optional(v.string()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    source: v.optional(v.string()), // "opencode", "claude-code", or "factory-droid"
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    cost: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_user_external", (q) =>
        q.eq("userId", args.userId).eq("externalId", args.externalId)
      )
      .first();

    const now = Date.now();
    const promptTokens = args.promptTokens ?? 0;
    const completionTokens = args.completionTokens ?? 0;
    // Default source to "opencode" for backward compatibility
    const source = args.source || "opencode";

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title ?? existing.title,
        projectPath: args.projectPath ?? existing.projectPath,
        projectName: args.projectName ?? existing.projectName,
        model: args.model ?? existing.model,
        provider: args.provider ?? existing.provider,
        source: args.source ?? existing.source ?? "opencode",
        promptTokens: promptTokens || existing.promptTokens,
        completionTokens: completionTokens || existing.completionTokens,
        totalTokens: (promptTokens + completionTokens) || existing.totalTokens,
        cost: args.cost ?? existing.cost,
        durationMs: args.durationMs ?? existing.durationMs,
        searchableText: args.title ?? existing.searchableText,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("sessions", {
      userId: args.userId,
      externalId: args.externalId,
      title: args.title,
      projectPath: args.projectPath,
      projectName: args.projectName,
      model: args.model,
      provider: args.provider,
      source,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost: args.cost ?? 0,
      durationMs: args.durationMs,
      isPublic: false,
      searchableText: args.title,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Helper to extract text content from various formats for embeddings
function extractPartText(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content.text || content.content || "";
}

// Internal: get session for embedding
export const getForEmbedding = internalMutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    // Build text content from messages
    const messageTexts: string[] = [];
    
    for (const msg of messages) {
      // First try textContent
      if (msg.textContent) {
        messageTexts.push(msg.textContent);
        continue;
      }
      
      // Fallback to parts if textContent is empty
      const parts = await ctx.db
        .query("parts")
        .withIndex("by_message", (q) => q.eq("messageId", msg._id))
        .collect();
      
      const partsText = parts
        .filter((p) => p.type === "text")
        .sort((a, b) => a.order - b.order)
        .map((p) => extractPartText(p.content))
        .filter(Boolean)
        .join("\n");
      
      if (partsText) {
        messageTexts.push(partsText);
      }
    }

    const textContent = messageTexts.filter(Boolean).join("\n\n");

    return {
      session,
      textContent: `${session.title || ""}\n\n${textContent}`.trim(),
    };
  },
});

// Internal: list all external IDs for a user (used by sync CLI)
export const listExternalIds = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.string()),
  handler: async (ctx, { userId }) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return sessions.map((s) => s.externalId);
  },
});

// Export all user data as CSV
export const exportAllDataCSV = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get all sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Build CSV header - includes Source field to distinguish OpenCode vs Claude Code
    const headers = [
      "Session ID",
      "External ID",
      "Source",
      "Title",
      "Project Name",
      "Project Path",
      "Model",
      "Provider",
      "Prompt Tokens",
      "Completion Tokens",
      "Total Tokens",
      "Cost",
      "Duration (ms)",
      "Message Count",
      "Is Public",
      "Public Slug",
      "Created At",
      "Updated At",
    ];

    // Build CSV rows - exports ALL sessions (both OpenCode and Claude Code)
    const rows = sessions.map((s) => [
      s._id,
      s.externalId,
      s.source || "opencode", // Default to opencode for legacy sessions
      `"${(s.title || "").replace(/"/g, '""')}"`,
      `"${(s.projectName || "").replace(/"/g, '""')}"`,
      `"${(s.projectPath || "").replace(/"/g, '""')}"`,
      s.model || "",
      s.provider || "",
      s.promptTokens,
      s.completionTokens,
      s.totalTokens,
      s.cost.toFixed(6),
      s.durationMs || "",
      s.messageCount,
      s.isPublic,
      s.publicSlug || "",
      new Date(s.createdAt).toISOString(),
      new Date(s.updatedAt).toISOString(),
    ]);

    // Combine header and rows
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return csv;
  },
});
