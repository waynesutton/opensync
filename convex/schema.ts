import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - WorkOS identity
  users: defineTable({
    workosId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    // Legacy field - kept for backward compatibility
    profilePhotoId: v.optional(v.id("_storage")),
    // API key for external access
    apiKey: v.optional(v.string()),
    apiKeyCreatedAt: v.optional(v.number()),
    // Enabled AI coding agents for source filter dropdown
    enabledAgents: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workos_id", ["workosId"])
    .index("by_email", ["email"])
    .index("by_api_key", ["apiKey"]),

  // Sessions from OpenCode and Claude Code plugins
  sessions: defineTable({
    userId: v.id("users"),
    externalId: v.string(),
    title: v.optional(v.string()),
    projectPath: v.optional(v.string()),
    projectName: v.optional(v.string()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),

    // Source identifier: "opencode" or "claude-code"
    source: v.optional(v.string()),

    // Token usage
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    cost: v.number(),

    // Timing
    durationMs: v.optional(v.number()),

    // Visibility
    isPublic: v.boolean(),
    publicSlug: v.optional(v.string()),

    // For full-text search
    searchableText: v.optional(v.string()),

    // Summary
    summary: v.optional(v.string()),
    messageCount: v.number(),

    // Eval fields for export datasets
    evalReady: v.optional(v.boolean()),
    reviewedAt: v.optional(v.number()),
    evalNotes: v.optional(v.string()),
    evalTags: v.optional(v.array(v.string())),
    // Annotation status for eval quality (golden = high-quality, correct = verified, incorrect = wrong, needs_review = unverified)
    evalStatus: v.optional(
      v.union(
        v.literal("golden"),
        v.literal("correct"),
        v.literal("incorrect"),
        v.literal("needs_review"),
      ),
    ),
    // Expected output for ground truth comparison in evals
    expectedOutput: v.optional(v.string()),
    // Auto-detected programming language from code blocks
    detectedLanguage: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_external_id", ["externalId"])
    .index("by_user_external", ["userId", "externalId"])
    .index("by_public_slug", ["publicSlug"])
    .index("by_user_source", ["userId", "source"])
    .index("by_user_eval_ready", ["userId", "evalReady"])
    .index("by_user_eval_status", ["userId", "evalStatus"])
    .searchIndex("search_sessions", {
      searchField: "searchableText",
      filterFields: ["userId"],
    }),

  // Messages within sessions
  messages: defineTable({
    sessionId: v.id("sessions"),
    externalId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
      v.literal("tool"),
      v.literal("unknown"),
    ),
    textContent: v.optional(v.string()),
    model: v.optional(v.string()),

    // Token usage per message
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),

    // Timing
    durationMs: v.optional(v.number()),

    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_created", ["sessionId", "createdAt"])
    .index("by_external_id", ["externalId"])
    .searchIndex("search_messages", {
      searchField: "textContent",
      filterFields: ["sessionId"],
    }),

  // Message parts (text, tool calls, code blocks, etc.)
  parts: defineTable({
    messageId: v.id("messages"),
    type: v.string(),
    content: v.any(),
    order: v.number(),
  }).index("by_message", ["messageId"]),

  // Vector embeddings for semantic search (session-level)
  sessionEmbeddings: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    embedding: v.array(v.float64()),
    textHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId"],
    }),

  // Vector embeddings for semantic search (message-level, finer-grained)
  messageEmbeddings: defineTable({
    messageId: v.id("messages"),
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    embedding: v.array(v.float64()),
    textHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId"],
    }),

  // API access logs
  apiLogs: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    responseTimeMs: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  // Daily Wrapped images - AI-generated visualization of 24h activity
  dailyWrapped: defineTable({
    userId: v.id("users"),
    date: v.string(), // "2026-01-22" format
    designIndex: v.number(), // 0-9 for template rotation
    imageStorageId: v.optional(v.id("_storage")), // Generated image
    generatedAt: v.number(), // timestamp
    expiresAt: v.number(), // timestamp (24h later)
    // Snapshot of data at generation time
    stats: v.object({
      totalTokens: v.number(),
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalMessages: v.number(),
      cost: v.number(),
      topModels: v.array(
        v.object({
          model: v.string(),
          tokens: v.number(),
        }),
      ),
      topProviders: v.array(
        v.object({
          provider: v.string(),
          tokens: v.number(),
        }),
      ),
    }),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"])
    .index("by_expires", ["expiresAt"]),

  // Documentation pages for Convex-backed search
  docPages: defineTable({
    slug: v.string(), // URL path like "getting-started/hosted"
    title: v.string(),
    description: v.optional(v.string()),
    section: v.string(), // Top-level section like "Getting Started"
    order: v.number(), // Sort order within section
    keywords: v.array(v.string()),
    content: v.string(), // Raw MDX content
    searchableText: v.string(), // Plain text for search
    path: v.string(), // Full URL path
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_section", ["section"])
    .index("by_section_order", ["section", "order"])
    .searchIndex("search_docs", {
      searchField: "searchableText",
      filterFields: ["section"],
    }),

  // Doc page embeddings for semantic search
  docEmbeddings: defineTable({
    docPageId: v.id("docPages"),
    embedding: v.array(v.float64()),
    textHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_doc_page", ["docPageId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
    }),
});
