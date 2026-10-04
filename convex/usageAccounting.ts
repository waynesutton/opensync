import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// A user's directory identity is refreshed on login and consent changes.
export async function syncUsagePerson(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  const user = await ctx.db.get("users", userId);
  const person = await ctx.db.query("usagePeople").withIndex("by_user", q => q.eq("userId", userId)).unique();
  if (!user) {
    if (person) await ctx.db.delete("usagePeople", person._id);
    return;
  }
  const name = user.name?.trim() || undefined;
  const email = user.email?.trim() || undefined;
  const parts = name?.split(/\s+/) ?? [];
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  const publicFirstName = user.usageLeaderboardFirstName?.trim() || firstName;
  const identity = {
    name, email, firstName, lastName,
    nameSort: (name || "").toLocaleLowerCase("en-US"),
    emailSort: (email || "").toLocaleLowerCase("en-US"),
    searchText: `${name || ""} ${email || ""}`.trim(),
    publicOptIn: user.usageLeaderboardOptIn === true && Boolean(publicFirstName) && (!user.deletionStatus || user.deletionStatus === "failed"),
    publicFirstName,
    joinedAt: user.createdAt,
  };
  if (person) {
    const unchanged = Object.entries(identity).every(([key, value]) => person[key as keyof typeof identity] === value);
    if (!unchanged) await ctx.db.patch("usagePeople", person._id, { ...identity, updatedAt: Date.now() });
  } else {
    await ctx.db.insert("usagePeople", {
      userId, ...identity, totalTokens: 0, sessionCount: 0, topModel: "unknown", lastActiveAt: 0, updatedAt: Date.now(),
    });
  }
}

type Contribution = Pick<Doc<"usageSessionLedger">, "sessionId" | "userId" | "model" | "period" | "tokens" | "lastActiveAt">;
function finiteNonnegative(value: number): number { return Number.isFinite(value) ? Math.max(0, value) : 0; }
function contributionOf(session: Doc<"sessions">): Contribution {
  const date = new Date(session.createdAt);
  return {
    sessionId: session._id, userId: session.userId,
    model: session.model?.trim().slice(0, 160) || "unknown",
    period: Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 7) : "unknown",
    tokens: finiteNonnegative(session.totalTokens), lastActiveAt: finiteNonnegative(session.updatedAt),
  };
}

async function applyModelDelta(ctx: MutationCtx, userId: Id<"users">, period: string, model: string, tokens: number, sessions: number): Promise<void> {
  if (tokens === 0 && sessions === 0) return;
  const row = await ctx.db.query("usageModelTotals").withIndex("by_user_period_model", q => q.eq("userId", userId).eq("period", period).eq("model", model)).unique();
  const nextTokens = Math.max(0, (row?.tokens ?? 0) + tokens);
  const nextSessions = Math.max(0, (row?.sessions ?? 0) + sessions);
  if (nextSessions === 0 && nextTokens === 0) {
    if (row) await ctx.db.delete("usageModelTotals", row._id);
  } else if (row) {
    await ctx.db.patch("usageModelTotals", row._id, { tokens: nextTokens, sessions: nextSessions, updatedAt: Date.now() });
  } else {
    await ctx.db.insert("usageModelTotals", { userId, period, model, tokens: nextTokens, sessions: nextSessions, updatedAt: Date.now() });
  }
}

// Each input document must have been read in this same transaction. A null
// document means the session has just been deleted in this transaction.
export type UsageSessionInput = {
  sessionId: Id<"sessions">;
  sessionDoc: Doc<"sessions"> | null;
};

