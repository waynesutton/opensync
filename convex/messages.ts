import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Dedup window to prevent rapid updates causing write conflicts
const MESSAGE_DEDUP_MS = 5 * 1000;

// Internal: upsert message from sync
export const upsert = internalMutation({
  args: {
    userId: v.id("users"),
    sessionExternalId: v.string(),
    externalId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system"), v.literal("tool"), v.literal("unknown")),
    textContent: v.optional(v.string()),
    model: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    // Source identifier passed from plugin ("opencode" or "claude-code")
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

    // Check if message already exists (idempotency check first)
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first();

    // Early return if message exists and was recently updated (idempotent)
    if (existing && now - existing.createdAt < MESSAGE_DEDUP_MS) {
      return existing._id;
    }

    // Find session using index
    let session = await ctx.db
      .query("sessions")
      .withIndex("by_user_external", (q) =>
        q.eq("userId", args.userId).eq("externalId", args.sessionExternalId)
      )
      .first();

    // Store session data we need for later (avoid re-reading)
    let sessionId: Id<"sessions">;
    let sessionMessageCount: number;
    let sessionSearchableText: string | undefined;

    // Auto-create session if it doesn't exist (handles out-of-order sync)
    if (!session) {
      // Normalize source: "cursor" -> "cursor-sync" for consistency
      const rawSource = args.source || "opencode";
      const normalizedSource = rawSource === "cursor" ? "cursor-sync" : rawSource;
      sessionId = await ctx.db.insert("sessions", {
        userId: args.userId,
        externalId: args.sessionExternalId,
        title: undefined,
        projectPath: undefined,
        projectName: undefined,
        model: args.model,
        provider: undefined,
        source: normalizedSource,
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
      // Use defaults since we just created it
      sessionMessageCount = 0;
      sessionSearchableText = undefined;
    } else {
      sessionId = session._id;
      sessionMessageCount = session.messageCount;
      sessionSearchableText = session.searchableText;
    }

    let messageId: Id<"messages">;
    let shouldUpdateSessionStats = false;

    if (existing) {
      // Update existing message - patch directly without re-reading
      await ctx.db.patch(existing._id, {
        textContent: args.textContent ?? existing.textContent,
        model: args.model ?? existing.model,
        promptTokens: args.promptTokens ?? existing.promptTokens,
        completionTokens: args.completionTokens ?? existing.completionTokens,
        durationMs: args.durationMs ?? existing.durationMs,
      });
      messageId = existing._id;

      // Delete existing parts in parallel
      const existingParts = await ctx.db
        .query("parts")
        .withIndex("by_message", (q) => q.eq("messageId", messageId))
        .collect();
      
      if (existingParts.length > 0) {
        await Promise.all(existingParts.map((part) => ctx.db.delete(part._id)));
      }
    } else {
      // Create new message
      messageId = await ctx.db.insert("messages", {
        sessionId,
        externalId: args.externalId,
        role: args.role,
        textContent: args.textContent,
        model: args.model,
        promptTokens: args.promptTokens,
        completionTokens: args.completionTokens,
        durationMs: args.durationMs,
        createdAt: now,
      });
      shouldUpdateSessionStats = true;
    }

    // Insert parts in parallel
    if (args.parts && args.parts.length > 0) {
      await Promise.all(
        args.parts.map((part, i) =>
          ctx.db.insert("parts", {
            messageId,
            type: part.type,
            content: part.content,
            order: i,
          })
        )
      );
    }

    // Build searchable text from parts
    let newSearchableText: string | undefined;
    if (args.parts) {
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
        const currentText = sessionSearchableText || "";
        newSearchableText = `${currentText} ${textParts}`.slice(0, 10000);
      }
    }

    // Single combined patch for session updates (avoids multiple writes)
    if (shouldUpdateSessionStats || newSearchableText) {
      const sessionUpdate: Record<string, unknown> = { updatedAt: now };

      if (shouldUpdateSessionStats) {
        // Only update messageCount — session tokens are set exclusively by
        // session-level sync (the authoritative source). Never accumulate
        // per-message tokens onto the session to avoid double-counting.
        sessionUpdate.messageCount = sessionMessageCount + 1;
      }

      if (newSearchableText) {
        sessionUpdate.searchableText = newSearchableText;
      }

      await ctx.db.patch(sessionId, sessionUpdate);
    }

    return messageId;
  },
});

// Message input type for batch upsert
const messageInputValidator = v.object({
  sessionExternalId: v.string(),
  externalId: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system"), v.literal("tool"), v.literal("unknown")),
  textContent: v.optional(v.string()),
  model: v.optional(v.string()),
  promptTokens: v.optional(v.number()),
  completionTokens: v.optional(v.number()),
  durationMs: v.optional(v.number()),
  source: v.optional(v.string()),
  parts: v.optional(
    v.array(
      v.object({
        type: v.string(),
        content: v.any(),
      })
    )
  ),
});

// Internal: batch upsert messages in a single transaction
export const batchUpsert = internalMutation({
  args: {
    userId: v.id("users"),
    messages: v.array(messageInputValidator),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<string> = [];

    // Group messages by session for efficient processing
    const messagesBySession = new Map<string, typeof args.messages>();
    for (const msg of args.messages) {
      const existing = messagesBySession.get(msg.sessionExternalId) || [];
      existing.push(msg);
      messagesBySession.set(msg.sessionExternalId, existing);
    }

    // Process each session's messages
    for (const [sessionExternalId, messages] of messagesBySession) {
      // Find or create session
      let session = await ctx.db
        .query("sessions")
        .withIndex("by_user_external", (q) =>
          q.eq("userId", args.userId).eq("externalId", sessionExternalId)
        )
        .first();

      // Track session stats for batch update
      let sessionMessageCount = 0;
      let sessionSearchableText = "";
      let sessionId: Id<"sessions">;

      if (!session) {
        // Create session for out-of-order messages
        const firstMsg = messages[0];
        // Normalize source: "cursor" -> "cursor-sync" for consistency
        const rawSource = firstMsg.source || "opencode";
        const normalizedSource = rawSource === "cursor" ? "cursor-sync" : rawSource;
        sessionId = await ctx.db.insert("sessions", {
          userId: args.userId,
          externalId: sessionExternalId,
          title: undefined,
          projectPath: undefined,
          projectName: undefined,
          model: firstMsg.model,
          provider: undefined,
          source: normalizedSource,
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
      } else {
        sessionId = session._id;
        sessionMessageCount = session.messageCount;
        sessionSearchableText = session.searchableText || "";
      }

      // Process messages in parallel
      const results = await Promise.all(
        messages.map(async (msg) => {
          try {
            // Check if message exists
            const existing = await ctx.db
              .query("messages")
              .withIndex("by_external_id", (q) => q.eq("externalId", msg.externalId))
              .first();

            // Early return for dedup
            if (existing && now - existing.createdAt < MESSAGE_DEDUP_MS) {
              return { action: "skipped" as const, tokens: { prompt: 0, completion: 0 }, text: "" };
            }

            let messageId: Id<"messages">;
            let addedTokens = { prompt: 0, completion: 0 };

            if (existing) {
              // Update existing
              await ctx.db.patch(existing._id, {
                textContent: msg.textContent ?? existing.textContent,
                model: msg.model ?? existing.model,
                promptTokens: msg.promptTokens ?? existing.promptTokens,
                completionTokens: msg.completionTokens ?? existing.completionTokens,
                durationMs: msg.durationMs ?? existing.durationMs,
              });
              messageId = existing._id;

              // Delete existing parts in parallel
              const existingParts = await ctx.db
                .query("parts")
                .withIndex("by_message", (q) => q.eq("messageId", messageId))
                .collect();
              if (existingParts.length > 0) {
                await Promise.all(existingParts.map((p) => ctx.db.delete(p._id)));
              }

              return { action: "updated" as const, tokens: { prompt: 0, completion: 0 }, text: "" };
            }

            // Insert new message
            messageId = await ctx.db.insert("messages", {
              sessionId,
              externalId: msg.externalId,
              role: msg.role,
              textContent: msg.textContent,
              model: msg.model,
              promptTokens: msg.promptTokens,
              completionTokens: msg.completionTokens,
              durationMs: msg.durationMs,
              createdAt: now,
            });
            addedTokens = {
              prompt: msg.promptTokens || 0,
              completion: msg.completionTokens || 0,
            };

            // Insert parts in parallel
            if (msg.parts && msg.parts.length > 0) {
              await Promise.all(
                msg.parts.map((part, i) =>
                  ctx.db.insert("parts", {
                    messageId,
                    type: part.type,
                    content: part.content,
                    order: i,
                  })
                )
              );
            }

            // Extract searchable text
            let textContent = "";
            if (msg.parts) {
              textContent = msg.parts
                .filter((p) => p.type === "text")
                .map((p) => {
                  const content = p.content;
                  if (!content) return "";
                  if (typeof content === "string") return content;
                  return content.text || content.content || "";
                })
                .filter((t) => t)
                .join(" ");
            }

            return { action: "inserted" as const, tokens: addedTokens, text: textContent };
          } catch (e) {
            return { action: "error" as const, error: `${msg.externalId}: ${e}`, tokens: { prompt: 0, completion: 0 }, text: "" };
          }
        })
      );

      // Aggregate results for session update
      let newMessages = 0;
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      const textParts: Array<string> = [];

      for (const result of results) {
        if (result.action === "inserted") {
          inserted++;
          newMessages++;
          totalPromptTokens += result.tokens.prompt;
          totalCompletionTokens += result.tokens.completion;
          if (result.text) textParts.push(result.text);
        } else if (result.action === "updated") {
          updated++;
        } else if (result.action === "skipped") {
          skipped++;
        } else if (result.action === "error") {
          errors.push(result.error || "Unknown error");
        }
      }

      // Single session update for all new messages — only messageCount and searchableText.
      // Session tokens are set exclusively by session-level sync (the authoritative source).
      // Never accumulate per-message tokens onto the session to avoid double-counting.
      if (newMessages > 0 || textParts.length > 0) {
        const newSearchable = textParts.length > 0
          ? `${sessionSearchableText} ${textParts.join(" ")}`.slice(0, 10000)
          : sessionSearchableText;

        await ctx.db.patch(sessionId, {
          messageCount: sessionMessageCount + newMessages,
          searchableText: newSearchable || undefined,
          updatedAt: now,
        });
      }
    }

    return { inserted, updated, skipped, errors };
  },
});
