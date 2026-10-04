import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - WorkOS identity
  users: defineTable({
    workosId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    // Independent, explicit consent for the public token leaderboard.
    usageLeaderboardOptIn: v.optional(v.boolean()),
    usageLeaderboardFirstName: v.optional(v.string()),
    // Legacy field - kept for backward compatibility
    profilePhotoId: v.optional(v.id("_storage")),
    // Optional product email preferences; existing accounts need no backfill.
    emailUpdatesOptOut: v.optional(v.boolean()),
    emailUpdatesOptOutAt: v.optional(v.number()),
    emailSuppressed: v.optional(v.boolean()),
    unsubscribeToken: v.optional(v.string()),
    // API key for external access
    apiKey: v.optional(v.string()),
    apiKeyCreatedAt: v.optional(v.number()),
    // Enabled AI coding agents for source filter dropdown
    enabledAgents: v.optional(v.array(v.string())),
    // Deletion status tracking for batch deletion progress
    deletionStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    deletionStartedAt: v.optional(v.number()),
    deletionCompletedAt: v.optional(v.number()),
    deletionError: v.optional(v.string()),
    // Tracks deletion progress counts
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workos_id", ["workosId"])
    .index("by_email", ["email"])
    .index("by_api_key", ["apiKey"])
    .index("by_unsubscribetoken", ["unsubscribeToken"])
    .searchIndex("search_email", { searchField: "email" })
    .searchIndex("search_name", { searchField: "name" }),

  // Private directory and usage projections; public queries return an explicit safe DTO.
  usagePeople: defineTable({
    userId: v.id("users"), name: v.optional(v.string()), email: v.optional(v.string()),
    searchText: v.string(), nameSort: v.string(), emailSort: v.string(),
    firstName: v.string(), lastName: v.string(), publicOptIn: v.boolean(), publicFirstName: v.string(),
    totalTokens: v.number(), sessionCount: v.number(), topModel: v.string(),
    lastActiveAt: v.number(), joinedAt: v.number(), updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tokens", ["totalTokens"])
    .index("by_sessions", ["sessionCount"])
    .index("by_name", ["nameSort"])
    .index("by_email", ["emailSort"])
    .index("by_model", ["topModel"])
    .index("by_active", ["lastActiveAt"])
    .index("by_joined", ["joinedAt"])
    .index("by_public_tokens", ["publicOptIn", "totalTokens"])
    .index("by_public_first_name", ["publicOptIn", "publicFirstName"])
    .index("by_public_model_first_name", ["publicOptIn", "topModel", "publicFirstName"])
    .index("by_public_sessions", ["publicOptIn", "sessionCount"])
    .index("by_public_name", ["publicOptIn", "nameSort"])
    .index("by_public_model", ["publicOptIn", "topModel"])
    .index("by_model_tokens", ["topModel", "totalTokens"])
    .index("by_model_sessions", ["topModel", "sessionCount"])
    .index("by_model_name", ["topModel", "nameSort"])
    .index("by_public_model_tokens", ["publicOptIn", "topModel", "totalTokens"])
    .index("by_public_model_sessions", ["publicOptIn", "topModel", "sessionCount"])
    .index("by_public_model_name", ["publicOptIn", "topModel", "nameSort"])
    .index("by_public_active", ["publicOptIn", "lastActiveAt"])
    .index("by_public_joined", ["publicOptIn", "joinedAt"])
    .index("by_model_active", ["topModel", "lastActiveAt"])
    .index("by_model_joined", ["topModel", "joinedAt"])
    .index("by_public_model_active", ["publicOptIn", "topModel", "lastActiveAt"])
    .index("by_public_model_joined", ["publicOptIn", "topModel", "joinedAt"])
    .searchIndex("search_people", { searchField: "searchText", filterFields: ["publicOptIn", "topModel"] }),
  usageModelTotals: defineTable({
    userId: v.id("users"), period: v.string(), model: v.string(),
    tokens: v.number(), sessions: v.number(), updatedAt: v.number(),
  })
    .index("by_user_period_model", ["userId", "period", "model"])
    .index("by_user_period_tokens", ["userId", "period", "tokens"])
    .index("by_user_period", ["userId", "period"]),
  // Applied contribution makes repeated backfill and concurrent sync idempotent.
  usageSessionLedger: defineTable({
    sessionId: v.id("sessions"), userId: v.id("users"), model: v.string(),
    period: v.string(), tokens: v.number(), lastActiveAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "lastActiveAt"]),
  usageDirectoryState: defineTable({
    key: v.literal("backfill"),
    phase: v.union(v.literal("users"), v.literal("sessions"), v.literal("complete")),
    cursor: v.union(v.string(), v.null()), runId: v.string(),
    processedUsers: v.number(), processedSessions: v.number(), updatedAt: v.number(),
  }).index("by_key", ["key"]),

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
    .index("by_session_external", { fields: ["sessionId", "externalId"], staged: true })
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
  // Product update email broadcasts composed on /admin and sent via Resend
  emailBroadcasts: defineTable({
    // Absent recipient fields preserve legacy all-account drafts.
    recipientId: v.optional(v.id("users")),
    recipientEmail: v.optional(v.string()),
    subject: v.string(),
    // Plain text body rendered into the shared minimal HTML template
    bodyText: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    // Opted-in recipient count snapshot taken when the send starts
    recipientCount: v.optional(v.number()),
    sentCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
    createdBy: v.id("users"),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    sentAt: v.optional(v.number()),
  }),

  // One row per (broadcast, user) send; doubles as the double-send guard
  emailBroadcastSends: defineTable({
    broadcastId: v.id("emailBroadcasts"),
    userId: v.id("users"),
    // Resend component email id for webhook correlation
    emailId: v.optional(v.string()),
    // Latest lifecycle status (queued, then webhook event types)
    status: v.string(),
  })
    .index("by_broadcastid", ["broadcastId"])
    .index("by_emailid", ["emailId"])
    .index("by_broadcastid_and_userid", ["broadcastId", "userId"]),

  // Audit log for platform admin actions (owner transfers etc.)
  adminAuditLog: defineTable({
    actorId: v.id("users"),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    details: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_actorid", ["actorId"])
    .index("by_targettype_and_targetid", ["targetType", "targetId"]),

});
