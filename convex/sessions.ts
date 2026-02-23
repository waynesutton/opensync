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

// Dedup window to prevent rapid updates causing write conflicts
const SESSION_DEDUP_MS = 10 * 1000;

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
    source: v.optional(v.string()), // "opencode" or "claude-code"
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    cost: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    createdAt: v.optional(v.number()), // Original timestamp from source
  },
  returns: v.id("sessions"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Find existing session using index
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_user_external", (q) =>
        q.eq("userId", args.userId).eq("externalId", args.externalId)
      )
      .first();

    const promptTokens = args.promptTokens ?? 0;
    const completionTokens = args.completionTokens ?? 0;
    // Normalize source: "cursor" -> "cursor-sync" for consistency
    const rawSource = args.source || "opencode";
    const source = rawSource === "cursor" ? "cursor-sync" : rawSource;

    if (existing) {
      // Idempotency check: skip if recently updated with same key values
      const noMeaningfulChanges =
        args.title === existing.title &&
        args.model === existing.model &&
        args.projectPath === existing.projectPath &&
        (promptTokens === 0 || promptTokens === existing.promptTokens) &&
        (completionTokens === 0 || completionTokens === existing.completionTokens);

      if (noMeaningfulChanges && now - existing.updatedAt < SESSION_DEDUP_MS) {
        // Early return - no changes needed within dedup window
        return existing._id;
      }

      // Build update object only with changed fields
      const updates: Record<string, unknown> = { updatedAt: now };

      if (args.title !== undefined && args.title !== existing.title) {
        updates.title = args.title;
        updates.searchableText = args.title;
      }
      if (args.projectPath !== undefined && args.projectPath !== existing.projectPath) {
        updates.projectPath = args.projectPath;
      }
      if (args.projectName !== undefined && args.projectName !== existing.projectName) {
        updates.projectName = args.projectName;
      }
      if (args.model !== undefined && args.model !== existing.model) {
        updates.model = args.model;
      }
      if (args.provider !== undefined && args.provider !== existing.provider) {
        updates.provider = args.provider;
      }
      if (args.source !== undefined && args.source !== existing.source) {
        updates.source = args.source;
      }
      if (promptTokens > 0 && promptTokens !== existing.promptTokens) {
        updates.promptTokens = promptTokens;
      }
      if (completionTokens > 0 && completionTokens !== existing.completionTokens) {
        updates.completionTokens = completionTokens;
      }
      if (promptTokens > 0 || completionTokens > 0) {
        const newPrompt = promptTokens || existing.promptTokens;
        const newCompletion = completionTokens || existing.completionTokens;
        updates.totalTokens = newPrompt + newCompletion;
      }
      if (args.cost !== undefined && args.cost !== existing.cost) {
        updates.cost = args.cost;
      }
      if (args.durationMs !== undefined && args.durationMs !== existing.durationMs) {
        updates.durationMs = args.durationMs;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Insert new session - use provided createdAt or current time
    const sessionCreatedAt = args.createdAt ?? now;
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
      createdAt: sessionCreatedAt,
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

// Session input type for batch upsert
const sessionInputValidator = v.object({
  externalId: v.string(),
  title: v.optional(v.string()),
  projectPath: v.optional(v.string()),
  projectName: v.optional(v.string()),
  model: v.optional(v.string()),
  provider: v.optional(v.string()),
  source: v.optional(v.string()),
  promptTokens: v.optional(v.number()),
  completionTokens: v.optional(v.number()),
  cost: v.optional(v.number()),
  durationMs: v.optional(v.number()),
});

// Internal: batch upsert sessions in a single transaction
export const batchUpsert = internalMutation({
  args: {
    userId: v.id("users"),
    sessions: v.array(sessionInputValidator),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    // Process sessions in parallel using Promise.all
    const results = await Promise.all(
      args.sessions.map(async (session) => {
        // Find existing session
        const existing = await ctx.db
          .query("sessions")
          .withIndex("by_user_external", (q) =>
            q.eq("userId", args.userId).eq("externalId", session.externalId)
          )
          .first();

        const promptTokens = session.promptTokens ?? 0;
        const completionTokens = session.completionTokens ?? 0;
        // Normalize source: "cursor" -> "cursor-sync" for consistency
        const rawSource = session.source || "opencode";
        const source = rawSource === "cursor" ? "cursor-sync" : rawSource;

        if (existing) {
          // Idempotency check
          const noChanges =
            session.title === existing.title &&
            session.model === existing.model &&
            (promptTokens === 0 || promptTokens === existing.promptTokens);

          if (noChanges && now - existing.updatedAt < SESSION_DEDUP_MS) {
            return { action: "skipped" as const };
          }

          // Build minimal update
          const updates: Record<string, unknown> = { updatedAt: now };
          if (session.title !== undefined) updates.title = session.title;
          if (session.projectPath !== undefined) updates.projectPath = session.projectPath;
          if (session.projectName !== undefined) updates.projectName = session.projectName;
          if (session.model !== undefined) updates.model = session.model;
          if (session.provider !== undefined) updates.provider = session.provider;
          if (session.source !== undefined) updates.source = session.source;
          if (promptTokens > 0) {
            updates.promptTokens = promptTokens;
            updates.totalTokens = promptTokens + (session.completionTokens || existing.completionTokens);
          }
          if (completionTokens > 0) {
            updates.completionTokens = completionTokens;
            updates.totalTokens = (session.promptTokens || existing.promptTokens) + completionTokens;
          }
          if (session.cost !== undefined) updates.cost = session.cost;
          if (session.durationMs !== undefined) updates.durationMs = session.durationMs;

          await ctx.db.patch(existing._id, updates);
          return { action: "updated" as const };
        }

        // Insert new session
        await ctx.db.insert("sessions", {
          userId: args.userId,
          externalId: session.externalId,
          title: session.title,
          projectPath: session.projectPath,
          projectName: session.projectName,
          model: session.model,
          provider: session.provider,
          source,
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost: session.cost ?? 0,
          durationMs: session.durationMs,
          isPublic: false,
          searchableText: session.title,
          messageCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        return { action: "inserted" as const };
      })
    );

    // Count results
    for (const result of results) {
      if (result.action === "inserted") inserted++;
      else if (result.action === "updated") updated++;
      else skipped++;
    }

    return { inserted, updated, skipped };
  },
});
