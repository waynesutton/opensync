/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import type { FunctionReturnType } from "convex/server";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { Doc, Id } from "./_generated/dataModel";
import { reconcileUsageSession, reconcileUsageSessions, syncUsagePerson } from "./usageAccounting";

const modules = import.meta.glob("./**/*.ts");
const listArgs = { paginationOpts: { numItems: 20, cursor: null }, search: "", sort: "tokens", direction: "desc" } as const;
const owners = ["wayne@socialwayne.com", "wayne@convex.dev"];
const october = Date.UTC(2026, 9, 3);

const createTest = () => convexTest(schema, modules);
type TestBackend = ReturnType<typeof createTest>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(october);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network or email in usage tests"); }));
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function person(t: TestBackend, name: string, email: string, overrides: Partial<Doc<"users">> = {}) {
  const subject = `workos-${crypto.randomUUID()}`;
  const userId = await t.run(async ctx => {
    const id = await ctx.db.insert("users", { workosId: subject, name, email, createdAt: 1, updatedAt: 1, ...overrides });
    await syncUsagePerson(ctx, id);
    return id;
  });
  const identity = t.withIdentity({ subject, email, emailVerified: true });
  return { userId, subject, identity };
}
async function setup(email = owners[0]) {
  const t = convexTest(schema, modules);
  const owner = await person(t, "Wayne Sutton", email);
  return { t, owner: owner.identity, ownerId: owner.userId, subject: owner.subject };
}
async function session(t: TestBackend, userId: Id<"users">, tokens: number, model = "model-a", overrides: Partial<Doc<"sessions">> = {}) {
  return t.run(async ctx => {
    const id = await ctx.db.insert("sessions", {
      userId, externalId: crypto.randomUUID(), promptTokens: tokens, completionTokens: 0,
      totalTokens: tokens, cost: 0, isPublic: false, messageCount: 0,
      createdAt: october, updatedAt: october, model, ...overrides,
    });
    await reconcileUsageSession(ctx, id);
    return id;
  });
}
async function stats(t: TestBackend, userId: Id<"users">) {
  return t.run(ctx => ctx.db.query("usagePeople").withIndex("by_user", q => q.eq("userId", userId)).unique());
}

// These calls exercise real handler authorization rather than client-side route guards.
describe("usage directory authorization", () => {
  it.each(owners)("allows verified owner %s", async email => {
    const { owner } = await setup(email);
    expect((await owner.query(api.usageDirectory.list, listArgs)).page).toHaveLength(1);
    expect(await owner.query(api.usageDirectory.status, {})).toMatchObject({ phase: "pending" });
  });
  it("rejects anonymous, ordinary and unverified accounts across private endpoints", async () => {
    const { t, ownerId, subject } = await setup();
    const ordinary = await person(t, "Ordinary User", "ordinary@example.com");
    const unverified = t.withIdentity({ subject, email: owners[0], emailVerified: false });
    const missingClaim = t.withIdentity({ subject, email: owners[0] });
    for (const actor of [t, ordinary.identity, unverified, missingClaim]) {
      await expect(actor.query(api.usageDirectory.list, listArgs)).rejects.toThrow();
      await expect(actor.query(api.usageDirectory.status, {})).rejects.toThrow();
      await expect(actor.query(api.usageDirectory.details, { userId: ownerId, month: "2026-10" })).rejects.toThrow();
    }
    await expect(t.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName: "Wayne" })).rejects.toThrow("Not authenticated");
  });
  it("binds consent to the signed-in account and rejects a spoofed userId argument", async () => {
    const { t, ownerId } = await setup();
    const other = await person(t, "Alice Example", "alice@example.com");
    await expect(other.identity.mutation(api.usageDirectory.setPreference, {
      optedIn: true, firstName: "Alice",
      // @ts-expect-error A malicious client must not be able to select another account.
      userId: ownerId,
    })).rejects.toThrow();
    await other.identity.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName: "Alice" });
    expect(await t.run(ctx => ctx.db.get("users", ownerId))).not.toHaveProperty("usageLeaderboardOptIn");
    expect(await other.identity.query(api.usageDirectory.myPreference, {})).toMatchObject({ optedIn: true, firstName: "Alice" });
  });
});

