import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalAction,
  action,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { nanoid } from "nanoid";
import { Id } from "./_generated/dataModel";

// Batch size to stay under 4096 read limit
const BATCH_SIZE = 200;

// Get current user from auth
export const me = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      hasApiKey: v.boolean(),
      enabledAgents: v.optional(v.array(v.string())),
      createdAt: v.number(),
      // Deletion status for reactive UI
      deletionStatus: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("in_progress"),
          v.literal("completed"),
          v.literal("failed"),
        ),
      ),
      deletionProgress: v.optional(
        v.object({
          sessions: v.number(),
          messages: v.number(),
          parts: v.number(),
          sessionEmbeddings: v.number(),
          messageEmbeddings: v.number(),
          dailyWrapped: v.number(),
          apiLogs: v.number(),
        }),
      ),
      deletionError: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return null;

    // Normalize enabledAgents: convert "cursor" -> "cursor-sync" and deduplicate
    let normalizedAgents = user.enabledAgents;
    if (normalizedAgents) {
      normalizedAgents = normalizedAgents.map((a) =>
        a === "cursor" ? "cursor-sync" : a,
      );
      normalizedAgents = [...new Set(normalizedAgents)];
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasApiKey: !!user.apiKey,
      enabledAgents: normalizedAgents,
      createdAt: user.createdAt,
      deletionStatus: user.deletionStatus,
      deletionProgress: user.deletionProgress,
      deletionError: user.deletionError,
    };
  },
});

