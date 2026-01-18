import { v } from "convex/values";
import { query } from "./_generated/server";

// Daily usage breakdown for charts
export const dailyStats = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      date: v.string(),
      sessions: v.number(),
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
      cost: v.number(),
      durationMs: v.number(),
    })
  ),
  handler: async (ctx, { days = 30 }) => {
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

    // Group by date
    const byDate: Record<string, {
      sessions: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      cost: number;
      durationMs: number;
    }> = {};

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    for (const session of sessions) {
      if (session.createdAt < cutoff) continue;
      
      const date = new Date(session.createdAt).toISOString().split("T")[0];
      if (!byDate[date]) {
        byDate[date] = {
          sessions: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
          durationMs: 0,
        };
      }
      byDate[date].sessions += 1;
      byDate[date].promptTokens += session.promptTokens;
      byDate[date].completionTokens += session.completionTokens;
      byDate[date].totalTokens += session.totalTokens;
      byDate[date].cost += session.cost;
      byDate[date].durationMs += session.durationMs || 0;
    }

    // Sort by date
    return Object.entries(byDate)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Model usage breakdown
export const modelStats = query({
  args: {},
  returns: v.array(
    v.object({
      model: v.string(),
      sessions: v.number(),
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
      cost: v.number(),
      avgDurationMs: v.number(),
    })
  ),
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

    // Group by model
    const byModel: Record<string, {
      sessions: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      cost: number;
      totalDurationMs: number;
    }> = {};

    for (const session of sessions) {
      const model = session.model || "unknown";
      if (!byModel[model]) {
        byModel[model] = {
          sessions: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
          totalDurationMs: 0,
        };
      }
      byModel[model].sessions += 1;
      byModel[model].promptTokens += session.promptTokens;
      byModel[model].completionTokens += session.completionTokens;
      byModel[model].totalTokens += session.totalTokens;
      byModel[model].cost += session.cost;
      byModel[model].totalDurationMs += session.durationMs || 0;
    }

    return Object.entries(byModel)
      .map(([model, stats]) => ({
        model,
        sessions: stats.sessions,
        promptTokens: stats.promptTokens,
        completionTokens: stats.completionTokens,
        totalTokens: stats.totalTokens,
        cost: stats.cost,
        avgDurationMs: stats.sessions > 0 ? Math.round(stats.totalDurationMs / stats.sessions) : 0,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens);
  },
});

// Project usage breakdown with extended metrics
export const projectStats = query({
  args: {},
  returns: v.array(
    v.object({
      project: v.string(),
      sessions: v.number(),
      messageCount: v.number(),
      totalTokens: v.number(),
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalDurationMs: v.number(),
      cost: v.number(),
      lastActive: v.number(),
    })
  ),
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

    // Group by project with extended metrics
    const byProject: Record<string, {
      sessions: number;
      messageCount: number;
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      totalDurationMs: number;
      cost: number;
      lastActive: number;
    }> = {};

    for (const session of sessions) {
      const project = session.projectName || session.projectPath || "Other";
      if (!byProject[project]) {
        byProject[project] = {
          sessions: 0,
          messageCount: 0,
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalDurationMs: 0,
          cost: 0,
          lastActive: 0,
        };
      }
      byProject[project].sessions += 1;
      byProject[project].messageCount += session.messageCount || 0;
      byProject[project].totalTokens += session.totalTokens;
      byProject[project].promptTokens += session.promptTokens;
      byProject[project].completionTokens += session.completionTokens;
      byProject[project].totalDurationMs += session.durationMs || 0;
      byProject[project].cost += session.cost;
      byProject[project].lastActive = Math.max(byProject[project].lastActive, session.updatedAt);
    }

    return Object.entries(byProject)
      .map(([project, stats]) => ({ project, ...stats }))
      .sort((a, b) => b.lastActive - a.lastActive);
  },
});

// Provider usage breakdown
export const providerStats = query({
  args: {},
  returns: v.array(
    v.object({
      provider: v.string(),
      sessions: v.number(),
      totalTokens: v.number(),
      cost: v.number(),
    })
  ),
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

    // Group by provider
    const byProvider: Record<string, {
      sessions: number;
      totalTokens: number;
      cost: number;
    }> = {};

    for (const session of sessions) {
      const provider = session.provider || "unknown";
      if (!byProvider[provider]) {
        byProvider[provider] = {
          sessions: 0,
          totalTokens: 0,
          cost: 0,
        };
      }
      byProvider[provider].sessions += 1;
      byProvider[provider].totalTokens += session.totalTokens;
      byProvider[provider].cost += session.cost;
    }

    return Object.entries(byProvider)
      .map(([provider, stats]) => ({ provider, ...stats }))
      .sort((a, b) => b.totalTokens - a.totalTokens);
  },
});

// Extended session list with more data
export const sessionsWithDetails = query({
  args: {
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("updatedAt"),
      v.literal("createdAt"),
      v.literal("totalTokens"),
      v.literal("cost"),
      v.literal("durationMs")
    )),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    filterModel: v.optional(v.string()),
    filterProject: v.optional(v.string()),
    filterProvider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { sessions: [], total: 0 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return { sessions: [], total: 0 };

    let sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Apply filters
    if (args.filterModel) {
      sessions = sessions.filter((s) => s.model === args.filterModel);
    }
    if (args.filterProject) {
      sessions = sessions.filter(
        (s) => s.projectName === args.filterProject || s.projectPath === args.filterProject
      );
    }
    if (args.filterProvider) {
      sessions = sessions.filter((s) => s.provider === args.filterProvider);
    }

    const total = sessions.length;

    // Sort
    const sortBy = args.sortBy || "updatedAt";
    const sortOrder = args.sortOrder || "desc";
    sessions.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortOrder === "desc" ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });

    // Limit
    const limit = args.limit || 100;
    sessions = sessions.slice(0, limit);

    return {
      sessions: sessions.map((s) => ({
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
      total,
    };
  },
});

// Summary stats for dashboard header
export const summaryStats = query({
  args: {},
  returns: v.union(
    v.object({
      totalSessions: v.number(),
      totalMessages: v.number(),
      totalTokens: v.number(),
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalCost: v.number(),
      totalDurationMs: v.number(),
      uniqueModels: v.number(),
      uniqueProjects: v.number(),
      avgTokensPerSession: v.number(),
      avgCostPerSession: v.number(),
    }),
    v.null()
  ),
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

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalCost: 0,
        totalDurationMs: 0,
        uniqueModels: 0,
        uniqueProjects: 0,
        avgTokensPerSession: 0,
        avgCostPerSession: 0,
      };
    }

    const models = new Set<string>();
    const projects = new Set<string>();
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalCost = 0;
    let totalMessages = 0;
    let totalDurationMs = 0;

    for (const s of sessions) {
      if (s.model) models.add(s.model);
      if (s.projectName) projects.add(s.projectName);
      else if (s.projectPath) projects.add(s.projectPath);
      totalTokens += s.totalTokens;
      promptTokens += s.promptTokens;
      completionTokens += s.completionTokens;
      totalCost += s.cost;
      totalMessages += s.messageCount;
      totalDurationMs += s.durationMs || 0;
    }

    return {
      totalSessions: sessions.length,
      totalMessages,
      totalTokens,
      promptTokens,
      completionTokens,
      totalCost,
      totalDurationMs,
      uniqueModels: models.size,
      uniqueProjects: projects.size,
      avgTokensPerSession: Math.round(totalTokens / sessions.length),
      avgCostPerSession: totalCost / sessions.length,
    };
  },
});