// Read each ledger once, consolidate shared counters, and write each user/model
// aggregate once per page. The ledger remains the idempotency boundary.
export async function reconcileUsageSessions(ctx: MutationCtx, inputs: UsageSessionInput[]): Promise<void> {
  const uniqueInputs = new Map(inputs.map(input => [input.sessionId, input]));
  if (uniqueInputs.size > 200) throw new Error("Usage reconciliation accepts at most 200 sessions per transaction");
  const changes = await Promise.all([...uniqueInputs.values()].map(async ({ sessionId, sessionDoc }) => {
    if (sessionDoc && sessionDoc._id !== sessionId) throw new Error("Session snapshot does not match its ID");
    const before = await ctx.db.query("usageSessionLedger").withIndex("by_session", q => q.eq("sessionId", sessionId)).unique();
    const after = sessionDoc ? contributionOf(sessionDoc) : null;
    if (!before && !after) return null;
    if (before && after && before.userId !== after.userId) throw new Error("Session ownership cannot change");
    if (before && after && before.model === after.model && before.period === after.period && before.tokens === after.tokens && before.lastActiveAt === after.lastActiveAt) return null;
    return { before, after, userId: (after ?? before)!.userId };
  }));
  const changed = changes.filter((change): change is NonNullable<typeof change> => change !== null);
  if (changed.length === 0) return;

  const userIds = [...new Set(changed.map(change => change.userId))];
  const peopleEntries = await Promise.all(userIds.map(async userId => {
    await syncUsagePerson(ctx, userId);
    const person = await ctx.db.query("usagePeople").withIndex("by_user", q => q.eq("userId", userId)).unique();
    return [userId, person] as const;
  }));
  const people = new Map(peopleEntries);
  const userDeltas = new Map<Id<"users">, { tokens: number; sessions: number }>();
  const modelDeltas = new Map<string, { userId: Id<"users">; period: string; model: string; tokens: number; sessions: number }>();
  // Never recreate deleted accounts from orphan sessions during a backfill.
  const applicable = changed.filter(change => people.get(change.userId));
  for (const { before, after, userId } of applicable) {
    const userDelta = userDeltas.get(userId) ?? { tokens: 0, sessions: 0 };
    userDelta.tokens += (after?.tokens ?? 0) - (before?.tokens ?? 0);
    userDelta.sessions += (after ? 1 : 0) - (before ? 1 : 0);
    userDeltas.set(userId, userDelta);
    for (const [entry, sign] of [[before, -1], [after, 1]] as const) {
      if (!entry) continue;
      for (const period of ["all", entry.period]) {
        const key = JSON.stringify([userId, period, entry.model]);
        const delta = modelDeltas.get(key) ?? { userId, period, model: entry.model, tokens: 0, sessions: 0 };
        delta.tokens += sign * entry.tokens;
        delta.sessions += sign;
        modelDeltas.set(key, delta);
      }
    }
  }
  // Each operation below targets a distinct model bucket or session ledger.
  await Promise.all([...modelDeltas.values()].map(delta =>
    applyModelDelta(ctx, delta.userId, delta.period, delta.model, delta.tokens, delta.sessions),
  ));
  await Promise.all(applicable.map(async ({ before, after }) => {
    if (after) {
      if (before) await ctx.db.replace("usageSessionLedger", before._id, after);
      else await ctx.db.insert("usageSessionLedger", after);
    } else if (before) await ctx.db.delete("usageSessionLedger", before._id);
  }));
  await Promise.all([...userDeltas.entries()].map(async ([userId, delta]) => {
    const person = people.get(userId)!;
    const [top, latest] = await Promise.all([
      ctx.db.query("usageModelTotals").withIndex("by_user_period_tokens", q => q.eq("userId", userId).eq("period", "all")).order("desc").first(),
      ctx.db.query("usageSessionLedger").withIndex("by_user_active", q => q.eq("userId", userId)).order("desc").first(),
    ]);
    await ctx.db.patch("usagePeople", person._id, {
      totalTokens: Math.max(0, person.totalTokens + delta.tokens),
      sessionCount: Math.max(0, person.sessionCount + delta.sessions),
      topModel: top?.model ?? "unknown", lastActiveAt: latest?.lastActiveAt ?? 0, updatedAt: Date.now(),
    });
  }));
}

// Existing ingestion and deletion hooks keep the same transactional API.
export async function reconcileUsageSession(ctx: MutationCtx, sessionId: Id<"sessions">): Promise<void> {
  const sessionDoc = await ctx.db.get("sessions", sessionId);
  await reconcileUsageSessions(ctx, [{ sessionId, sessionDoc }]);
}