describe("search, filters and indexed ordering", () => {
  it("finds first name, last name, full name and email", async () => {
    const { t, owner } = await setup();
    const alice = await person(t, "Alice Marquez", "alice.marquez@example.com");
    await person(t, "Bob Nguyen", "bob@example.com");
    for (const search of ["Alice", "Marquez", "Alice Marquez", "alice.marquez@example.com"]) {
      const result = await owner.query(api.usageDirectory.list, { ...listArgs, search });
      expect(result.page.map(row => row._id)).toContain(alice.userId);
      expect(result.page.map(row => row.email)).not.toContain("bob@example.com");
    }
  });
  it("sorts across page boundaries, then combines model and consent filters", async () => {
    const { t, owner } = await setup();
    const alice = await person(t, "Alice Marquez", "alice@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Alice" });
    const bob = await person(t, "Bob Nguyen", "bob@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Bob" });
    const cara = await person(t, "Cara Jones", "cara@example.com");
    await session(t, alice.userId, 100, "model-z");
    await session(t, bob.userId, 500, "model-a");
    await session(t, cara.userId, 200, "model-z");
    const first = await owner.query(api.usageDirectory.list, { ...listArgs, paginationOpts: { numItems: 2, cursor: null } });
    expect(first.page.map(row => row._id)).toEqual([bob.userId, cara.userId]);
    expect(first.isDone).toBe(false);
    const second = await owner.query(api.usageDirectory.list, { ...listArgs, paginationOpts: { numItems: 2, cursor: first.continueCursor } });
    expect(second.page[0]._id).toBe(alice.userId);
    const filtered = await owner.query(api.usageDirectory.list, { ...listArgs, model: "model-z", publicOnly: true });
    expect(filtered.page.map(row => row._id)).toEqual([alice.userId]);
    const privateOnly = await owner.query(api.usageDirectory.list, { ...listArgs, publicOnly: false, model: "model-z" });
    expect(privateOnly.page.map(row => row._id)).toEqual([cara.userId]);
    const searched = await owner.query(api.usageDirectory.list, { ...listArgs, search: "Alice", model: "model-z", publicOnly: true });
    expect(searched.page.map(row => row._id)).toEqual([alice.userId]);
  });
  it("orders names, session counts and models in either direction", async () => {
    const { t, owner } = await setup();
    const alice = await person(t, "Alice Marquez", "alice@example.com");
    const bob = await person(t, "Bob Nguyen", "bob@example.com");
    await session(t, alice.userId, 100, "model-z");
    await session(t, bob.userId, 50, "model-a");
    await session(t, bob.userId, 50, "model-a");
    const byName = await owner.query(api.usageDirectory.list, { ...listArgs, sort: "name", direction: "asc" });
    expect(byName.page.slice(0, 2).map(row => row._id)).toEqual([alice.userId, bob.userId]);
    const bySessions = await owner.query(api.usageDirectory.list, { ...listArgs, sort: "sessions" });
    expect(bySessions.page[0]._id).toBe(bob.userId);
    const byModel = await owner.query(api.usageDirectory.list, { ...listArgs, sort: "model", direction: "asc" });
    expect(byModel.page[0]._id).toBe(bob.userId);
    const ascending = await owner.query(api.usageDirectory.list, { ...listArgs, direction: "asc" });
    expect(ascending.page[0].totalTokens).toBe(0);
  });
  it("bounds requested page size and search length", async () => {
    const { owner } = await setup();
    for (const numItems of [0, 101]) await expect(owner.query(api.usageDirectory.list, { ...listArgs, paginationOpts: { numItems, cursor: null } })).rejects.toThrow();
    await expect(owner.query(api.usageDirectory.list, { ...listArgs, search: "a".repeat(121) })).rejects.toThrow();
  });
});

