import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUser, requirePlatformAdmin } from "./authHelper";
import { syncUsagePerson } from "./usageAccounting";

const sortValidator = v.union(v.literal("tokens"), v.literal("sessions"), v.literal("name"), v.literal("model"), v.literal("activity"), v.literal("joined"));
const personValidator = v.object({
  _id: v.id("users"), name: v.string(), email: v.string(), totalTokens: v.number(),
  sessionCount: v.number(), topModel: v.string(), lastActiveAt: v.number(),
  joinedAt: v.number(), publicOptIn: v.boolean(), updatedAt: v.number(),
});
const modelValidator = v.object({ model: v.string(), tokens: v.number(), sessions: v.number() });
const hidden = (status: string | undefined) => status === "pending" || status === "in_progress" || status === "completed";

// Admin-only, indexed global ordering. Text search uses Convex relevance ordering.
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator, search: v.string(), sort: sortValidator,
    direction: v.union(v.literal("asc"), v.literal("desc")),
    publicOnly: v.optional(v.boolean()), model: v.optional(v.string()),
  },
  returns: paginationResultValidator(personValidator),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const search = args.search.trim();
    const model = args.model?.trim() || undefined;
    if (search.length > 120 || search.split(/[^\p{L}\p{N}]+/u).filter(Boolean).length > 16) throw new ConvexError("Use a shorter name or email search.");
    if (model && model.length > 160) throw new ConvexError("Model filter is too long.");
    if (!Number.isInteger(args.paginationOpts.numItems) || args.paginationOpts.numItems < 1 || args.paginationOpts.numItems > 100) throw new ConvexError("Choose between 1 and 100 users per page.");
    const hasPrivacy = args.publicOnly !== undefined;
    const people = ctx.db.query("usagePeople");
    const ordered = search
      ? people.withSearchIndex("search_people", q => {
          const s = q.search("searchText", search);
          if (hasPrivacy && model) return s.eq("publicOptIn", args.publicOnly!).eq("topModel", model);
          if (hasPrivacy) return s.eq("publicOptIn", args.publicOnly!);
          if (model) return s.eq("topModel", model);
          return s;
        })
      : hasPrivacy && model
        ? (args.sort === "sessions"
            ? people.withIndex("by_public_model_sessions", q => q.eq("publicOptIn", args.publicOnly!).eq("topModel", model))
            : args.sort === "name"
              ? people.withIndex("by_public_model_name", q => q.eq("publicOptIn", args.publicOnly!).eq("topModel", model))
              : args.sort === "activity"
                ? people.withIndex("by_public_model_active", q => q.eq("publicOptIn", args.publicOnly!).eq("topModel", model))
                : args.sort === "joined"
                  ? people.withIndex("by_public_model_joined", q => q.eq("publicOptIn", args.publicOnly!).eq("topModel", model))
                  : people.withIndex("by_public_model_tokens", q => q.eq("publicOptIn", args.publicOnly!).eq("topModel", model))).order(args.direction)
        : hasPrivacy
          ? (args.sort === "sessions"
              ? people.withIndex("by_public_sessions", q => q.eq("publicOptIn", args.publicOnly!))
              : args.sort === "name"
                ? people.withIndex("by_public_name", q => q.eq("publicOptIn", args.publicOnly!))
                : args.sort === "model"
                  ? people.withIndex("by_public_model", q => q.eq("publicOptIn", args.publicOnly!))
                  : args.sort === "activity"
                    ? people.withIndex("by_public_active", q => q.eq("publicOptIn", args.publicOnly!))
                    : args.sort === "joined"
                      ? people.withIndex("by_public_joined", q => q.eq("publicOptIn", args.publicOnly!))
                      : people.withIndex("by_public_tokens", q => q.eq("publicOptIn", args.publicOnly!))).order(args.direction)
          : model
            ? (args.sort === "sessions"
                ? people.withIndex("by_model_sessions", q => q.eq("topModel", model))
                : args.sort === "name"
                  ? people.withIndex("by_model_name", q => q.eq("topModel", model))
                  : args.sort === "activity"
                    ? people.withIndex("by_model_active", q => q.eq("topModel", model))
                    : args.sort === "joined"
                      ? people.withIndex("by_model_joined", q => q.eq("topModel", model))
                      : people.withIndex("by_model_tokens", q => q.eq("topModel", model))).order(args.direction)
            : people.withIndex(args.sort === "sessions" ? "by_sessions" : args.sort === "name" ? "by_name" : args.sort === "model" ? "by_model" : args.sort === "activity" ? "by_active" : args.sort === "joined" ? "by_joined" : "by_tokens").order(args.direction);
    const result = await ordered.paginate(args.paginationOpts);
    const page = [];
    for (const person of result.page) {
      const user = await ctx.db.get("users", person.userId);
      if (!user || hidden(user.deletionStatus)) continue;
      page.push({
        _id: user._id, name: user.name || "Unnamed account", email: user.email || "",
        totalTokens: person.totalTokens, sessionCount: person.sessionCount, topModel: person.topModel,
        lastActiveAt: person.lastActiveAt, joinedAt: user.createdAt,
        publicOptIn: user.usageLeaderboardOptIn === true, updatedAt: person.updatedAt,
      });
    }
    return { ...result, page };
  },
});