// Stable creation-order pagination plus per-session reconciliation supports live sync.
// A run token rejects stale scheduled continuations when a new rebuild is started.
export const startBackfill = internalMutation({
  args: {}, returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("usageDirectoryState").withIndex("by_key", q => q.eq("key", "backfill")).unique();
    if (existing && existing.phase !== "complete") {
      await ctx.scheduler.runAfter(0, internal.usageAccounting.continueBackfill, { runId: existing.runId, expectedCursor: existing.cursor, expectedPhase: existing.phase });
      return null;
    }
    const state = { key: "backfill" as const, phase: "users" as const, cursor: null, runId: crypto.randomUUID(), processedUsers: 0, processedSessions: 0, updatedAt: Date.now() };
    if (existing) await ctx.db.replace("usageDirectoryState", existing._id, state);
    else await ctx.db.insert("usageDirectoryState", state);
    await ctx.scheduler.runAfter(0, internal.usageAccounting.continueBackfill, { runId: state.runId, expectedCursor: null, expectedPhase: "users" });
    return null;
  },
});

export const continueBackfill = internalMutation({
  args: { runId: v.string(), expectedCursor: v.union(v.string(), v.null()), expectedPhase: v.union(v.literal("users"), v.literal("sessions")) }, returns: v.null(),
  handler: async (ctx, args) => {
    const state = await ctx.db.query("usageDirectoryState").withIndex("by_key", q => q.eq("key", "backfill")).unique();
    if (!state || state.runId !== args.runId || state.phase !== args.expectedPhase || state.cursor !== args.expectedCursor) return null;
    let phase: "users" | "sessions" | "complete" = state.phase;
    let cursor: string | null = null;
    let processedUsers = state.processedUsers;
    let processedSessions = state.processedSessions;
    if (phase === "users") {
      const page = await ctx.db.query("users").paginate({ numItems: 100, maximumBytesRead: 2 * 1024 * 1024, cursor: state.cursor });
      for (const user of page.page) await syncUsagePerson(ctx, user._id);
      processedUsers += page.page.length;
      phase = page.isDone ? "sessions" : "users";
      cursor = page.isDone ? null : page.continueCursor;
    } else {
      const page = await ctx.db.query("sessions").paginate({ numItems: 200, maximumBytesRead: 2 * 1024 * 1024, cursor: state.cursor });
      await reconcileUsageSessions(ctx, page.page.map(sessionDoc => ({ sessionId: sessionDoc._id, sessionDoc })));
      processedSessions += page.page.length;
      phase = page.isDone ? "complete" : "sessions";
      cursor = page.isDone ? null : page.continueCursor;
    }
    await ctx.db.patch("usageDirectoryState", state._id, { phase, cursor, processedUsers, processedSessions, updatedAt: Date.now() });
    if (phase !== "complete") await ctx.scheduler.runAfter(0, internal.usageAccounting.continueBackfill, { runId: state.runId, expectedCursor: cursor, expectedPhase: phase });
    return null;
  },
});

// Account deletion may remove the owner before an interrupted purge completes.
export const cleanupDeletedUser = internalMutation({
  args: { userId: v.id("users") }, returns: v.null(),
  handler: async (ctx, { userId }) => {
    if (await ctx.db.get("users", userId)) return null;
    await syncUsagePerson(ctx, userId);
    const ledgers = await ctx.db.query("usageSessionLedger").withIndex("by_user", q => q.eq("userId", userId)).take(100);
    const models = await ctx.db.query("usageModelTotals").withIndex("by_user_period", q => q.eq("userId", userId)).take(100);
    for (const row of ledgers) await ctx.db.delete("usageSessionLedger", row._id);
    for (const row of models) await ctx.db.delete("usageModelTotals", row._id);
    if (ledgers.length === 100 || models.length === 100) await ctx.scheduler.runAfter(0, internal.usageAccounting.cleanupDeletedUser, { userId });
    return null;
  },
});