describe("public leaderboard privacy", () => {
  it("is private by default even when sessions are public", async () => {
    const { t, owner, ownerId } = await setup();
    await session(t, ownerId, 800, "model-a", { isPublic: true });
    expect(await owner.query(api.usageDirectory.myPreference, {})).toMatchObject({ optedIn: false });
    expect(await t.query(api.usageDirectory.publicBoard, {})).toEqual([]);
  });
  it("publishes only explicit first name, rank, tokens and top model in token order", async () => {
    const { t, owner, ownerId } = await setup();
    const alice = await person(t, "Alice PrivateSurname", "private-alice@example.com");
    await session(t, ownerId, 100, "model-a");
    await session(t, alice.userId, 300, "model-b");
    await owner.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName: "Wayne" });
    await alice.identity.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName: "Alice" });
    const board = await t.query(api.usageDirectory.publicBoard, {});
    expect(board).toEqual([
      { rank: 1, firstName: "Alice", totalTokens: 300, topModel: "model-b" },
      { rank: 2, firstName: "Wayne", totalTokens: 100, topModel: "model-a" },
    ]);
    const serialized = JSON.stringify(board);
    for (const secret of ["private-alice", "PrivateSurname", alice.userId, ownerId, "Sutton", "@", "sessionCount"]) expect(serialized).not.toContain(secret);
  });
  it("removes opted-out users immediately even if a cached public flag remains true", async () => {
    const { t, owner, ownerId } = await setup();
    await session(t, ownerId, 500);
    await owner.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName: "Wayne" });
    await owner.mutation(api.usageDirectory.setPreference, { optedIn: false, firstName: "" });
    await t.run(async ctx => {
      const row = await ctx.db.query("usagePeople").withIndex("by_user", q => q.eq("userId", ownerId)).unique();
      await ctx.db.patch("usagePeople", row!._id, { publicOptIn: true });
    });
    expect(await t.query(api.usageDirectory.publicBoard, {})).toEqual([]);
  });
  it.each(["pending", "in_progress", "completed"] as const)("excludes deleting users (%s) from admin and public results", async deletionStatus => {
    const { t, owner } = await setup();
    const alice = await person(t, "Alice Secret", "alice@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Alice" });
    await session(t, alice.userId, 900);
    await t.run(ctx => ctx.db.patch("users", alice.userId, { deletionStatus }));
    expect(await t.query(api.usageDirectory.publicBoard, {})).toEqual([]);
    expect((await owner.query(api.usageDirectory.list, listArgs)).page.map(row => row._id)).not.toContain(alice.userId);
    await expect(owner.query(api.usageDirectory.details, { userId: alice.userId, month: "2026-10" })).rejects.toThrow();
    await expect(alice.identity.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName: "Alice" })).rejects.toThrow();
  });
  it("excludes missing accounts and opted-in accounts without retained tokens", async () => {
    const { t, owner } = await setup();
    const alice = await person(t, "Alice Secret", "alice@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Alice" });
    await session(t, alice.userId, 500);
    await t.run(ctx => ctx.db.delete("users", alice.userId));
    await owner.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName: "Wayne" });
    expect(await t.query(api.usageDirectory.publicBoard, {})).toEqual([]);
    expect((await owner.query(api.usageDirectory.list, listArgs)).page).toHaveLength(1);
  });
  it.each(["", "  ", "a".repeat(41), "email@example.com", "<script>", "Name123"])("rejects invalid public names %j", async firstName => {
    const { owner } = await setup();
    await expect(owner.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName })).rejects.toThrow("Enter a first name");
    await expect(owner.mutation(api.usageDirectory.setPreference, { optedIn: false, firstName })).resolves.toBeNull();
  });
  it("accepts international first names and idempotent preferences", async () => {
    const { owner } = await setup();
    for (const firstName of ["José", "O’Neil", "Anne-Marie", "李"]) {
      await owner.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName });
      await owner.mutation(api.usageDirectory.setPreference, { optedIn: true, firstName });
      expect(await owner.query(api.usageDirectory.myPreference, {})).toMatchObject({ firstName, optedIn: true });
    }
  });
});

describe("transactional retained-session accounting", () => {
  it("does not duplicate usage when reconciled repeatedly or backfilled again", async () => {
    const { t, ownerId } = await setup();
    const id = await session(t, ownerId, 100);
    for (let retry = 0; retry < 3; retry++) await t.run(ctx => reconcileUsageSession(ctx, id));
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 100, sessionCount: 1 });
    expect(await t.run(ctx => ctx.db.query("usageSessionLedger").collect())).toHaveLength(1);
    for (let run = 0; run < 2; run++) {
      await t.mutation(internal.usageAccounting.startBackfill, {});
      await t.finishAllScheduledFunctions(vi.runAllTimers);
    }
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 100, sessionCount: 1 });
    expect(await t.run(ctx => ctx.db.query("usageModelTotals").collect())).toHaveLength(2);
  });
  it("moves corrected totals to the new model and created month without duplicates", async () => {
    const { t, owner, ownerId } = await setup();
    const id = await session(t, ownerId, 100, "model-old");
    await t.run(async ctx => {
      await ctx.db.patch("sessions", id, { totalTokens: 70, model: "model-new", createdAt: Date.UTC(2026, 8, 2), updatedAt: october + 1 });
      await reconcileUsageSession(ctx, id);
    });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 70, sessionCount: 1, topModel: "model-new", lastActiveAt: october + 1 });
    const detail = await owner.query(api.usageDirectory.details, { userId: ownerId, month: "2026-10" });
    expect(detail.models).toEqual([{ model: "model-new", tokens: 70, sessions: 1 }]);
    expect(detail.months.find(row => row.month === "2026-09")?.models).toEqual(detail.models);
    expect(detail.months.find(row => row.month === "2026-10")?.models).toEqual([]);
  });
  it("removes a deleted contribution, chooses the next top model and handles no sessions", async () => {
    const { t, owner, ownerId } = await setup();
    const top = await session(t, ownerId, 600, "model-a", { updatedAt: october + 2 });
    const next = await session(t, ownerId, 100, "model-b", { updatedAt: october + 1 });
    await t.run(async ctx => { await ctx.db.delete("sessions", top); await reconcileUsageSession(ctx, top); });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 100, sessionCount: 1, topModel: "model-b", lastActiveAt: october + 1 });
    await t.run(async ctx => { await ctx.db.delete("sessions", next); await reconcileUsageSession(ctx, next); await reconcileUsageSession(ctx, next); });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 0, sessionCount: 0, topModel: "unknown", lastActiveAt: 0 });
    expect((await owner.query(api.usageDirectory.details, { userId: ownerId, month: "2026-10" })).models).toEqual([]);
  });
  it("counts zero-token sessions without NaN or negative usage", async () => {
    const { t, ownerId } = await setup();
    await session(t, ownerId, 0);
    await session(t, ownerId, -5);
    await session(t, ownerId, Number.NaN);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 0, sessionCount: 3 });
    expect(await t.query(api.usageDirectory.publicBoard, {})).toEqual([]);
  });
  it("does not resurrect a deleted account while reconciling orphan sessions", async () => {
    const { t, ownerId } = await setup();
    const id = await session(t, ownerId, 100);
    await t.run(async ctx => {
      await ctx.db.delete("users", ownerId);
      await syncUsagePerson(ctx, ownerId);
      await ctx.db.patch("sessions", id, { totalTokens: 200 });
      await reconcileUsageSession(ctx, id);
    });
    expect(await stats(t, ownerId)).toBeNull();
    expect(await t.query(api.usageDirectory.publicBoard, {})).toEqual([]);
  });
});