// Get or create user from identity (called on login)
export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (existing) {
      // Update if info changed
      if (
        existing.email !== identity.email ||
        existing.name !== identity.name
      ) {
        await ctx.db.patch(existing._id, {
          email: identity.email,
          name: identity.name,
          updatedAt: Date.now(),
        });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      workosId: identity.subject,
      email: identity.email,
      name: identity.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Generate API key for external access
export const generateApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Generate secure API key
    const apiKey = `osk_${nanoid(32)}`;

    await ctx.db.patch(user._id, {
      apiKey,
      apiKeyCreatedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return apiKey;
  },
});

// Revoke API key
export const revokeApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      apiKey: undefined,
      apiKeyCreatedAt: undefined,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Update enabled AI coding agents for source filter dropdown
export const updateEnabledAgents = mutation({
  args: {
    enabledAgents: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { enabledAgents }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Normalize: convert "cursor" -> "cursor-sync" and deduplicate
    const normalizedAgents = [...new Set(
      enabledAgents.map((a) => (a === "cursor" ? "cursor-sync" : a))
    )];

    // Patch directly for idempotency
    await ctx.db.patch(user._id, {
      enabledAgents: normalizedAgents,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Get user stats
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return null;

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const totalTokens = sessions.reduce((acc, s) => acc + s.totalTokens, 0);
    const totalCost = sessions.reduce((acc, s) => acc + s.cost, 0);
    const totalMessages = sessions.reduce((acc, s) => acc + s.messageCount, 0);
    const totalDuration = sessions.reduce(
      (acc, s) => acc + (s.durationMs || 0),
      0
    );

    // Model usage breakdown
    const modelUsage: Record<string, number> = {};
    for (const s of sessions) {
      const model = s.model || "unknown";
      modelUsage[model] = (modelUsage[model] || 0) + s.totalTokens;
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

// Internal: get user by API key
export const getByApiKey = internalMutation({
  args: { apiKey: v.string() },
  handler: async (ctx, { apiKey }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_api_key", (q) => q.eq("apiKey", apiKey))
      .first();
  },
});

// Internal: get user by WorkOS ID
export const getByWorkosId = internalMutation({
  args: { workosId: v.string() },
  handler: async (ctx, { workosId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", workosId))
      .first();

    if (existing) return existing;

    // Create if doesn't exist
    const userId = await ctx.db.insert("users", {
      workosId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// ============================================================================
// BATCH DELETION SYSTEM
// Uses paginated batches to avoid "too many reads" error (limit: 4096)
// ============================================================================

// Start batch deletion process (keeps account intact)
export const deleteAllData = mutation({
  args: {},
  returns: v.object({
    started: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Prevent starting if deletion is already in progress
    if (
      user.deletionStatus === "pending" ||
      user.deletionStatus === "in_progress"
    ) {
      return {
        started: false,
        message: "Deletion already in progress",
      };
    }

    // Mark deletion as pending
    await ctx.db.patch(user._id, {
      deletionStatus: "pending" as const,
      deletionStartedAt: Date.now(),
      deletionCompletedAt: undefined,
      deletionError: undefined,
      deletionProgress: {
        sessions: 0,
        messages: 0,
        parts: 0,
        sessionEmbeddings: 0,
        messageEmbeddings: 0,
        dailyWrapped: 0,
        apiLogs: 0,
      },
    });

    // Schedule background batch deletion
    await ctx.scheduler.runAfter(0, internal.users.orchestrateBatchDeletion, {
      userId: user._id,
      deleteUser: false,
    });

    return {
      started: true,
      message: "Data deletion started. Progress will be shown in real-time.",
    };
  },
});

// Internal orchestrating action that runs batch deletions
export const orchestrateBatchDeletion = internalAction({
  args: {
    userId: v.id("users"),
    deleteUser: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { userId, deleteUser }) => {
    // Mark as in progress
    await ctx.runMutation(internal.users.updateDeletionStatus, {
      userId,
      status: "in_progress",
    });

    try {
      // 1. Delete parts in batches (deepest child records)
      let hasMoreParts = true;
      while (hasMoreParts) {
        const result = await ctx.runMutation(
          internal.users.deletePartsBatch,
          { userId },
        );
        hasMoreParts = result.hasMore;
      }

      // 2. Delete messages in batches
      let hasMoreMessages = true;
      while (hasMoreMessages) {
        const result = await ctx.runMutation(
          internal.users.deleteMessagesBatch,
          { userId },
        );
        hasMoreMessages = result.hasMore;
      }

      // 3. Delete sessions in batches
      let hasMoreSessions = true;
      while (hasMoreSessions) {
        const result = await ctx.runMutation(
          internal.users.deleteSessionsBatch,
          { userId },
        );
        hasMoreSessions = result.hasMore;
      }

      // 4. Delete session embeddings in batches
      let hasMoreSessionEmbeddings = true;
      while (hasMoreSessionEmbeddings) {
        const result = await ctx.runMutation(
          internal.users.deleteSessionEmbeddingsBatch,
          { userId },
        );
        hasMoreSessionEmbeddings = result.hasMore;
      }

      // 5. Delete message embeddings in batches
      let hasMoreMessageEmbeddings = true;
      while (hasMoreMessageEmbeddings) {
        const result = await ctx.runMutation(
          internal.users.deleteMessageEmbeddingsBatch,
          { userId },
        );
        hasMoreMessageEmbeddings = result.hasMore;
      }

      // 6. Delete daily wrapped in batches
      let hasMoreDailyWrapped = true;
      while (hasMoreDailyWrapped) {
        const result = await ctx.runMutation(
          internal.users.deleteDailyWrappedBatch,
          { userId },
        );
        hasMoreDailyWrapped = result.hasMore;
      }

      // 7. Delete API logs in batches
      let hasMoreApiLogs = true;
      while (hasMoreApiLogs) {
        const result = await ctx.runMutation(
          internal.users.deleteApiLogsBatch,
          { userId },
        );
        hasMoreApiLogs = result.hasMore;
      }

      // 8. Optionally delete the user record
      if (deleteUser) {
        await ctx.runMutation(internal.users.deleteUserRecord, { userId });
      } else {
        // Mark deletion as completed
        await ctx.runMutation(internal.users.updateDeletionStatus, {
          userId,
          status: "completed",
        });
      }
    } catch (error) {
      // Mark deletion as failed
      await ctx.runMutation(internal.users.updateDeletionStatus, {
        userId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return null;
  },
});

// Update deletion status (internal)
export const updateDeletionStatus = internalMutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { userId, status, error }) => {
    const updates: Record<string, unknown> = { deletionStatus: status };

    if (status === "completed") {
      updates.deletionCompletedAt = Date.now();
    }
    if (error) {
      updates.deletionError = error;
    }

    await ctx.db.patch(userId, updates);
    return null;
  },
});

// Batch delete parts (delete parts from user's sessions' messages)
export const deletePartsBatch = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, { userId }) => {
    // Get a batch of sessions to find their messages
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20);

    if (sessions.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    let totalDeleted = 0;

    // For each session, get messages and delete their parts
    for (const session of sessions) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .take(10);

      for (const message of messages) {
        const parts = await ctx.db
          .query("parts")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .take(BATCH_SIZE);

        if (parts.length > 0) {
          await Promise.all(parts.map((p) => ctx.db.delete(p._id)));
          totalDeleted += parts.length;
        }
      }
    }

    // Update progress
    const user = await ctx.db.get(userId);
    if (user?.deletionProgress) {
      await ctx.db.patch(userId, {
        deletionProgress: {
          ...user.deletionProgress,
          parts: user.deletionProgress.parts + totalDeleted,
        },
      });
    }

    // Check if there are more parts to delete
    const checkSession = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!checkSession) {
      return { deleted: totalDeleted, hasMore: false };
    }

    const checkMessage = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", checkSession._id))
      .first();

    if (!checkMessage) {
      return { deleted: totalDeleted, hasMore: false };
    }

    const moreParts = await ctx.db
      .query("parts")
      .withIndex("by_message", (q) => q.eq("messageId", checkMessage._id))
      .first();

    return { deleted: totalDeleted, hasMore: moreParts !== null };
  },
});

// Batch delete messages
export const deleteMessagesBatch = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, { userId }) => {
    // Get a batch of sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);

    if (sessions.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    let totalDeleted = 0;

    // Delete messages for each session
    for (const session of sessions) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .take(BATCH_SIZE);

      if (messages.length > 0) {
        await Promise.all(messages.map((m) => ctx.db.delete(m._id)));
        totalDeleted += messages.length;
      }
    }

    // Update progress
    const user = await ctx.db.get(userId);
    if (user?.deletionProgress) {
      await ctx.db.patch(userId, {
        deletionProgress: {
          ...user.deletionProgress,
          messages: user.deletionProgress.messages + totalDeleted,
        },
      });
    }

    // Check if there are more messages
    const checkSession = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!checkSession) {
      return { deleted: totalDeleted, hasMore: false };
    }

    const moreMessages = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", checkSession._id))
      .first();

    return { deleted: totalDeleted, hasMore: moreMessages !== null };
  },
});

// Batch delete sessions
export const deleteSessionsBatch = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(BATCH_SIZE);

    if (sessions.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    await Promise.all(sessions.map((s) => ctx.db.delete(s._id)));

    // Update progress
    const user = await ctx.db.get(userId);
    if (user?.deletionProgress) {
      await ctx.db.patch(userId, {
        deletionProgress: {
          ...user.deletionProgress,
          sessions: user.deletionProgress.sessions + sessions.length,
        },
      });
    }

    // Check if more exist
    const more = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return { deleted: sessions.length, hasMore: more !== null };
  },
});

// Batch delete session embeddings
export const deleteSessionEmbeddingsBatch = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const embeddings = await ctx.db
      .query("sessionEmbeddings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(BATCH_SIZE);

    if (embeddings.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    await Promise.all(embeddings.map((e) => ctx.db.delete(e._id)));

    // Update progress
    const user = await ctx.db.get(userId);
    if (user?.deletionProgress) {
      await ctx.db.patch(userId, {
        deletionProgress: {
          ...user.deletionProgress,
          sessionEmbeddings:
            user.deletionProgress.sessionEmbeddings + embeddings.length,
        },
      });
    }

    const more = await ctx.db
      .query("sessionEmbeddings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return { deleted: embeddings.length, hasMore: more !== null };
  },
});

// Batch delete message embeddings
export const deleteMessageEmbeddingsBatch = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const embeddings = await ctx.db
      .query("messageEmbeddings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(BATCH_SIZE);

    if (embeddings.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    await Promise.all(embeddings.map((e) => ctx.db.delete(e._id)));

    // Update progress
    const user = await ctx.db.get(userId);
    if (user?.deletionProgress) {
      await ctx.db.patch(userId, {
        deletionProgress: {
          ...user.deletionProgress,
          messageEmbeddings:
            user.deletionProgress.messageEmbeddings + embeddings.length,
        },
      });
    }

    const more = await ctx.db
      .query("messageEmbeddings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return { deleted: embeddings.length, hasMore: more !== null };
  },
});

// Batch delete daily wrapped
export const deleteDailyWrappedBatch = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const wrapped = await ctx.db
      .query("dailyWrapped")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(BATCH_SIZE);

    if (wrapped.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    await Promise.all(wrapped.map((w) => ctx.db.delete(w._id)));

    // Update progress
    const user = await ctx.db.get(userId);
    if (user?.deletionProgress) {
      await ctx.db.patch(userId, {
        deletionProgress: {
          ...user.deletionProgress,
          dailyWrapped: user.deletionProgress.dailyWrapped + wrapped.length,
        },
      });
    }

    const more = await ctx.db
      .query("dailyWrapped")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return { deleted: wrapped.length, hasMore: more !== null };
  },
});

// Batch delete API logs
export const deleteApiLogsBatch = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(BATCH_SIZE);

    if (logs.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    await Promise.all(logs.map((l) => ctx.db.delete(l._id)));

    // Update progress
    const user = await ctx.db.get(userId);
    if (user?.deletionProgress) {
      await ctx.db.patch(userId, {
        deletionProgress: {
          ...user.deletionProgress,
          apiLogs: user.deletionProgress.apiLogs + logs.length,
        },
      });
    }

    const more = await ctx.db
      .query("apiLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return { deleted: logs.length, hasMore: more !== null };
  },
});

