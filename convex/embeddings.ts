import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Hash text for change detection
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Generate embedding via OpenAI-compatible API
async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Generate embedding for a session
export const generateForSession = internalAction({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const data = await ctx.runMutation(internal.sessions.getForEmbedding, {
      sessionId,
    });

    if (!data || !data.textContent) return null;

    const textHash = hashText(data.textContent);

    // Check if already up to date
    const existing = await ctx.runQuery(internal.embeddings.getBySessionAndHash, {
      sessionId,
      textHash,
    });

    if (existing) return null;

    // Generate embedding
    const embedding = await embed(data.textContent);

    // Store
    await ctx.runMutation(internal.embeddings.store, {
      sessionId,
      userId: data.session.userId,
      embedding,
      textHash,
    });

    return null;
  },
});

// Store embedding with idempotency check
export const store = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    embedding: v.array(v.float64()),
    textHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check for existing embedding using index
    const existing = await ctx.db
      .query("sessionEmbeddings")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    // Idempotency check: early return if already up to date
    if (existing && existing.textHash === args.textHash) {
      return null;
    }

    const now = Date.now();

    if (existing) {
      // Replace existing embedding with new data
      await ctx.db.replace(existing._id, {
        sessionId: args.sessionId,
        userId: args.userId,
        embedding: args.embedding,
        textHash: args.textHash,
        createdAt: now,
      });
    } else {
      // Insert new embedding
      await ctx.db.insert("sessionEmbeddings", {
        sessionId: args.sessionId,
        userId: args.userId,
        embedding: args.embedding,
        textHash: args.textHash,
        createdAt: now,
      });
    }

    return null;
  },
});

// Check if embedding is current
export const getBySessionAndHash = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    textHash: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("sessionEmbeddings"),
      _creationTime: v.number(),
      sessionId: v.id("sessions"),
      userId: v.id("users"),
      embedding: v.array(v.float64()),
      textHash: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { sessionId, textHash }) => {
    const existing = await ctx.db
      .query("sessionEmbeddings")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (existing && existing.textHash === textHash) {
      return existing;
    }

    return null;
  },
});

// Batch generate for user
export const batchGenerateForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, { userId }): Promise<number> => {
    const sessions: Id<"sessions">[] = await ctx.runQuery(internal.embeddings.getSessionsNeedingEmbeddings, {
      userId,
    });

    for (const sessionId of sessions) {
      try {
        await ctx.runAction(internal.embeddings.generateForSession, { sessionId });
      } catch (e) {
        console.error(`Failed to embed session ${sessionId}:`, e);
      }
    }

    return sessions.length;
  },
});

// Get sessions without embeddings
export const getSessionsNeedingEmbeddings = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.id("sessions")),
  handler: async (ctx, { userId }) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const needsEmbedding = [];

    for (const session of sessions) {
      const embedding = await ctx.db
        .query("sessionEmbeddings")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .first();

      if (!embedding) {
        needsEmbedding.push(session._id);
      }
    }

    return needsEmbedding;
  },
});

// ============================================================================
// MESSAGE-LEVEL EMBEDDINGS (finer-grained retrieval)
// ============================================================================

// Generate embedding for a single message
export const generateForMessage = internalAction({
  args: { messageId: v.id("messages") },
  returns: v.null(),
  handler: async (ctx, { messageId }) => {
    // Get message data
    const data = await ctx.runQuery(internal.embeddings.getMessageForEmbedding, {
      messageId,
    });

    if (!data || !data.textContent) return null;

    const textHash = hashText(data.textContent);

    // Check if embedding already up to date
    const existing = await ctx.runQuery(internal.embeddings.getByMessageAndHash, {
      messageId,
      textHash,
    });

    if (existing) return null;

    // Generate embedding via OpenAI
    const embedding = await embed(data.textContent);

    // Store the embedding
    await ctx.runMutation(internal.embeddings.storeMessageEmbedding, {
      messageId,
      sessionId: data.sessionId,
      userId: data.userId,
      embedding,
      textHash,
    });

    return null;
  },
});