// Cover integration entry points: a correct helper is insufficient if sync bypasses it.
describe("real ingestion and deletion hooks", () => {
  it("upserts single sessions without counting retries twice", async () => {
    const { t, ownerId } = await setup();
    const input = { userId: ownerId, externalId: "single-sync", model: "model-a", promptTokens: 80, completionTokens: 20 };
    const id = await t.mutation(internal.sessions.upsert, input);
    expect(await t.mutation(internal.sessions.upsert, input)).toBe(id);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 100, sessionCount: 1 });
    await t.mutation(internal.sessions.upsert, { ...input, promptTokens: 180, model: "model-b" });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 200, sessionCount: 1, topModel: "model-b" });
  });
  it("reconciles a batch serially so users with multiple sessions retain all totals", async () => {
    const { t, ownerId } = await setup();
    const input = { userId: ownerId, sessions: [
      { externalId: "batch-1", model: "model-a", promptTokens: 100, completionTokens: 50 },
      { externalId: "batch-2", model: "model-b", promptTokens: 200, completionTokens: 50 },
      { externalId: "batch-3", model: "model-a", promptTokens: 300, completionTokens: 50 },
    ] };
    expect(await t.mutation(internal.sessions.batchUpsert, input)).toMatchObject({ inserted: 3 });
    await t.mutation(internal.sessions.batchUpsert, input);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 750, sessionCount: 3, topModel: "model-a" });
    vi.setSystemTime(october + 60_000);
    await t.mutation(internal.sessions.batchUpsert, { userId: ownerId, sessions: [
      { ...input.sessions[0], promptTokens: 200 },
      { ...input.sessions[1], model: "model-a" },
    ] });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 850, sessionCount: 3, topModel: "model-a" });
  });
  it("counts zero-token message placeholders once until session totals arrive", async () => {
    const { t, ownerId } = await setup();
    const message = { userId: ownerId, sessionExternalId: "message-first", externalId: "message-1", role: "assistant" as const, model: "model-a", promptTokens: 30, completionTokens: 20 };
    await t.mutation(internal.messages.upsert, message);
    await t.mutation(internal.messages.upsert, message);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 0, sessionCount: 1 });
    await t.mutation(internal.messages.batchUpsert, { userId: ownerId, messages: [
      { sessionExternalId: "message-first", externalId: "message-2", role: "assistant", model: "model-a", promptTokens: 30 },
      { sessionExternalId: "another-placeholder", externalId: "message-3", role: "assistant", model: "model-b", promptTokens: 70 },
    ] });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 0, sessionCount: 2 });
    await t.mutation(internal.sessions.upsert, { userId: ownerId, externalId: "message-first", model: "model-a", promptTokens: 60, completionTokens: 40 });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 100, sessionCount: 2, topModel: "model-a" });
  });
  it("updates retained usage through ordinary session removal and account deletion batches", async () => {
    const { t, owner, ownerId } = await setup();
    const id = await t.mutation(internal.sessions.upsert, { userId: ownerId, externalId: "remove-one", model: "model-a", promptTokens: 500 });
    await t.mutation(internal.sessions.upsert, { userId: ownerId, externalId: "remove-two", model: "model-b", promptTokens: 100 });
    await owner.mutation(api.sessions.remove, { sessionId: id });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 100, sessionCount: 1, topModel: "model-b" });
    await t.mutation(internal.users.deleteSessionsBatch, { userId: ownerId });
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 0, sessionCount: 0, topModel: "unknown" });
    expect(await t.run(ctx => ctx.db.query("usageSessionLedger").collect())).toEqual([]);
    expect(await t.run(ctx => ctx.db.query("usageModelTotals").collect())).toEqual([]);
  });
});