// Delete the user record itself
export const deleteUserRecord = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    await ctx.db.delete(userId);
    return null;
  },
});

// Clear deletion status (for UI reset after completion)
export const clearDeletionStatus = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      deletionStatus: undefined,
      deletionStartedAt: undefined,
      deletionCompletedAt: undefined,
      deletionError: undefined,
      deletionProgress: undefined,
    });

    return null;
  },
});

// Internal query to get user info for deletion
export const getUserForDeletion = internalMutation({
  args: { workosId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      workosId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, { workosId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", workosId))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      workosId: user.workosId,
    };
  },
});

// Delete account action - starts batch deletion, then deletes WorkOS account
// Uses background batch deletion to avoid "too many reads" error
// Calls WorkOS API: DELETE /user_management/users/{user_id}
export const deleteAccount = action({
  args: {},
  returns: v.object({
    started: v.boolean(),
    message: v.string(),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
  ): Promise<{ started: boolean; message: string; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        started: false,
        message: "Authentication required",
        error: "Not authenticated",
      };
    }

    // Get the user record
    const user: { _id: Id<"users">; workosId: string } | null =
      await ctx.runMutation(internal.users.getUserForDeletion, {
        workosId: identity.subject,
      });

    if (!user) {
      return {
        started: false,
        message: "User not found",
        error: "User not found",
      };
    }

    // Get the WorkOS API key
    const workosApiKey = process.env.WORKOS_API_KEY;
    if (!workosApiKey) {
      return {
        started: false,
        message: "Configuration error",
        error: "WorkOS API key not configured",
      };
    }

    try {
      // Mark deletion as pending with progress tracking
      await ctx.runMutation(internal.users.initiateDeletion, {
        userId: user._id,
      });

      // Start the background batch deletion (which will also delete user record)
      await ctx.scheduler.runAfter(0, internal.users.orchestrateBatchDeletion, {
        userId: user._id,
        deleteUser: true,
      });

      // Delete from WorkOS immediately (this invalidates the session)
      // API Reference: https://workos.com/docs/reference/authkit/user/delete
      const response: Response = await fetch(
        `https://api.workos.com/user_management/users/${user.workosId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${workosApiKey}`,
          },
        },
      );

      // 204 = success (no content), 404 = user already deleted
      if (!response.ok && response.status !== 404) {
        console.error(`WorkOS deletion failed: ${response.status}`);
      }

      return {
        started: true,
        message: "Account deletion started. You will be signed out.",
      };
    } catch (error) {
      return {
        started: false,
        message: "Failed to delete account",
        error: `Failed to delete account: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Internal mutation to initiate deletion with status tracking
export const initiateDeletion = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, {
      deletionStatus: "pending" as const,
      deletionStartedAt: Date.now(),
      deletionCompletedAt: undefined,
      deletionError: undefined,
      deletionProgress: {
        sessions: 0,
        messages: 0,
        parts: 0,
        sessionEmbeddings: 0,
        messageEmbeddings: 0,
        dailyWrapped: 0,
        apiLogs: 0,
      },
    });
    return null;
  },
});