export const status = query({
  args: {},
  returns: v.object({ phase: v.union(v.literal("pending"),v.literal("users"),v.literal("sessions"),v.literal("complete")), processedUsers: v.number(), processedSessions: v.number(), updatedAt: v.number() }),
  handler: async ctx => {
    await requirePlatformAdmin(ctx);
    const state = await ctx.db.query("usageDirectoryState").withIndex("by_key", q => q.eq("key", "backfill")).unique();
    return { phase: state?.phase ?? ("pending" as const), processedUsers: state?.processedUsers ?? 0, processedSessions: state?.processedSessions ?? 0, updatedAt: state?.updatedAt ?? 0 };
  },
});

// Session-created month attribution; counts reflect currently retained sessions.
export const details = query({
  args: { userId: v.id("users"), month: v.string() },
  returns: v.object({ models: v.array(modelValidator), months: v.array(v.object({month: v.string(), models: v.array(modelValidator)})) }),
  handler: async (ctx, { userId, month: selectedMonth }) => {
    await requirePlatformAdmin(ctx);
    const user = await ctx.db.get("users", userId);
    if (!user || hidden(user.deletionStatus)) throw new ConvexError("This account is no longer available.");
    const read = async (period: string) => {
      const rows = await ctx.db.query("usageModelTotals").withIndex("by_user_period_tokens", q => q.eq("userId", userId).eq("period", period)).order("desc").take(10);
      return rows.filter(row => row.sessions > 0).map(({model, tokens, sessions}) => ({model, tokens, sessions}));
    };
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) throw new ConvexError("Choose a valid UTC month.");
    const now = new Date(`${selectedMonth}-01T00:00:00Z`);
    const months = await Promise.all(Array.from({length: 6}, async (_, index) => {
      const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1)).toISOString().slice(0, 7);
      return { month, models: await read(month) };
    }));
    return { models: await read("all"), months };
  },
});

export const myPreference = query({
  args: {},
  returns: v.object({ optedIn: v.boolean(), firstName: v.string(), totalTokens: v.number(), topModel: v.string() }),
  handler: async ctx => {
    const { user } = await requireAuthUser(ctx);
    const person = await ctx.db.query("usagePeople").withIndex("by_user", q => q.eq("userId", user._id)).unique();
    return {
      optedIn: user.usageLeaderboardOptIn === true && !hidden(user.deletionStatus),
      firstName: user.usageLeaderboardFirstName ?? user.name?.trim().split(/\s+/)[0] ?? "",
      totalTokens: person?.totalTokens ?? 0, topModel: person?.topModel ?? "Unknown",
    };
  },
});