it("keeps HTTP batch sync counts accurate across multiple bounded chunks", async () => {
  const { t, ownerId } = await setup();
  const apiKey = "osk_offline-usage-test";
  await t.run(ctx => ctx.db.patch("users", ownerId, { apiKey }));
  const body = {
    sessions: Array.from({ length: 55 }, (_, index) => ({ externalId: `http-session-${index}`, model: "model-a", promptTokens: 10, completionTokens: 5 })),
    messages: Array.from({ length: 55 }, (_, index) => ({ sessionExternalId: `http-placeholder-${index}`, externalId: `http-message-${index}`, role: "assistant", model: "model-b", promptTokens: 300 })),
  };
  const response = await t.fetch("/sync/batch", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, sessions: 55, messages: 55, errors: [] });
  expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 825, sessionCount: 110, topModel: "model-a" });
  expect(await t.run(ctx => ctx.db.query("usageSessionLedger").collect())).toHaveLength(110);
  const retry = await t.fetch("/sync/batch", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  expect(retry.status).toBe(200);
  expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 825, sessionCount: 110 });
});

it("publishes only a readiness flag for historical indexing", async () => {
  const { t } = await setup();
  expect(await t.query(api.usageDirectory.publicStatus, {})).toEqual({ ready: false });
  await t.run(ctx => ctx.db.insert("usageDirectoryState", { key: "backfill", phase: "complete", cursor: null, runId: "offline", processedUsers: 999, processedSessions: 100000, updatedAt: 1 }));
  expect(await t.query(api.usageDirectory.publicStatus, {})).toEqual({ ready: true });
});


