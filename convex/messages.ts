import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Internal: upsert message from sync
export const upsert = internalMutation({
  args: {
    userId: v.id("users"),
    sessionExternalId: v.string(),
    externalId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system"), v.literal("unknown")),
    textContent: v.optional(v.string()),
    model: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    // Source identifier passed from plugin ("opencode", "claude-code", or "factory-droid")
    source: v.optional(v.string()),
    parts: v.optional(
      v.array(
        v.object({
          type: v.string(),
          content: v.any(),
        })
      )
    ),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find session
    let session = await ctx.db
      .query("sessions")
      .withIndex("by_user_external", (q) =>
        q.eq("userId", args.userId).eq("externalId", args.sessionExternalId)
      )
      .first();

    // Auto-create session if it doesn't exist (handles out-of-order sync)
    // Pass source through so auto-created sessions are tagged correctly
    if (!session) {
      const sessionId = await ctx.db.insert("sessions", {
        userId: args.userId,
        externalId: args.sessionExternalId,
        title: undefined,
        projectPath: undefined,
        projectName: undefined,
        model: args.model,
        provider: undefined,
        source: args.source || "opencode", // Tag with source from plugin
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        durationMs: undefined,
        isPublic: false,
        searchableText: undefined,
        messageCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      session = await ctx.db.get(sessionId);
      if (!session) {
        throw new Error(`Failed to create session: ${args.sessionExternalId}`);
      }
    }

    // Check if message exists
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first();

    let messageId: Id<"messages">;

    if (existing) {
      // Update existing message
      await ctx.db.patch(existing._id, {
        textContent: args.textContent ?? existing.textContent,
        model: args.model ?? existing.model,
        promptTokens: args.promptTokens ?? existing.promptTokens,
        completionTokens: args.completionTokens ?? existing.completionTokens,
        durationMs: args.durationMs ?? existing.durationMs,
      });
      messageId = existing._id;

      // Delete existing parts
      const existingParts = await ctx.db
        .query("parts")
        .withIndex("by_message", (q) => q.eq("messageId", messageId))
        .collect();
      for (const part of existingParts) {
        await ctx.db.delete(part._id);
      }
    } else {
      // Create new message
      messageId = await ctx.db.insert("messages", {
        sessionId: session._id,
        externalId: args.externalId,
        role: args.role,
        textContent: args.textContent,
        model: args.model,
        promptTokens: args.promptTokens,
        completionTokens: args.completionTokens,
        durationMs: args.durationMs,
        createdAt: now,
      });

      // Update session message count and tokens
      const newPromptTokens = session.promptTokens + (args.promptTokens || 0);
      const newCompletionTokens = session.completionTokens + (args.completionTokens || 0);

      await ctx.db.patch(session._id, {
        messageCount: session.messageCount + 1,
        promptTokens: newPromptTokens,
        completionTokens: newCompletionTokens,
        totalTokens: newPromptTokens + newCompletionTokens,
        updatedAt: now,
      });
    }

    // Insert parts
    if (args.parts) {
      for (let i = 0; i < args.parts.length; i++) {
        await ctx.db.insert("parts", {
          messageId,
          type: args.parts[i].type,
          content: args.parts[i].content,
          order: i,
        });
      }

      // Update searchable text with content normalization
      // Handle both string content and object content ({ text: "..." } or { content: "..." })
      const textParts = args.parts
        .filter((p) => p.type === "text")
        .map((p) => {
          const content = p.content;
          if (!content) return "";
          if (typeof content === "string") return content;
          return content.text || content.content || "";
        })
        .filter((t) => t)
        .join(" ");

      if (textParts) {
        const currentText = session.searchableText || "";
        await ctx.db.patch(session._id, {
          searchableText: `${currentText} ${textParts}`.slice(0, 10000),
          updatedAt: now,
        });
      }
    }

    return messageId;
  },
});
