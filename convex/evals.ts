import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

// ============================================================================
// EVAL STATUS TYPE (shared validator)
// ============================================================================

const evalStatusValidator = v.union(
  v.literal("golden"),
  v.literal("correct"),
  v.literal("incorrect"),
  v.literal("needs_review"),
);

// ============================================================================
// EVAL SESSION MANAGEMENT
// ============================================================================

/**
 * Mark or unmark a session as eval-ready
 */
export const setEvalReady = mutation({
  args: {
    sessionId: v.id("sessions"),
    evalReady: v.boolean(),
    evalNotes: v.optional(v.string()),
    evalTags: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify session belongs to user via indexed query
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    // Idempotent: early return if already in desired state
    if (
      session.evalReady === args.evalReady &&
      !args.evalNotes &&
      !args.evalTags
    ) {
      return null;
    }

    // Patch directly without reading first
    await ctx.db.patch(args.sessionId, {
      evalReady: args.evalReady,
      reviewedAt: args.evalReady ? Date.now() : undefined,
      evalNotes: args.evalNotes ?? session.evalNotes,
      evalTags: args.evalTags ?? session.evalTags,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Update eval notes for a session
 */
export const updateEvalNotes = mutation({
  args: {
    sessionId: v.id("sessions"),
    evalNotes: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      evalNotes: args.evalNotes,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Update eval tags for a session
 */
export const updateEvalTags = mutation({
  args: {
    sessionId: v.id("sessions"),
    evalTags: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      evalTags: args.evalTags,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Update eval status (golden/correct/incorrect/needs_review)
 */
export const updateEvalStatus = mutation({
  args: {
    sessionId: v.id("sessions"),
    evalStatus: v.optional(evalStatusValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    // Idempotent: early return if already in desired state
    if (session.evalStatus === args.evalStatus) {
      return null;
    }

    await ctx.db.patch(args.sessionId, {
      evalStatus: args.evalStatus,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Update expected output (ground truth) for a session
 */
export const updateExpectedOutput = mutation({
  args: {
    sessionId: v.id("sessions"),
    expectedOutput: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      expectedOutput: args.expectedOutput,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Bulk update eval status for multiple sessions
 */
export const bulkUpdateEvalStatus = mutation({
  args: {
    sessionIds: v.array(v.id("sessions")),
    evalStatus: v.optional(evalStatusValidator),
  },
  returns: v.object({
    updated: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    let updated = 0;
    let failed = 0;
    const now = Date.now();

    // Process in parallel
    await Promise.all(
      args.sessionIds.map(async (sessionId) => {
        try {
          const session = await ctx.db.get(sessionId);
          if (!session || session.userId !== user._id) {
            failed++;
            return;
          }
          await ctx.db.patch(sessionId, {
            evalStatus: args.evalStatus,
            reviewedAt: now,
            updatedAt: now,
          });
          updated++;
        } catch {
          failed++;
        }
      }),
    );

    return { updated, failed };
  },
});

/**
 * Bulk add tags to multiple sessions
 */
export const bulkAddTags = mutation({
  args: {
    sessionIds: v.array(v.id("sessions")),
    tags: v.array(v.string()),
  },
  returns: v.object({
    updated: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    let updated = 0;
    let failed = 0;
    const now = Date.now();

    await Promise.all(
      args.sessionIds.map(async (sessionId) => {
        try {
          const session = await ctx.db.get(sessionId);
          if (!session || session.userId !== user._id) {
            failed++;
            return;
          }
          // Merge existing tags with new tags (no duplicates)
          const existingTags = session.evalTags || [];
          const mergedTags = [...new Set([...existingTags, ...args.tags])];
          await ctx.db.patch(sessionId, {
            evalTags: mergedTags,
            updatedAt: now,
          });
          updated++;
        } catch {
          failed++;
        }
      }),
    );

    return { updated, failed };
  },
});

// ============================================================================
// EVAL QUERIES
// ============================================================================

/**
 * List all eval-ready sessions with enhanced filtering
 */
export const listEvalSessions = query({
  args: {
    // Basic filters
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Enhanced filters per PRD
    model: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    minTokens: v.optional(v.number()),
    project: v.optional(v.string()),
    evalStatus: v.optional(evalStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    sessions: v.array(
      v.object({
        _id: v.id("sessions"),
        externalId: v.string(),
        title: v.optional(v.string()),
        projectPath: v.optional(v.string()),
        projectName: v.optional(v.string()),
        model: v.optional(v.string()),
        provider: v.optional(v.string()),
        source: v.optional(v.string()),
        totalTokens: v.number(),
        cost: v.number(),
        messageCount: v.number(),
        evalReady: v.optional(v.boolean()),
        reviewedAt: v.optional(v.number()),
        evalNotes: v.optional(v.string()),
        evalTags: v.optional(v.array(v.string())),
        evalStatus: v.optional(evalStatusValidator),
        expectedOutput: v.optional(v.string()),
        detectedLanguage: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
    stats: v.object({
      total: v.number(),
      bySource: v.object({
        opencode: v.number(),
        claudeCode: v.number(),
        factoryDroid: v.number(),
        codexCli: v.number(),
        cursor: v.number(),
      }),
      byStatus: v.object({
        golden: v.number(),
        correct: v.number(),
        incorrect: v.number(),
        needsReview: v.number(),
        unset: v.number(),
      }),
      totalTestCases: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const emptyResult = {
      sessions: [],
      stats: {
        total: 0,
        bySource: {
          opencode: 0,
          claudeCode: 0,
          factoryDroid: 0,
          codexCli: 0,
          cursor: 0,
        },
        byStatus: {
          golden: 0,
          correct: 0,
          incorrect: 0,
          needsReview: 0,
          unset: 0,
        },
        totalTestCases: 0,
      },
    };

    if (!identity) return emptyResult;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) return emptyResult;

    // Query eval-ready sessions using index
    let sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_eval_ready", (q) =>
        q.eq("userId", user._id).eq("evalReady", true),
      )
      .order("desc")
      .collect();

    // Apply filters in memory (index only covers userId + evalReady)
    if (args.source) {
      sessions = sessions.filter((s) => s.source === args.source);
    }
    if (args.tags && args.tags.length > 0) {
      sessions = sessions.filter(
        (s) =>
          s.evalTags && args.tags!.some((tag) => s.evalTags!.includes(tag)),
      );
    }
    if (args.model) {
      sessions = sessions.filter((s) => s.model === args.model);
    }
    if (args.dateFrom) {
      sessions = sessions.filter((s) => s.createdAt >= args.dateFrom!);
    }
    if (args.dateTo) {
      sessions = sessions.filter((s) => s.createdAt <= args.dateTo!);
    }
    if (args.minTokens) {
      sessions = sessions.filter((s) => s.totalTokens >= args.minTokens!);
    }
    if (args.project) {
      sessions = sessions.filter(
        (s) =>
          s.projectName?.toLowerCase().includes(args.project!.toLowerCase()) ||
          s.projectPath?.toLowerCase().includes(args.project!.toLowerCase()),
      );
    }
    if (args.evalStatus) {
      sessions = sessions.filter((s) => s.evalStatus === args.evalStatus);
    }

    // Calculate stats from filtered sessions
    const bySource = {
      opencode: sessions.filter((s) => s.source === "opencode" || !s.source)
        .length,
      claudeCode: sessions.filter((s) => s.source === "claude-code").length,
      factoryDroid: sessions.filter((s) => s.source === "factory-droid").length,
      codexCli: sessions.filter((s) => s.source === "codex-cli").length,
      cursor: sessions.filter(
        (s) => s.source === "cursor-sync" || s.source === "cursor",
      ).length,
    };

    const byStatus = {
      golden: sessions.filter((s) => s.evalStatus === "golden").length,
      correct: sessions.filter((s) => s.evalStatus === "correct").length,
      incorrect: sessions.filter((s) => s.evalStatus === "incorrect").length,
      needsReview: sessions.filter((s) => s.evalStatus === "needs_review")
        .length,
      unset: sessions.filter((s) => !s.evalStatus).length,
    };

    const totalTestCases = sessions.reduce((sum, s) => sum + s.messageCount, 0);

    // Apply limit
    const limitedSessions = args.limit
      ? sessions.slice(0, args.limit)
      : sessions;

    return {
      sessions: limitedSessions.map((s) => ({
        _id: s._id,
        externalId: s.externalId,
        title: s.title,
        projectPath: s.projectPath,
        projectName: s.projectName,
        model: s.model,
        provider: s.provider,
        source: s.source,
        totalTokens: s.totalTokens,
        cost: s.cost,
        messageCount: s.messageCount,
        evalReady: s.evalReady,
        reviewedAt: s.reviewedAt,
        evalNotes: s.evalNotes,
        evalTags: s.evalTags,
        evalStatus: s.evalStatus,
        expectedOutput: s.expectedOutput,
        detectedLanguage: s.detectedLanguage,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      stats: {
        total: sessions.length,
        bySource,
        byStatus,
        totalTestCases,
      },
    };
  },
});

/**
 * Get all unique eval tags used by the current user
 */
export const getEvalTags = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) return [];

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const tags = new Set<string>();
    sessions.forEach((s) => {
      s.evalTags?.forEach((tag) => tags.add(tag));
    });

    return Array.from(tags).sort();
  },
});

/**
 * Get all unique models used in eval sessions
 */
export const getEvalModels = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) return [];

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_eval_ready", (q) =>
        q.eq("userId", user._id).eq("evalReady", true),
      )
      .collect();

    const models = new Set<string>();
    sessions.forEach((s) => {
      if (s.model) models.add(s.model);
    });

    return Array.from(models).sort();
  },
});

/**
 * Preview export before downloading (stats + validation)
 */
export const previewExport = query({
  args: {
    sessionIds: v.union(v.array(v.id("sessions")), v.literal("all")),
    source: v.optional(v.string()),
    model: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    minTokens: v.optional(v.number()),
    evalStatus: v.optional(evalStatusValidator),
  },
  returns: v.object({
    sessionCount: v.number(),
    testCaseCount: v.number(),
    bySource: v.object({
      opencode: v.number(),
      claudeCode: v.number(),
      factoryDroid: v.number(),
      codexCli: v.number(),
      cursor: v.number(),
    }),
    byModel: v.array(v.object({ model: v.string(), count: v.number() })),
    byStatus: v.object({
      golden: v.number(),
      correct: v.number(),
      incorrect: v.number(),
      needsReview: v.number(),
      unset: v.number(),
    }),
    sampleSessions: v.array(
      v.object({
        _id: v.id("sessions"),
        title: v.optional(v.string()),
        model: v.optional(v.string()),
        messageCount: v.number(),
      }),
    ),
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const emptyResult = {
      sessionCount: 0,
      testCaseCount: 0,
      bySource: {
        opencode: 0,
        claudeCode: 0,
        factoryDroid: 0,
        codexCli: 0,
        cursor: 0,
      },
      byModel: [],
      byStatus: {
        golden: 0,
        correct: 0,
        incorrect: 0,
        needsReview: 0,
        unset: 0,
      },
      sampleSessions: [],
      warnings: [],
    };

    if (!identity) return emptyResult;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) return emptyResult;

    // Get sessions based on selection
    let sessions;
    if (args.sessionIds === "all") {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user_eval_ready", (q) =>
          q.eq("userId", user._id).eq("evalReady", true),
        )
        .collect();
    } else {
      const fetched = await Promise.all(
        args.sessionIds.map((id) => ctx.db.get(id)),
      );
      sessions = fetched.filter(
        (s) => s && s.userId === user._id && s.evalReady,
      ) as NonNullable<(typeof fetched)[number]>[];
    }

    // Apply additional filters
    if (args.source) {
      sessions = sessions.filter((s) => s.source === args.source);
    }
    if (args.model) {
      sessions = sessions.filter((s) => s.model === args.model);
    }
    if (args.dateFrom) {
      sessions = sessions.filter((s) => s.createdAt >= args.dateFrom!);
    }
    if (args.dateTo) {
      sessions = sessions.filter((s) => s.createdAt <= args.dateTo!);
    }
    if (args.minTokens) {
      sessions = sessions.filter((s) => s.totalTokens >= args.minTokens!);
    }
    if (args.evalStatus) {
      sessions = sessions.filter((s) => s.evalStatus === args.evalStatus);
    }

    // Calculate stats
    const bySource = {
      opencode: sessions.filter((s) => s.source === "opencode" || !s.source)
        .length,
      claudeCode: sessions.filter((s) => s.source === "claude-code").length,
      factoryDroid: sessions.filter((s) => s.source === "factory-droid").length,
      codexCli: sessions.filter((s) => s.source === "codex-cli").length,
      cursor: sessions.filter(
        (s) => s.source === "cursor-sync" || s.source === "cursor",
      ).length,
    };

    const byStatus = {
      golden: sessions.filter((s) => s.evalStatus === "golden").length,
      correct: sessions.filter((s) => s.evalStatus === "correct").length,
      incorrect: sessions.filter((s) => s.evalStatus === "incorrect").length,
      needsReview: sessions.filter((s) => s.evalStatus === "needs_review")
        .length,
      unset: sessions.filter((s) => !s.evalStatus).length,
    };

    // Group by model
    const modelCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      const model = s.model || "unknown";
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });
    const byModel = Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);

    const testCaseCount = sessions.reduce((sum, s) => sum + s.messageCount, 0);

    // Generate validation warnings
    const warnings: Array<string> = [];
    const emptyMessageSessions = sessions.filter((s) => s.messageCount === 0);
    if (emptyMessageSessions.length > 0) {
      warnings.push(
        `${emptyMessageSessions.length} session(s) have no messages and will be skipped`,
      );
    }
    const noModelSessions = sessions.filter((s) => !s.model);
    if (noModelSessions.length > 0) {
      warnings.push(
        `${noModelSessions.length} session(s) have no model specified`,
      );
    }
    if (sessions.length > 1000) {
      warnings.push(
        "Large export (1000+ sessions) may take longer to generate",
      );
    }

    return {
      sessionCount: sessions.length,
      testCaseCount,
      bySource,
      byModel,
      byStatus,
      sampleSessions: sessions.slice(0, 3).map((s) => ({
        _id: s._id,
        title: s.title,
        model: s.model,
        messageCount: s.messageCount,
      })),
      warnings,
    };
  },
});

// ============================================================================
// EVAL EXPORT
// ============================================================================

// Types for export formats
type DeepEvalTestCase = {
  input: string;
  actual_output: string;
  expected_output: string | null;
  context: string[];
  retrieval_context: string[] | null;
  metadata: {
    session_id: string;
    model: string;
    model_version?: string;
    tool: string;
    timestamp: string;
    tokens_input: number;
    tokens_output: number;
    latency_ms?: number;
    project?: string;
    tags: string[];
    eval_status?: string;
  };
};

type OpenAIEvalCase = {
  input: Array<{ role: string; content: string }>;
  ideal: string;
  metadata: {
    session_id: string;
    model: string;
    source: string;
  };
};

type PromptfooTestCase = {
  vars: {
    input: string;
    language?: string;
    task_type?: string;
  };
  assert?: Array<{
    type: string;
    value: string;
  }>;
};

// Types for export data
type ExportSession = {
  _id: string;
  externalId: string;
  title?: string;
  model?: string;
  source?: string;
  projectName?: string;
  projectPath?: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  durationMs?: number;
  createdAt: number;
  evalTags?: string[];
  evalStatus?: string;
  expectedOutput?: string;
  detectedLanguage?: string;
};

type ExportMessage = {
  role: string;
  textContent?: string;
  createdAt: number;
  promptTokens?: number;
  completionTokens?: number;
  durationMs?: number;
};

// Turn mode validator
const turnModeValidator = v.union(
  v.literal("full"),
  v.literal("per_turn"),
  v.literal("final_only"),
);

/**
 * Generate eval export data in the specified format
 */
export const generateEvalExport = action({
  args: {
    sessionIds: v.union(v.array(v.id("sessions")), v.literal("all")),
    format: v.union(
      v.literal("deepeval"),
      v.literal("openai"),
      v.literal("promptfoo"),
      v.literal("filesystem"),
    ),
    options: v.object({
      includeSystemPrompts: v.boolean(),
      includeToolCalls: v.boolean(),
      anonymizePaths: v.boolean(),
      // New options per PRD
      turnMode: v.optional(turnModeValidator),
      codeBlocksOnly: v.optional(v.boolean()),
      minMessageLength: v.optional(v.number()),
    }),
  },
  returns: v.object({
    data: v.string(),
    filename: v.string(),
    stats: v.object({
      sessions: v.number(),
      testCases: v.number(),
      skipped: v.number(),
    }),
    validation: v.object({
      errors: v.array(v.string()),
      warnings: v.array(v.string()),
    }),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get sessions and messages via internal query
    const exportData = await ctx.runQuery(
      // @ts-expect-error internal query reference
      "evals:getExportData",
      {
        sessionIds: args.sessionIds,
        workosId: identity.subject,
      },
    );

    if (!exportData || exportData.sessions.length === 0) {
      throw new Error("No sessions found for export");
    }

    const sessions: ExportSession[] = exportData.sessions;
    const messagesBySession: Record<string, ExportMessage[]> =
      exportData.messagesBySession;
    let testCaseCount = 0;
    let skippedCount = 0;
    const timestamp = new Date().toISOString();
    const errors: Array<string> = [];
    const warnings: Array<string> = [];

    // Default turn mode to per_turn
    const turnMode = args.options.turnMode || "per_turn";

    // Helper to anonymize paths
    const anonymize = (text: string): string => {
      if (!args.options.anonymizePaths) return text;
      return text
        .replace(/\/Users\/[^\/\s]+/g, "/Users/user")
        .replace(/\/home\/[^\/\s]+/g, "/home/user")
        .replace(/C:\\Users\\[^\\]+/g, "C:\\Users\\user");
    };

    // Helper to check if message contains code
    const hasCodeBlock = (text: string): boolean => {
      return /```[\s\S]*?```/.test(text);
    };

    // Helper to filter messages
    const filterMessages = (messages: ExportMessage[]): ExportMessage[] => {
      let filtered = [...messages];

      if (!args.options.includeSystemPrompts) {
        filtered = filtered.filter((m) => m.role !== "system");
      }

      if (args.options.codeBlocksOnly) {
        filtered = filtered.filter((m) => hasCodeBlock(m.textContent || ""));
      }

      if (args.options.minMessageLength) {
        filtered = filtered.filter(
          (m) => (m.textContent?.length || 0) >= args.options.minMessageLength!,
        );
      }

      return filtered;
    };

    // Format: DeepEval JSON
    if (args.format === "deepeval") {
      const testCases: DeepEvalTestCase[] = [];

      for (const session of sessions) {
        const rawMessages = messagesBySession[session._id] || [];
        const messages = filterMessages(rawMessages);

        if (messages.length === 0) {
          skippedCount++;
          warnings.push(
            `Session ${session.externalId.slice(0, 8)}: No messages after filtering`,
          );
          continue;
        }

        // Handle different turn modes
        if (turnMode === "full") {
          // Export entire conversation as one test case
          const userMessages = messages.filter((m) => m.role === "user");
          const assistantMessages = messages.filter(
            (m) => m.role === "assistant",
          );

          if (userMessages.length > 0 && assistantMessages.length > 0) {
            testCases.push({
              input: anonymize(
                userMessages.map((m) => m.textContent || "").join("\n\n"),
              ),
              actual_output: anonymize(
                assistantMessages.map((m) => m.textContent || "").join("\n\n"),
              ),
              expected_output: session.expectedOutput
                ? anonymize(session.expectedOutput)
                : null,
              context: [],
              retrieval_context: null,
              metadata: {
                session_id: session.externalId,
                model: session.model || "unknown",
                tool: session.source || "opencode",
                timestamp: new Date(session.createdAt).toISOString(),
                tokens_input: session.promptTokens,
                tokens_output: session.completionTokens,
                latency_ms: session.durationMs,
                project: session.projectName || session.projectPath,
                tags: session.evalTags || [],
                eval_status: session.evalStatus,
              },
            });
            testCaseCount++;
          }
        } else if (turnMode === "final_only") {
          // Export only the last user->assistant exchange
          const lastUserIdx = messages
            .map((m, i) => ({ m, i }))
            .filter(({ m }) => m.role === "user")
            .pop()?.i;

          if (lastUserIdx !== undefined && lastUserIdx + 1 < messages.length) {
            const userMsg = messages[lastUserIdx];
            const assistantMsg = messages[lastUserIdx + 1];

            if (assistantMsg.role === "assistant") {
              testCases.push({
                input: anonymize(userMsg.textContent || ""),
                actual_output: anonymize(assistantMsg.textContent || ""),
                expected_output: session.expectedOutput
                  ? anonymize(session.expectedOutput)
                  : null,
                context: messages
                  .slice(0, lastUserIdx)
                  .map((m) => anonymize(m.textContent || "")),
                retrieval_context: null,
                metadata: {
                  session_id: session.externalId,
                  model: session.model || "unknown",
                  tool: session.source || "opencode",
                  timestamp: new Date(session.createdAt).toISOString(),
                  tokens_input: userMsg.promptTokens || 0,
                  tokens_output: assistantMsg.completionTokens || 0,
                  latency_ms: assistantMsg.durationMs,
                  project: session.projectName || session.projectPath,
                  tags: session.evalTags || [],
                  eval_status: session.evalStatus,
                },
              });
              testCaseCount++;
            }
          }
        } else {
          // per_turn: Each user->assistant pair as separate test case
          // Skip tool messages when finding user->assistant pairs
          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.role === "user") {
              // Find next assistant response (skip tool messages)
              let nextAssistantIdx = -1;
              for (let j = i + 1; j < messages.length; j++) {
                if (messages[j].role === "assistant") {
                  nextAssistantIdx = j;
                  break;
                }
                // Stop if we hit another user message
                if (messages[j].role === "user") break;
              }

              if (nextAssistantIdx !== -1) {
                const response = messages[nextAssistantIdx];
                testCases.push({
                  input: anonymize(msg.textContent || ""),
                  actual_output: anonymize(response.textContent || ""),
                  expected_output: session.expectedOutput
                    ? anonymize(session.expectedOutput)
                    : null,
                  context: args.options.includeToolCalls
                    ? messages
                        .slice(0, i)
                        .map((m) => anonymize(m.textContent || ""))
                    : [],
                  retrieval_context: null,
                  metadata: {
                    session_id: session.externalId,
                    model: session.model || "unknown",
                    tool: session.source || "opencode",
                    timestamp: new Date(session.createdAt).toISOString(),
                    tokens_input: msg.promptTokens || 0,
                    tokens_output: response.completionTokens || 0,
                    latency_ms: response.durationMs,
                    project: session.projectName || session.projectPath,
                    tags: session.evalTags || [],
                    eval_status: session.evalStatus,
                  },
                });
                testCaseCount++;
              }
            }
          }
        }
      }

      return {
        data: JSON.stringify(testCases, null, 2),
        filename: `opensync-deepeval-${timestamp.split("T")[0]}.json`,
        stats: {
          sessions: sessions.length,
          testCases: testCaseCount,
          skipped: skippedCount,
        },
        validation: { errors, warnings },
      };
    }

    // Format: OpenAI Evals JSONL
    if (args.format === "openai") {
      const lines: string[] = [];

      for (const session of sessions) {
        const rawMessages = messagesBySession[session._id] || [];
        const messages = filterMessages(rawMessages);

        if (messages.length === 0) {
          skippedCount++;
          continue;
        }

        const context: Array<{ role: string; content: string }> = [];

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          context.push({
            role: msg.role,
            content: anonymize(msg.textContent || ""),
          });

          if (msg.role === "user") {
            // Find next assistant response (skip tool messages)
            let nextAssistantIdx = -1;
            for (let j = i + 1; j < messages.length; j++) {
              if (messages[j].role === "assistant") {
                nextAssistantIdx = j;
                break;
              }
              if (messages[j].role === "user") break;
            }

            if (nextAssistantIdx !== -1) {
              const response = messages[nextAssistantIdx];
              const evalCase: OpenAIEvalCase = {
                input: [...context],
                ideal: anonymize(
                  session.expectedOutput || response.textContent || "",
                ),
                metadata: {
                  session_id: session.externalId,
                  model: session.model || "unknown",
                  source: session.source || "opencode",
                },
              };
              lines.push(JSON.stringify(evalCase));
              testCaseCount++;
            }
          }
        }
      }

      return {
        data: lines.join("\n"),
        filename: `opensync-openai-${timestamp.split("T")[0]}.jsonl`,
        stats: {
          sessions: sessions.length,
          testCases: testCaseCount,
          skipped: skippedCount,
        },
        validation: { errors, warnings },
      };
    }

    // Format: Promptfoo JSONL
    if (args.format === "promptfoo") {
      const lines: string[] = [];

      for (const session of sessions) {
        const rawMessages = messagesBySession[session._id] || [];
        const messages = filterMessages(rawMessages);

        if (messages.length === 0) {
          skippedCount++;
          continue;
        }

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (msg.role === "user") {
            // Find next assistant response (skip tool messages)
            let nextAssistantIdx = -1;
            for (let j = i + 1; j < messages.length; j++) {
              if (messages[j].role === "assistant") {
                nextAssistantIdx = j;
                break;
              }
              if (messages[j].role === "user") break;
            }

            if (nextAssistantIdx !== -1) {
              const response = messages[nextAssistantIdx];
              // Detect language from code blocks in response
              const codeMatch = (response.textContent || "").match(/```(\w+)?/);
              const detectedLang = codeMatch?.[1] || session.detectedLanguage;

              // Infer task type from content
              let taskType = "general";
              const content = (msg.textContent || "").toLowerCase();
              if (
                content.includes("fix") ||
                content.includes("bug") ||
                content.includes("error")
              ) {
                taskType = "bug_fix";
              } else if (
                content.includes("write") ||
                content.includes("create") ||
                content.includes("implement")
              ) {
                taskType = "code_generation";
              } else if (
                content.includes("explain") ||
                content.includes("what")
              ) {
                taskType = "explanation";
              } else if (
                content.includes("refactor") ||
                content.includes("improve")
              ) {
                taskType = "refactoring";
              }

              const testCase: PromptfooTestCase = {
                vars: {
                  input: anonymize(msg.textContent || ""),
                  language: detectedLang,
                  task_type: taskType,
                },
              };

              // Add assertions if we have expected output
              if (session.expectedOutput) {
                testCase.assert = [
                  {
                    type: "llm-rubric",
                    value: `Response should match: ${session.expectedOutput}`,
                  },
                ];
              } else if (
                session.evalStatus === "golden" ||
                session.evalStatus === "correct"
              ) {
                testCase.assert = [
                  {
                    type: "llm-rubric",
                    value: "Response should be helpful and accurate",
                  },
                ];
              }

              lines.push(JSON.stringify(testCase));
              testCaseCount++;
            }
          }
        }
      }

      return {
        data: lines.join("\n"),
        filename: `opensync-promptfoo-${timestamp.split("T")[0]}.jsonl`,
        stats: {
          sessions: sessions.length,
          testCases: testCaseCount,
          skipped: skippedCount,
        },
        validation: { errors, warnings },
      };
    }

    // Format: Filesystem (plain text)
    const files: Array<{ name: string; content: string }> = [];
    const fileList: string[] = [];

    for (const session of sessions) {
      const rawMessages = messagesBySession[session._id] || [];
      const messages = filterMessages(rawMessages);

      if (messages.length === 0) {
        skippedCount++;
        continue;
      }

      const lines: string[] = [];

      // Header
      lines.push("=".repeat(80));
      lines.push(`SESSION: ${session.externalId}`);
      lines.push(`SOURCE: ${session.source || "opencode"}`);
      lines.push(`MODEL: ${session.model || "unknown"}`);
      lines.push(`DATE: ${new Date(session.createdAt).toISOString()}`);
      lines.push(`TOKENS: ${session.totalTokens}`);
      if (session.evalStatus) {
        lines.push(`STATUS: ${session.evalStatus}`);
      }
      if (session.evalTags?.length) {
        lines.push(`TAGS: ${session.evalTags.join(", ")}`);
      }
      if (session.projectName) {
        lines.push(
          `PROJECT: ${args.options.anonymizePaths ? "project" : session.projectName}`,
        );
      }
      lines.push("=".repeat(80));
      lines.push("");

      // Messages
      for (const msg of messages) {
        const ts = new Date(msg.createdAt).toISOString();
        const role = msg.role.toUpperCase();
        lines.push(`[${ts}] ${role}:`);
        lines.push(anonymize(msg.textContent || "(empty)"));
        lines.push("");
      }

      lines.push("=".repeat(80));
      lines.push("END SESSION");
      lines.push("=".repeat(80));

      const filename = `session-${session.externalId.slice(0, 8)}.txt`;
      files.push({ name: filename, content: lines.join("\n") });
      fileList.push(filename);
      testCaseCount += messages.filter((m) => m.role === "user").length;
    }

    // Create manifest
    const manifest = {
      opensync_metadata: {
        export_version: "1.0",
        export_date: timestamp,
        total_sessions: sessions.length - skippedCount,
        total_test_cases: testCaseCount,
        skipped_sessions: skippedCount,
      },
      sources: {
        opencode: sessions.filter((s) => s.source === "opencode" || !s.source)
          .length,
        "claude-code": sessions.filter((s) => s.source === "claude-code")
          .length,
        "factory-droid": sessions.filter((s) => s.source === "factory-droid")
          .length,
        "codex-cli": sessions.filter((s) => s.source === "codex-cli").length,
        "cursor-sync": sessions.filter(
          (s) => s.source === "cursor-sync" || s.source === "cursor",
        ).length,
      },
      models: [...new Set(sessions.map((s) => s.model).filter(Boolean))],
      files: fileList,
    };

    const exportBundle = {
      manifest,
      files: files.reduce(
        (acc, f) => ({ ...acc, [f.name]: f.content }),
        {} as Record<string, string>,
      ),
      readme: generateReadme(sessions.length - skippedCount, testCaseCount),
    };

    return {
      data: JSON.stringify(exportBundle, null, 2),
      filename: `opensync-filesystem-${timestamp.split("T")[0]}.json`,
      stats: {
        sessions: sessions.length,
        testCases: testCaseCount,
        skipped: skippedCount,
      },
      validation: { errors, warnings },
    };
  },
});

/**
 * Internal query to get export data (sessions + messages)
 */
export const getExportData = query({
  args: {
    sessionIds: v.union(v.array(v.id("sessions")), v.literal("all")),
    workosId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      sessions: v.array(v.any()),
      messagesBySession: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .first();
    if (!user) return null;

    let sessions;
    if (args.sessionIds === "all") {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user_eval_ready", (q) =>
          q.eq("userId", user._id).eq("evalReady", true),
        )
        .collect();
    } else {
      const fetched = await Promise.all(
        args.sessionIds.map((id) => ctx.db.get(id)),
      );
      sessions = fetched.filter((s) => s && s.userId === user._id);
    }

    // Get messages for each session in parallel
    const messagesBySession: Record<string, any[]> = {};
    await Promise.all(
      sessions.map(async (session) => {
        if (!session) return;
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_session_created", (q) =>
            q.eq("sessionId", session._id),
          )
          .collect();
        messagesBySession[session._id] = messages;
      }),
    );

    return { sessions: sessions.filter(Boolean), messagesBySession };
  },
});

// Helper to generate README content
function generateReadme(sessionCount: number, testCaseCount: number): string {
  return `================================================================================
OPENSYNC EVAL EXPORT
================================================================================

Export date: ${new Date().toISOString()}
Sessions: ${sessionCount}
Test cases: ${testCaseCount}

================================================================================
QUICK START
================================================================================

OPTION 1: DeepEval
------------------
pip install deepeval
export OPENAI_API_KEY=sk-...
deepeval test run opensync-deepeval-*.json

Results: https://app.confident-ai.com
Docs: https://docs.deepeval.com

OPTION 2: OpenAI Evals
----------------------
curl https://api.openai.com/v1/files \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -F purpose="evals" \\
  -F file="@opensync-openai-*.jsonl"

Docs: https://github.com/openai/evals

OPTION 3: Promptfoo
-------------------
npm install -g promptfoo
echo 'tests: file://opensync-promptfoo-*.jsonl' >> promptfooconfig.yaml
promptfoo eval

Docs: https://promptfoo.dev/docs

================================================================================
FORMAT INFO
================================================================================

This export contains real coding sessions captured from AI coding tools.
Use these datasets to evaluate model performance on your actual workflows.

Formats included:
- DeepEval JSON: Best for LLM-as-judge metrics (relevancy, coherence, etc.)
- OpenAI JSONL: Compatible with OpenAI's evaluation framework
- Promptfoo JSONL: Works with Promptfoo's flexible assertion system
- Filesystem: Plain text files for RAG and retrieval testing

================================================================================
`;
}