// Backfill pages use the same persisted ledger as live ingestion, with counters grouped per user.
describe("batched historical reconciliation", () => {
  async function insertRaw(t: TestBackend, userIds: Id<"users">[], count: number) {
    return t.run(async ctx => {
      const ids: Id<"sessions">[] = [];
      for (let index = 0; index < count; index++) {
        const tokens = index % 2 === 0 ? 10 : 30;
        ids.push(await ctx.db.insert("sessions", {
          userId: userIds[index % userIds.length], externalId: crypto.randomUUID(),
          promptTokens: tokens, completionTokens: 0, totalTokens: tokens, cost: 0,
          model: index % 2 === 0 ? "model-a" : "model-b", isPublic: false, messageCount: 0,
          createdAt: index % 2 === 0 ? october : Date.UTC(2026, 8, 2), updatedAt: october + index,
        }));
      }
      return ids;
    });
  }
  async function reconcileBatch(t: TestBackend, ids: Id<"sessions">[]) {
    await t.run(async ctx => {
      const inputs = await Promise.all(ids.map(async sessionId => ({ sessionId, sessionDoc: await ctx.db.get("sessions", sessionId) })));
      await reconcileUsageSessions(ctx, inputs);
    });
  }
  it("consolidates a full 200-session page by model and month, ignoring duplicate IDs and retries", async () => {
    const { t, owner, ownerId } = await setup();
    const ids = await insertRaw(t, [ownerId], 200);
    await reconcileBatch(t, [...ids, ids[0], ids[1]]);
    await reconcileBatch(t, ids);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 4000, sessionCount: 200, topModel: "model-b", lastActiveAt: october + 199 });
    const detail = await owner.query(api.usageDirectory.details, { userId: ownerId, month: "2026-10" });
    expect(detail.models).toEqual([{ model: "model-b", tokens: 3000, sessions: 100 }, { model: "model-a", tokens: 1000, sessions: 100 }]);
    expect(detail.months.find(row => row.month === "2026-09")?.models).toEqual([{ model: "model-b", tokens: 3000, sessions: 100 }]);
    expect(detail.months.find(row => row.month === "2026-10")?.models).toEqual([{ model: "model-a", tokens: 1000, sessions: 100 }]);
    expect(await t.run(ctx => ctx.db.query("usageSessionLedger").collect())).toHaveLength(200);
    expect(await t.run(ctx => ctx.db.query("usageModelTotals").collect())).toHaveLength(4);
  });
  it("keeps multiple users isolated within the same page", async () => {
    const { t, ownerId } = await setup();
    const alice = await person(t, "Alice Private", "alice@example.com");
    const ids = await insertRaw(t, [ownerId, alice.userId], 200);
    await reconcileBatch(t, ids);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 1000, sessionCount: 100, topModel: "model-a", lastActiveAt: october + 198 });
    expect(await stats(t, alice.userId)).toMatchObject({ totalTokens: 3000, sessionCount: 100, topModel: "model-b", lastActiveAt: october + 199 });
    expect(await t.query(api.usageDirectory.publicBoard, {})).toEqual([]);
  });
  it("applies model/month corrections and deletions together before choosing the next top model", async () => {
    const { t, owner, ownerId } = await setup();
    const deleted = await session(t, ownerId, 900, "model-a", { updatedAt: october + 3 });
    const corrected = await session(t, ownerId, 300, "model-a", { updatedAt: october + 2 });
    const retained = await session(t, ownerId, 200, "model-b", { updatedAt: october + 1 });
    await t.run(async ctx => {
      await ctx.db.delete("sessions", deleted);
      await ctx.db.patch("sessions", corrected, { totalTokens: 100, model: "model-b", createdAt: Date.UTC(2026, 8, 2), updatedAt: october + 4 });
      await reconcileUsageSessions(ctx, [
        { sessionId: deleted, sessionDoc: null },
        { sessionId: corrected, sessionDoc: await ctx.db.get("sessions", corrected) },
        { sessionId: retained, sessionDoc: await ctx.db.get("sessions", retained) },
      ]);
    });
    await reconcileBatch(t, [deleted, corrected, retained]);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 300, sessionCount: 2, topModel: "model-b", lastActiveAt: october + 4 });
    const detail = await owner.query(api.usageDirectory.details, { userId: ownerId, month: "2026-10" });
    expect(detail.models).toEqual([{ model: "model-b", tokens: 300, sessions: 2 }]);
    expect(detail.months.find(row => row.month === "2026-09")?.models).toEqual([{ model: "model-b", tokens: 100, sessions: 1 }]);
    expect(detail.months.find(row => row.month === "2026-10")?.models).toEqual([{ model: "model-b", tokens: 200, sessions: 1 }]);
  });
  it("merges already indexed live sync with newly discovered history in either order", async () => {
    const { t, ownerId } = await setup();
    const live = await session(t, ownerId, 500, "model-live");
    const history = await insertRaw(t, [ownerId], 199);
    // Live sync wins its transaction first; a later backfill must count only the remaining delta.
    await t.run(async ctx => {
      await ctx.db.patch("sessions", live, { totalTokens: 600 });
      await reconcileUsageSession(ctx, live);
    });
    await reconcileBatch(t, [live, ...history]);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 4570, sessionCount: 200 });
    // An ordinary sync after the backfill must update its existing ledger rather than add a session.
    await t.run(async ctx => {
      await ctx.db.patch("sessions", history[0], { totalTokens: 110 });
      await reconcileUsageSession(ctx, history[0]);
    });
    await reconcileBatch(t, [live, ...history]);
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 4670, sessionCount: 200 });
    expect(await t.run(ctx => ctx.db.query("usageSessionLedger").collect())).toHaveLength(200);
  });
  it("rejects oversized unique pages and mismatched snapshots without partial accounting", async () => {
    const { t, ownerId } = await setup();
    const ids = await insertRaw(t, [ownerId], 201);
    await expect(reconcileBatch(t, ids)).rejects.toThrow("at most 200");
    await expect(t.run(async ctx => reconcileUsageSessions(ctx, [{ sessionId: ids[0], sessionDoc: await ctx.db.get("sessions", ids[1]) }]))).rejects.toThrow("does not match");
    expect(await stats(t, ownerId)).toMatchObject({ totalTokens: 0, sessionCount: 0 });
    expect(await t.run(ctx => ctx.db.query("usageSessionLedger").collect())).toEqual([]);
  });
  it("creates and repairs a directory entry through the WorkOS identity lookup", async () => {
    const { t } = await setup();
    const args = { workosId: "new-unprofiled-user" };
    const user = await t.mutation(internal.users.getByWorkosId, args);
    expect(user).not.toBeNull();
    expect(await stats(t, user!._id)).toMatchObject({ totalTokens: 0, sessionCount: 0, publicOptIn: false });
    await t.run(async ctx => {
      const row = await ctx.db.query("usagePeople").withIndex("by_user", q => q.eq("userId", user!._id)).unique();
      await ctx.db.delete("usagePeople", row!._id);
    });
    expect((await t.mutation(internal.users.getByWorkosId, args))?._id).toBe(user!._id);
    expect(await stats(t, user!._id)).toMatchObject({ totalTokens: 0, sessionCount: 0, publicOptIn: false });
  });
});

const publicPageArgs = { paginationOpts: { numItems: 100, cursor: null }, sort: "tokens", direction: "desc" } as const;
async function seedPublicPeople(t: TestBackend, count: number) {
  const result: Array<{ firstName: string; totalTokens: number; topModel: string }> = [];
  for (let index = 0; index < count; index++) {
    const firstName = `Member ${String.fromCharCode(65 + Math.floor(index / 26))}${String.fromCharCode(65 + index % 26)}`;
    const topModel = index % 2 === 0 ? "model-a" : "model-b";
    const user = await person(t, `Private ${count - index}`, `private-${index}@example.com`, {
      usageLeaderboardOptIn: true, usageLeaderboardFirstName: firstName,
    });
    await session(t, user.userId, index + 1, topModel);
    result.push({ firstName, totalTokens: index + 1, topModel });
  }
  return result;
}