// Get message data for embedding generation
export const getMessageForEmbedding = internalQuery({
  args: { messageId: v.id("messages") },
  returns: v.union(
    v.null(),
    v.object({
      textContent: v.string(),
      sessionId: v.id("sessions"),
      userId: v.id("users"),
    })
  ),
  handler: async (ctx, { messageId }) => {
    const message = await ctx.db.get(messageId);
    if (!message || !message.textContent) return null;

    const session = await ctx.db.get(message.sessionId);
    if (!session) return null;

    return {
      textContent: message.textContent,
      sessionId: message.sessionId,
      userId: session.userId,
    };
  },
});

// Check if message embedding is current
export const getByMessageAndHash = internalQuery({
  args: {
    messageId: v.id("messages"),
    textHash: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("messageEmbeddings"),
      _creationTime: v.number(),
      messageId: v.id("messages"),
      sessionId: v.id("sessions"),
      userId: v.id("users"),
      embedding: v.array(v.float64()),
      textHash: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { messageId, textHash }) => {
    const existing = await ctx.db
      .query("messageEmbeddings")
      .withIndex("by_message", (q) => q.eq("messageId", messageId))
      .first();

    if (existing && existing.textHash === textHash) {
      return existing;
    }

    return null;
  },
});

// Store message embedding with idempotency check
export const storeMessageEmbedding = internalMutation({
  args: {
    messageId: v.id("messages"),
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    embedding: v.array(v.float64()),
    textHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check for existing embedding using index
    const existing = await ctx.db
      .query("messageEmbeddings")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .first();

    // Idempotency check: early return if already up to date
    if (existing && existing.textHash === args.textHash) {
      return null;
    }

    const now = Date.now();

    if (existing) {
      // Replace existing embedding with new data
      await ctx.db.replace(existing._id, {
        messageId: args.messageId,
        sessionId: args.sessionId,
        userId: args.userId,
        embedding: args.embedding,
        textHash: args.textHash,
        createdAt: now,
      });
    } else {
      // Insert new embedding
      await ctx.db.insert("messageEmbeddings", {
        messageId: args.messageId,
        sessionId: args.sessionId,
        userId: args.userId,
        embedding: args.embedding,
        textHash: args.textHash,
        createdAt: now,
      });
    }

    return null;
  },
});

// Batch generate message embeddings for a session
export const batchGenerateForSession = internalAction({
  args: { sessionId: v.id("sessions") },
  returns: v.number(),
  handler: async (ctx, { sessionId }): Promise<number> => {
    const messageIds: Id<"messages">[] = await ctx.runQuery(
      internal.embeddings.getMessagesNeedingEmbeddings,
      { sessionId }
    );

    for (const messageId of messageIds) {
      try {
        await ctx.runAction(internal.embeddings.generateForMessage, { messageId });
      } catch (e) {
        console.error(`Failed to embed message ${messageId}:`, e);
      }
    }

    return messageIds.length;
  },
});

// Batch generate message embeddings for all user's messages
export const batchGenerateMessagesForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, { userId }): Promise<number> => {
    const messageIds: Id<"messages">[] = await ctx.runQuery(
      internal.embeddings.getAllMessagesNeedingEmbeddings,
      { userId }
    );

    let count = 0;
    for (const messageId of messageIds) {
      try {
        await ctx.runAction(internal.embeddings.generateForMessage, { messageId });
        count++;
      } catch (e) {
        console.error(`Failed to embed message ${messageId}:`, e);
      }
    }

    return count;
  },
});

// Get messages in a session that need embeddings
export const getMessagesNeedingEmbeddings = internalQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.array(v.id("messages")),
  handler: async (ctx, { sessionId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const needsEmbedding: Id<"messages">[] = [];

    for (const message of messages) {
      // Skip messages without text content
      if (!message.textContent) continue;

      const embedding = await ctx.db
        .query("messageEmbeddings")
        .withIndex("by_message", (q) => q.eq("messageId", message._id))
        .first();

      if (!embedding) {
        needsEmbedding.push(message._id);
      }
    }

    return needsEmbedding;
  },
});

// Get all messages for a user that need embeddings
export const getAllMessagesNeedingEmbeddings = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.id("messages")),
  handler: async (ctx, { userId }) => {
    // Get all user's sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const needsEmbedding: Id<"messages">[] = [];

    for (const session of sessions) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const message of messages) {
        // Skip messages without text content
        if (!message.textContent) continue;

        const embedding = await ctx.db
          .query("messageEmbeddings")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .first();

        if (!embedding) {
          needsEmbedding.push(message._id);
        }
      }
    }

    return needsEmbedding;
  },
});
