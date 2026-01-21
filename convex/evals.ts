import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

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
    if (session.evalReady === args.evalReady && !args.evalNotes && !args.evalTags) {
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

// ============================================================================
// EVAL QUERIES
// ============================================================================

/**
 * List all eval-ready sessions for the current user
 */
export const listEvalSessions = query({
  args: {
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
    stats: v.object({
      total: v.number(),
      bySource: v.object({
        opencode: v.number(),
        claudeCode: v.number(),
        factoryDroid: v.number(),
      }),
      totalTestCases: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { sessions: [], stats: { total: 0, bySource: { opencode: 0, claudeCode: 0, factoryDroid: 0 }, totalTestCases: 0 } };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();
    if (!user) {
      return { sessions: [], stats: { total: 0, bySource: { opencode: 0, claudeCode: 0, factoryDroid: 0 }, totalTestCases: 0 } };
    }

    // Query eval-ready sessions using index
    let sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_eval_ready", (q) => q.eq("userId", user._id).eq("evalReady", true))
      .order("desc")
      .collect();

    // Filter by source if provided
    if (args.source) {
      sessions = sessions.filter((s) => s.source === args.source);
    }

    // Filter by tags if provided
    if (args.tags && args.tags.length > 0) {
      sessions = sessions.filter((s) => 
        s.evalTags && args.tags!.some((tag) => s.evalTags!.includes(tag))
      );
    }

    // Calculate stats
    const opencodeCount = sessions.filter((s) => s.source === "opencode" || !s.source).length;
    const claudeCodeCount = sessions.filter((s) => s.source === "claude-code").length;
    const factoryDroidCount = sessions.filter((s) => s.source === "factory-droid").length;
    const totalTestCases = sessions.reduce((sum, s) => sum + s.messageCount, 0);

    // Apply limit
    const limitedSessions = args.limit ? sessions.slice(0, args.limit) : sessions;

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
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      stats: {
        total: sessions.length,
        bySource: {
          opencode: opencodeCount,
          claudeCode: claudeCodeCount,
          factoryDroid: factoryDroidCount,
        },
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

// ============================================================================
// EVAL EXPORT
// ============================================================================

// Types for export formats
type DeepEvalTestCase = {
  input: string;
  actual_output: string;
  expected_output: string;
  context: string[];
  metadata: {
    session_id: string;
    model: string;
    source: string;
    tokens: number;
    timestamp: string;
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

// Types for export data
type ExportSession = {
  _id: string;
  externalId: string;
  title?: string;
  model?: string;
  source?: string;
  totalTokens: number;
  createdAt: number;
  evalTags?: string[];
};

type ExportMessage = {
  role: string;
  textContent?: string;
  createdAt: number;
  promptTokens?: number;
  completionTokens?: number;
};

/**
 * Generate eval export data in the specified format
 */
export const generateEvalExport = action({
  args: {
    sessionIds: v.union(v.array(v.id("sessions")), v.literal("all")),
    format: v.union(v.literal("deepeval"), v.literal("openai"), v.literal("filesystem")),
    options: v.object({
      includeSystemPrompts: v.boolean(),
      includeToolCalls: v.boolean(),
      anonymizePaths: v.boolean(),
    }),
  },
  returns: v.object({
    data: v.string(),
    filename: v.string(),
    stats: v.object({
      sessions: v.number(),
      testCases: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get sessions and messages via internal query
    const exportData = await ctx.runQuery(
      // @ts-expect-error - internal query
      "evals:getExportData",
      {
        sessionIds: args.sessionIds,
        workosId: identity.subject,
      }
    );

    if (!exportData || exportData.sessions.length === 0) {
      throw new Error("No sessions found for export");
    }

    const sessions: ExportSession[] = exportData.sessions;
    const messagesBySession: Record<string, ExportMessage[]> = exportData.messagesBySession;
    let testCaseCount = 0;
    const timestamp = new Date().toISOString();

    // Helper to anonymize paths
    const anonymize = (text: string): string => {
      if (!args.options.anonymizePaths) return text;
      return text.replace(/\/Users\/[^\/]+/g, "/Users/user")
                 .replace(/\/home\/[^\/]+/g, "/home/user")
                 .replace(/C:\\Users\\[^\\]+/g, "C:\\Users\\user");
    };

    if (args.format === "deepeval") {
      // DeepEval JSON format
      const testCases: DeepEvalTestCase[] = [];

      for (const session of sessions) {
        const messages = messagesBySession[session._id] || [];
        
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (msg.role === "user" && i + 1 < messages.length) {
            const response = messages[i + 1];
            if (response.role === "assistant") {
              testCases.push({
                input: anonymize(msg.textContent || ""),
                actual_output: anonymize(response.textContent || ""),
                expected_output: anonymize(response.textContent || ""),
                context: args.options.includeToolCalls 
                  ? messages.slice(0, i).map((m: ExportMessage) => anonymize(m.textContent || ""))
                  : [],
                metadata: {
                  session_id: session.externalId,
                  model: session.model || "unknown",
                  source: session.source || "opencode",
                  tokens: (msg.promptTokens || 0) + (response.completionTokens || 0),
                  timestamp: new Date(session.createdAt).toISOString(),
                },
              });
              testCaseCount++;
            }
          }
        }
      }

      return {
        data: JSON.stringify({ test_cases: testCases }, null, 2),
        filename: `eval-export-deepeval-${timestamp.split("T")[0]}.json`,
        stats: { sessions: sessions.length, testCases: testCaseCount },
      };
    }

    if (args.format === "openai") {
      // OpenAI Evals JSONL format
      const lines: string[] = [];

      for (const session of sessions) {
        const messages = messagesBySession[session._id] || [];
        const context: Array<{ role: string; content: string }> = [];

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          
          if (msg.role === "system" && !args.options.includeSystemPrompts) continue;
          
          context.push({ role: msg.role, content: anonymize(msg.textContent || "") });

          if (msg.role === "user" && i + 1 < messages.length) {
            const response = messages[i + 1];
            if (response.role === "assistant") {
              const evalCase: OpenAIEvalCase = {
                input: [...context],
                ideal: anonymize(response.textContent || ""),
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
        filename: `eval-export-openai-${timestamp.split("T")[0]}.jsonl`,
        stats: { sessions: sessions.length, testCases: testCaseCount },
      };
    }

    // Filesystem format (plain text)
    const files: Array<{ name: string; content: string }> = [];
    const fileList: string[] = [];

    for (const session of sessions) {
      const messages = messagesBySession[session._id] || [];
      const lines: string[] = [];

      // Header
      lines.push("=".repeat(80));
      lines.push(`SESSION: ${session.externalId}`);
      lines.push(`SOURCE: ${session.source || "opencode"}`);
      lines.push(`MODEL: ${session.model || "unknown"}`);
      lines.push(`DATE: ${new Date(session.createdAt).toISOString()}`);
      lines.push(`TOKENS: ${session.totalTokens}`);
      if (session.evalTags?.length) {
        lines.push(`TAGS: ${session.evalTags.join(", ")}`);
      }
      lines.push("=".repeat(80));
      lines.push("");

      // Messages
      for (const msg of messages) {
        if (msg.role === "system" && !args.options.includeSystemPrompts) continue;

        const timestamp = new Date(msg.createdAt).toISOString();
        const role = msg.role.toUpperCase();
        lines.push(`[${timestamp}] ${role}:`);
        lines.push(anonymize(msg.textContent || "(empty)"));
        lines.push("");
      }

      lines.push("=".repeat(80));
      lines.push("END SESSION");
      lines.push("=".repeat(80));

      const filename = `session-${session.externalId.slice(0, 8)}.txt`;
      files.push({ name: filename, content: lines.join("\n") });
      fileList.push(filename);
      testCaseCount += messages.filter((m: ExportMessage) => m.role === "user").length;
    }

    // Create manifest
    const manifest = {
      export_date: timestamp,
      total_sessions: sessions.length,
      sources: {
        opencode: sessions.filter((s: ExportSession) => s.source === "opencode" || !s.source).length,
        "claude-code": sessions.filter((s: ExportSession) => s.source === "claude-code").length,
      },
      models: [...new Set(sessions.map((s: ExportSession) => s.model).filter(Boolean))],
      files: fileList,
    };

    // Combine all files into a single export (JSON with file contents)
    const exportBundle = {
      manifest,
      files: files.reduce((acc, f) => ({ ...acc, [f.name]: f.content }), {} as Record<string, string>),
      readme: generateReadme(sessions.length, testCaseCount),
    };

    return {
      data: JSON.stringify(exportBundle, null, 2),
      filename: `eval-export-filesystem-${timestamp.split("T")[0]}.json`,
      stats: { sessions: sessions.length, testCases: testCaseCount },
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
    })
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
        .withIndex("by_user_eval_ready", (q) => q.eq("userId", user._id).eq("evalReady", true))
        .collect();
    } else {
      sessions = await Promise.all(
        args.sessionIds.map((id) => ctx.db.get(id))
      );
      // Filter to only user's sessions
      sessions = sessions.filter((s) => s && s.userId === user._id);
    }

    // Get messages for each session
    const messagesBySession: Record<string, any[]> = {};
    for (const session of sessions) {
      if (!session) continue;
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_session_created", (q) => q.eq("sessionId", session._id))
        .collect();
      messagesBySession[session._id] = messages;
    }

    return { sessions: sessions.filter(Boolean), messagesBySession };
  },
});

// Helper to generate README content
function generateReadme(sessionCount: number, testCaseCount: number): string {
  return `================================================================================
OPENSYNC - EVAL EXPORT
================================================================================

Export date: ${new Date().toISOString()}
Sessions: ${sessionCount}
Test cases: ${testCaseCount}

================================================================================
QUICK START
================================================================================

OPTION 1: DeepEval (Recommended)
--------------------------------
pip install deepeval
deepeval test run eval-export.json

Results at: https://app.confident-ai.com
Docs: https://docs.deepeval.com

OPTION 2: OpenAI Evals
--------------------------------
pip install openai-evals
export OPENAI_API_KEY=your-key
oaieval gpt-4o eval-export.jsonl

Docs: https://github.com/openai/evals

OPTION 3: Promptfoo
--------------------------------
npx promptfoo@latest init
npx promptfoo@latest eval

Docs: https://promptfoo.dev/docs

================================================================================
FORMAT INFO
================================================================================

Filesystem format exports each session as a plain text file.
Based on Letta research showing filesystem retrieval outperforms
specialized memory tools for AI agent benchmarks.

Use cases:
- Test RAG systems with file-based retrieval
- Evaluate agents using standard tools (grep, find)
- Human-readable format for manual review

================================================================================
`;
}