describe("public leaderboard pagination", () => {
  it("loads the top 100 then the remaining users without private fields or duplicate rows", async () => {
    const { t, owner } = await setup();
    const seeded = await seedPublicPeople(t, 125);
    const first = await t.query(api.usageDirectory.publicPage, publicPageArgs);
    expect(first.page).toEqual([...seeded].reverse().slice(0, 100));
    expect(first.isDone).toBe(false);
    const second = await t.query(api.usageDirectory.publicPage, {
      ...publicPageArgs, paginationOpts: { numItems: 100, cursor: first.continueCursor },
    });
    expect(second.page).toEqual([...seeded].reverse().slice(100));
    expect(second.isDone).toBe(true);
    expect(first.page.every(row => Object.keys(row).sort().join(",") === "firstName,topModel,totalTokens")).toBe(true);
    // The admin table has the same 100-row first page and retains private accounts.
    const adminFirst = await owner.query(api.usageDirectory.list, { ...listArgs, paginationOpts: { numItems: 100, cursor: null } });
    const adminSecond = await owner.query(api.usageDirectory.list, { ...listArgs, paginationOpts: { numItems: 100, cursor: adminFirst.continueCursor } });
    expect(adminFirst.page).toHaveLength(100);
    expect(adminSecond.page).toHaveLength(26);
    expect(adminSecond.isDone).toBe(true);
  });
  it.each(["tokens", "name"] as const)("sorts globally by %s in both directions with an exact model filter", async sort => {
    const { t } = await setup();
    const seeded = await seedPublicPeople(t, 7);
    for (const direction of ["asc", "desc"] as const) {
      for (const model of [undefined, "model-a", "model-b"] as const) {
        const expected = seeded.filter(row => !model || row.topModel === model).sort((a, b) => {
          const comparison = sort === "name" ? a.firstName.localeCompare(b.firstName) : a.totalTokens - b.totalTokens;
          return direction === "asc" ? comparison : -comparison;
        });
        const first = await t.query(api.usageDirectory.publicPage, { paginationOpts: { numItems: 2, cursor: null }, sort, direction, model });
        const second = await t.query(api.usageDirectory.publicPage, { paginationOpts: { numItems: 100, cursor: first.continueCursor }, sort, direction, model });
        expect([...first.page, ...second.page]).toEqual(expected);
      }
    }
    const missing = await t.query(api.usageDirectory.publicPage, { ...publicPageArgs, model: "model" });
    expect(missing.page).toEqual([]);
  });
  it("orders by the consented first name rather than private full name", async () => {
    const { t } = await setup();
    const first = await person(t, "Zebra Private", "zebra@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Alice" });
    const last = await person(t, "Aardvark Private", "aardvark@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Zoe" });
    await session(t, first.userId, 1);
    await session(t, last.userId, 2);
    const result = await t.query(api.usageDirectory.publicPage, { ...publicPageArgs, sort: "name", direction: "asc" });
    expect(result.page.map(row => row.firstName)).toEqual(["Alice", "Zoe"]);
  });
  it("rechecks live consent, name, deletion status and account existence against stale projections", async () => {
    const { t } = await setup();
    const live = await person(t, "Live Private", "live@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Live" });
    const revoked = await person(t, "Revoked Private", "revoked@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Revoked" });
    const deleted = await person(t, "Deleted Private", "deleted@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Deleted" });
    const pending = await person(t, "Pending Private", "pending@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Pending" });
    const renamed = await person(t, "Renamed Private", "renamed@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Renamed" });
    const privateUser = await person(t, "Private User", "private@example.com");
    for (const user of [live, revoked, deleted, pending, renamed, privateUser]) await session(t, user.userId, 10);
    await t.run(async ctx => {
      await ctx.db.patch("users", revoked.userId, { usageLeaderboardOptIn: false });
      await ctx.db.delete("users", deleted.userId);
      await ctx.db.patch("users", pending.userId, { deletionStatus: "pending" });
      await ctx.db.patch("users", renamed.userId, { usageLeaderboardFirstName: "New" });
    });
    for (const sort of ["tokens", "name"] as const) {
      const result = await t.query(api.usageDirectory.publicPage, { ...publicPageArgs, sort });
      expect(result.page).toEqual([{ firstName: "Live", totalTokens: 10, topModel: "model-a" }]);
    }
    await live.identity.mutation(api.usageDirectory.setPreference, { optedIn: false, firstName: "" });
    expect((await t.query(api.usageDirectory.publicPage, publicPageArgs)).page).toEqual([]);
  });
  it("keeps a continuation for a name-ordered page filtered down to zero positive-usage rows", async () => {
    const { t } = await setup();
    const zero = await person(t, "Zero Private", "zero@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Aaron" });
    const positive = await person(t, "Positive Private", "positive@example.com", { usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Zoe" });
    await session(t, zero.userId, 0);
    await session(t, positive.userId, 5);
    const args = { paginationOpts: { numItems: 1, cursor: null }, sort: "name", direction: "asc" } as const;
    const first = await t.query(api.usageDirectory.publicPage, args);
    expect(first.page).toEqual([]);
    expect(first.isDone).toBe(false);
    const second = await t.query(api.usageDirectory.publicPage, { ...args, paginationOpts: { numItems: 1, cursor: first.continueCursor } });
    expect(second.page).toEqual([{ firstName: "Zoe", totalTokens: 5, topModel: "model-a" }]);
  });
  it("rejects invalid public/admin page sizes and oversized model filters", async () => {
    const { t, owner } = await setup();
    for (const numItems of [0, -1, 101, 1.5, NaN, Infinity]) {
      await expect(t.query(api.usageDirectory.publicPage, { ...publicPageArgs, paginationOpts: { numItems, cursor: null } })).rejects.toThrow();
      await expect(owner.query(api.usageDirectory.list, { ...listArgs, paginationOpts: { numItems, cursor: null } })).rejects.toThrow();
    }
    await expect(t.query(api.usageDirectory.publicPage, { ...publicPageArgs, model: "a".repeat(161) })).rejects.toThrow("too long");
  });
});