export const setPreference = mutation({
  args: { optedIn: v.boolean(), firstName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireAuthUser(ctx);
    if (hidden(user.deletionStatus)) throw new ConvexError("Account deletion is in progress.");
    const firstName = args.firstName.trim().replace(/\s+/g, " ");
    if (args.optedIn && (!firstName || firstName.length > 40 || !/^[\p{L}\p{M} '\u2019-]+$/u.test(firstName))) {
      throw new ConvexError("Enter a first name using letters, spaces, apostrophes or hyphens (up to 40 characters).");
    }
    // Opting out must never be blocked by an invalid/empty display name.
    const savedName = args.optedIn ? firstName : user.usageLeaderboardFirstName;
    if (user.usageLeaderboardOptIn === args.optedIn && user.usageLeaderboardFirstName === savedName) return null;
    await ctx.db.patch("users", user._id, {
      usageLeaderboardOptIn: args.optedIn, usageLeaderboardFirstName: savedName, updatedAt: Date.now(),
    });
    await syncUsagePerson(ctx, user._id);
    return null;
  },
});

// Explicit public projection; recheck live consent to prevent stale cache exposure.
export const publicBoard = query({
  args: {},
  returns: v.array(v.object({ rank: v.number(), firstName: v.string(), totalTokens: v.number(), topModel: v.string() })),
  handler: async ctx => {
    const rows = await ctx.db.query("usagePeople").withIndex("by_public_tokens", q => q.eq("publicOptIn", true).gt("totalTokens", 0)).order("desc").take(100);
    const board = [];
    for (const row of rows) {
      const user = await ctx.db.get("users", row.userId);
      if (!user || !user.usageLeaderboardOptIn || !user.usageLeaderboardFirstName || hidden(user.deletionStatus)) continue;
      board.push({ rank: board.length + 1, firstName: user.usageLeaderboardFirstName, totalTokens: row.totalTokens, topModel: row.topModel });
    }
    return board;
  },
});

// Public pagination uses only consented names in its ordering keys. Native
// pagination metadata remains intact even when a revoked row is skipped.
export const publicPage = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sort: v.union(v.literal("tokens"), v.literal("name")),
    direction: v.union(v.literal("asc"), v.literal("desc")),
    model: v.optional(v.string()),
  },
  returns: paginationResultValidator(v.object({
    firstName: v.string(), totalTokens: v.number(), topModel: v.string(),
  })),
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.paginationOpts.numItems) || args.paginationOpts.numItems < 1 || args.paginationOpts.numItems > 100) {
      throw new ConvexError("Choose between 1 and 100 users per page.");
    }
    const model = args.model?.trim() || undefined;
    if (model && model.length > 160) throw new ConvexError("Model filter is too long.");
    const people = ctx.db.query("usagePeople");
    const ordered = args.sort === "name"
      ? model
        ? people.withIndex("by_public_model_first_name", q => q.eq("publicOptIn", true).eq("topModel", model))
        : people.withIndex("by_public_first_name", q => q.eq("publicOptIn", true))
      : model
        ? people.withIndex("by_public_model_tokens", q => q.eq("publicOptIn", true).eq("topModel", model).gt("totalTokens", 0))
        : people.withIndex("by_public_tokens", q => q.eq("publicOptIn", true).gt("totalTokens", 0));
    const result = await ordered.order(args.direction).paginate(args.paginationOpts);
    const page = [];
    for (const row of result.page) {
      if (row.totalTokens <= 0) continue;
      const user = await ctx.db.get("users", row.userId);
      if (!user || !user.usageLeaderboardOptIn || !user.usageLeaderboardFirstName || hidden(user.deletionStatus)) continue;
      // Never return a name whose consented ordering projection is stale.
      if (user.usageLeaderboardFirstName !== row.publicFirstName) continue;
      page.push({ firstName: user.usageLeaderboardFirstName, totalTokens: row.totalTokens, topModel: row.topModel });
    }
    return { ...result, page };
  },
});

// Public readiness exposes no account counts, identifiers or indexing cursor.
export const publicStatus = query({
  args: {},
  returns: v.object({ ready: v.boolean() }),
  handler: async ctx => {
    const state = await ctx.db.query("usageDirectoryState").withIndex("by_key", q => q.eq("key", "backfill")).unique();
    return { ready: state?.phase === "complete" };
  },
});