describe("admin global date sorting", () => {
  async function dateFixture() {
    const { t, owner, ownerId } = await setup();
    const rows: Array<{ id: Id<"users">; publicOptIn: boolean; model: string; activity: number; joined: number }> = [
      { id: ownerId, publicOptIn: false, model: "unknown", activity: 0, joined: 1 },
    ];
    for (let index = 0; index < 12; index++) {
      const model = index % 2 === 0 ? "model-a" : "model-b";
      const publicOptIn = index % 4 < 2;
      // Creation order deliberately differs from both date orders and token order.
      const joined = (((index * 7) % 12) + 1) * 10_000;
      const activity = (((index * 5) % 12) + 1) * 1_000;
      const user = await person(t, `Dateuser ${index}`, `dates-${index}@example.com`, {
        createdAt: joined, usageLeaderboardOptIn: publicOptIn, usageLeaderboardFirstName: "Dateuser",
      });
      await session(t, user.userId, index + 1, model, { updatedAt: activity });
      rows.push({ id: user.userId, publicOptIn, model, activity, joined });
    }
    const never = await person(t, "Never Synced", "never@example.com", {
      createdAt: 15_000, usageLeaderboardOptIn: true, usageLeaderboardFirstName: "Never",
    });
    rows.push({ id: never.userId, publicOptIn: true, model: "unknown", activity: 0, joined: 15_000 });
    return { t, owner, rows };
  }
  it.each([
    ["activity", "asc"], ["activity", "desc"], ["joined", "asc"], ["joined", "desc"],
  ] as const)("paginates globally by %s %s for every model/privacy filter combination", async (sort, direction) => {
    const { owner, rows } = await dateFixture();
    for (const publicOnly of [undefined, true, false]) {
      for (const model of [undefined, "model-a", "model-b", "unknown"]) {
        const expected = rows.filter(row => (publicOnly === undefined || row.publicOptIn === publicOnly) && (!model || row.model === model));
        const actual: Array<{ id: Id<"users">; date: number }> = [];
        let cursor: string | null = null;
        let isDone = false;
        for (let pageNumber = 0; pageNumber < 20 && !isDone; pageNumber++) {
          const result: FunctionReturnType<typeof api.usageDirectory.list> = await owner.query(api.usageDirectory.list, {
            ...listArgs, sort, direction, publicOnly, model,
            paginationOpts: { numItems: 2, cursor },
          });
          actual.push(...result.page.map(row => ({ id: row._id, date: sort === "activity" ? row.lastActiveAt : row.joinedAt })));
          cursor = result.continueCursor;
          isDone = result.isDone;
        }
        expect(isDone).toBe(true);
        expect(actual.map(row => row.id).sort()).toEqual(expected.map(row => row.id).sort());
        const expectedDates = expected.map(row => row[sort]).sort((a, b) => direction === "asc" ? a - b : b - a);
        expect(actual.map(row => row.date)).toEqual(expectedDates);
      }
    }
  });
  it("preserves search relevance and search filters when a date sort is selected", async () => {
    const { owner } = await dateFixture();
    const args = { ...listArgs, search: "Dateuser", publicOnly: true, model: "model-a", paginationOpts: { numItems: 100, cursor: null } };
    const baseline = await owner.query(api.usageDirectory.list, args);
    expect(baseline.page).toHaveLength(3);
    for (const sort of ["activity", "joined"] as const) {
      for (const direction of ["asc", "desc"] as const) {
        const result = await owner.query(api.usageDirectory.list, { ...args, sort, direction });
        expect(result.page.map(row => row._id)).toEqual(baseline.page.map(row => row._id));
      }
    }
  });
});
