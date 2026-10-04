/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { EmailId } from "@convex-dev/resend";
import type { Doc } from "./_generated/dataModel";
import { sendBroadcastEmail } from "./email";

// Preserve the real webhook handler but replace all outbound broadcast mail.
vi.mock("./email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./email")>()),
  sendBroadcastEmail: vi.fn(),
}));
const modules = import.meta.glob("./**/*.ts");
const owners = ["wayne@socialwayne.com", "wayne@convex.dev"];
const content = {
  subject: "OpenSync update",
  bodyText: "A saved update, tested offline.",
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Network requests are forbidden in these tests");
    }),
  );
  vi.stubEnv("RESEND_TEST_MODE", "true");
  vi.stubEnv("RESEND_API_KEY", "offline-only");
  vi.stubEnv(
    "RESEND_FROM_EMAIL",
    "OpenSync <updates@notifications.opensync.dev>",
  );
  vi.stubEnv("RESEND_WEBHOOK_SECRET", "offline-only");
  vi.stubEnv("EMAIL_POSTAL_ADDRESS", "Offline test footer");
  vi.stubEnv("CONVEX_SITE_URL", "https://offline-test.convex.site");
  vi.mocked(sendBroadcastEmail)
    .mockReset()
    .mockImplementation(async () => `offline-${crypto.randomUUID()}`);
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

async function setup(email = owners[0], overrides: Partial<Doc<"users">> = {}) {
  const t = convexTest(schema, modules);
  const subject = "owner-subject";
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      workosId: subject,
      name: "Wayne Sutton",
      email,
      createdAt: 1,
      updatedAt: 1,
      ...overrides,
    }),
  );
  const owner = t.withIdentity({
    subject,
    issuer: "https://api.workos.com/",
    email,
    emailVerified: true,
  });
  return { t, owner, id, subject };
}

describe("owner-only platform administration", () => {
  it.each(owners)("permits %s without a bootstrap role", async (email) => {
    const { owner } = await setup(email);
    expect(await owner.query(api.admin.isPlatformAdmin, {})).toBe(true);
    expect(
      await owner.mutation(api.broadcasts.createDraft, content),
    ).toBeTruthy();
  });
  it("accepts only boolean verified claims from WorkOS custom JWT auth", async () => {
    const { t, subject } = await setup();
    expect(
      await t
        .withIdentity({ subject, email: owners[0], email_verified: true })
        .query(api.admin.isPlatformAdmin, {}),
    ).toBe(true);
    for (const claim of [false, "true", null]) {
      expect(
        await t
          .withIdentity({ subject, email: owners[0], email_verified: claim })
          .query(api.admin.isPlatformAdmin, {}),
      ).toBe(false);
    }
    expect(
      await t
        .withIdentity({
          subject,
          email: owners[0],
          emailVerified: false,
          email_verified: true,
        })
        .query(api.admin.isPlatformAdmin, {}),
    ).toBe(false);
  });
  it("normalizes signed email casing and whitespace", async () => {
    const { owner } = await setup(" WAYNE@CONVEX.DEV ");
    expect(await owner.query(api.admin.isPlatformAdmin, {})).toBe(true);
  });
  it("denies anonymous calls, non-owners and non-owner addresses", async () => {
    const { t, owner } = await setup("other@example.com");
    expect(await t.query(api.admin.isPlatformAdmin, {})).toBe(false);
    expect(await owner.query(api.admin.isPlatformAdmin, {})).toBe(false);
    await expect(owner.query(api.admin.listAuditLog, {})).rejects.toThrow(
      "Platform admin access required",
    );
    await expect(
      owner.mutation(api.broadcasts.createDraft, content),
    ).rejects.toThrow("Platform admin access required");
    await expect(
      t.mutation(api.broadcasts.createDraft, content),
    ).rejects.toThrow("Not authenticated");
  });
  it("cannot authorize from a stale database email or missing claim", async () => {
    const { t, subject } = await setup();
    for (const identity of [
      { subject, email: "other@example.com" },
      { subject },
    ]) {
      const denied = t.withIdentity(identity);
      expect(await denied.query(api.admin.isPlatformAdmin, {})).toBe(false);
    }
  });
  it("denies unverified email and missing verification claims", async () => {
    const { t, subject } = await setup();
    expect(
      await t
        .withIdentity({ subject, email: owners[0] })
        .query(api.admin.getAccessStatus, {}),
    ).toMatchObject({
      allowed: false,
      message: expect.stringContaining("missing the verified-email claim"),
    });
    expect(
      await t
        .withIdentity({ subject, email: owners[0], emailVerified: false })
        .query(api.admin.getAccessStatus, {}),
    ).toMatchObject({
      allowed: false,
      message: expect.stringContaining("not verified"),
    });
    expect(
      await t
        .withIdentity({ subject, email: owners[0], emailVerified: false })
        .query(api.admin.isPlatformAdmin, {}),
    ).toBe(false);
    expect(
      await t
        .withIdentity({ subject, email: owners[0] })
        .query(api.admin.isPlatformAdmin, {}),
    ).toBe(false);
  });
  it.each(["pending", "in_progress", "completed"] as const)(
    "denies owners with deletion status %s",
    async (deletionStatus) => {
      const { owner } = await setup(owners[0], { deletionStatus });
      expect(await owner.query(api.admin.isPlatformAdmin, {})).toBe(false);
    },
  );
});

describe("drafts and email safeguards", () => {
  it("creates, edits, reopens and idempotently deletes a draft without email", async () => {
    const { owner } = await setup();
    const broadcastId = await owner.mutation(
      api.broadcasts.createDraft,
      content,
    );
    await owner.mutation(api.broadcasts.updateDraft, {
      broadcastId,
      ...content,
      subject: " Revised subject ",
    });
    expect(
      await owner.query(api.broadcasts.getBroadcast, { broadcastId }),
    ).toMatchObject({
      subject: "Revised subject",
      bodyText: content.bodyText,
      status: "draft",
    });
    await owner.mutation(api.broadcasts.deleteDraft, { broadcastId });
    await owner.mutation(api.broadcasts.deleteDraft, { broadcastId });
    expect(
      await owner.query(api.broadcasts.getBroadcast, { broadcastId }),
    ).toBeNull();
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
  });
  it("validates content on both create and edit", async () => {
    const { owner } = await setup();
    const broadcastId = await owner.mutation(
      api.broadcasts.createDraft,
      content,
    );
    for (const invalid of [
      { subject: " ", bodyText: "text" },
      { subject: "x\nBcc: x", bodyText: "text" },
      { subject: "x".repeat(201), bodyText: "text" },
      { subject: "x", bodyText: "x".repeat(50001) },
    ]) {
      await expect(
        owner.mutation(api.broadcasts.createDraft, invalid),
      ).rejects.toThrow();
      await expect(
        owner.mutation(api.broadcasts.updateDraft, { broadcastId, ...invalid }),
      ).rejects.toThrow();
    }
  });
  it("blocks both send paths in test mode before scheduling or queueing", async () => {
    const { t, owner } = await setup();
    const broadcastId = await owner.mutation(
      api.broadcasts.createDraft,
      content,
    );
    await expect(
      owner.mutation(api.broadcasts.sendTest, { broadcastId }),
    ).rejects.toThrow("test mode");
    await expect(
      owner.mutation(api.broadcasts.sendBroadcast, { broadcastId }),
    ).rejects.toThrow("test mode");
    expect(
      (await owner.query(api.broadcasts.getBroadcast, { broadcastId }))?.status,
    ).toBe("draft");
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").collect(),
      ),
    ).toHaveLength(0);
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
  });
  it("requires footer and webhook setup before allowing real delivery", async () => {
    vi.stubEnv("RESEND_TEST_MODE", "false");
    vi.stubEnv("EMAIL_POSTAL_ADDRESS", "");
    vi.stubEnv("RESEND_WEBHOOK_SECRET", "");
    const { owner } = await setup();
    const config = await owner.query(api.broadcasts.getEmailConfiguration, {});
    expect(config).toMatchObject({ canSend: false, testRecipient: owners[0] });
    expect(config.missing).toContain("EMAIL_POSTAL_ADDRESS");
    const broadcastId = await owner.mutation(
      api.broadcasts.createDraft,
      content,
    );
    await expect(
      owner.mutation(api.broadcasts.sendBroadcast, { broadcastId }),
    ).rejects.toThrow("setup is incomplete");
  });
  it.each(owners)(
    "test recipient is the signed-in %s, never a stale profile address",
    async (email) => {
      vi.stubEnv("RESEND_TEST_MODE", "false");
      const { owner } = await setup(email, { email: "stale@example.com" });
      const broadcastId = await owner.mutation(
        api.broadcasts.createDraft,
        content,
      );
      await owner.mutation(api.broadcasts.sendTest, { broadcastId });
      expect(sendBroadcastEmail).toHaveBeenCalledOnce();
      expect(vi.mocked(sendBroadcastEmail).mock.calls[0][1]).toMatchObject({
        to: email,
        subject: `[Test] ${content.subject}`,
      });
      expect(await owner.query(api.admin.listAuditLog, {})).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: "test_email_broadcast" }),
        ]),
      );
    },
  );
  it("excludes opted-out, suppressed, inactive and deleting accounts from the audience", async () => {
    const { t, owner } = await setup();
    const exclusions: Partial<Doc<"users">>[] = [
      { emailUpdatesOptOut: true },
      { emailSuppressed: true },
      { deletionStatus: "pending" },
      { deletionStatus: "in_progress" },
      { deletionStatus: "completed" },
      { email: undefined },
    ];
    await t.run(async (ctx) => {
      for (const [i, extra] of exclusions.entries())
        await ctx.db.insert("users", {
          workosId: `excluded-${i}`,
          email: "excluded@example.com",
          createdAt: 1,
          updatedAt: 1,
          ...extra,
        });
    });
    expect(await owner.query(api.broadcasts.recipientCount, {})).toEqual({
      count: 1,
      isExact: true,
    });
  });
  it("enqueues once, preserves draft immutability, and treats queued counts as queueing", async () => {
    vi.stubEnv("RESEND_TEST_MODE", "false");
    const { t, owner } = await setup();
    const broadcastId = await owner.mutation(
      api.broadcasts.createDraft,
      content,
    );
    await owner.mutation(api.broadcasts.sendBroadcast, { broadcastId });
    await owner.mutation(api.broadcasts.sendBroadcast, { broadcastId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(sendBroadcastEmail).toHaveBeenCalledOnce();
    expect(vi.mocked(sendBroadcastEmail).mock.calls[0][1].to).toBe(owners[0]);
    expect(
      await owner.query(api.broadcasts.getBroadcast, { broadcastId }),
    ).toMatchObject({
      status: "sent",
      sentCount: 1,
      delivery: { queued: 1, delivered: 0 },
    });
    await expect(
      owner.mutation(api.broadcasts.updateDraft, { broadcastId, ...content }),
    ).rejects.toThrow("Only drafts");
    await expect(
      owner.mutation(api.broadcasts.deleteDraft, { broadcastId }),
    ).rejects.toThrow("Only drafts");
    await expect(
      owner.mutation(api.broadcasts.sendTest, { broadcastId }),
    ).rejects.toThrow("Only drafts");
  });
  it("stops a scheduled broadcast when sending is disabled", async () => {
    vi.stubEnv("RESEND_TEST_MODE", "false");
    const { t, owner } = await setup();
    const broadcastId = await owner.mutation(
      api.broadcasts.createDraft,
      content,
    );
    await owner.mutation(api.broadcasts.sendBroadcast, { broadcastId });
    vi.stubEnv("RESEND_TEST_MODE", "true");
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(
      (await owner.query(api.broadcasts.getBroadcast, { broadcastId }))?.status,
    ).toBe("failed");
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
  });
  it("unsubscribe is idempotent, and opting back in never removes suppression", async () => {
    const { t, owner } = await setup(owners[0], {
      unsubscribeToken: "offline-token",
      emailSuppressed: true,
    });
    expect(
      await t.mutation(internal.broadcasts.unsubscribeByToken, {
        token: "wrong",
      }),
    ).toBe(false);
    for (let i = 0; i < 2; i++)
      expect(
        await t.mutation(internal.broadcasts.unsubscribeByToken, {
          token: "offline-token",
        }),
      ).toBe(true);
    expect(await owner.query(api.broadcasts.getEmailUpdatesOptOut, {})).toBe(
      true,
    );
    await owner.mutation(api.broadcasts.setEmailUpdatesOptOut, {
      optOut: false,
    });
    expect(await owner.query(api.broadcasts.recipientCount, {})).toEqual({
      count: 0,
      isExact: true,
    });
  });
});

describe("webhook delivery history", () => {
  it("preserves delivery on late events and permanently suppresses complaints", async () => {
    const { t, owner, id } = await setup();
    const broadcastId = await owner.mutation(
      api.broadcasts.createDraft,
      content,
    );
    await t.run((ctx) =>
      ctx.db.insert("emailBroadcastSends", {
        broadcastId,
        userId: id,
        emailId: "offline-email",
        status: "queued",
      }),
    );
    const event = (
      type: "email.delivered" | "email.sent" | "email.complained",
    ) => ({
      type,
      created_at: "2026-10-03T00:00:00Z",
      data: {
        email_id: "offline-email",
        from: "updates@notifications.opensync.dev",
        to: [owners[0]],
        subject: content.subject,
        created_at: "2026-10-03T00:00:00Z",
      },
    });
    await t.mutation(internal.email.handleEmailEvent, {
      id: "offline-email" as EmailId,
      event: event("email.delivered"),
    });
    await t.mutation(internal.email.handleEmailEvent, {
      id: "offline-email" as EmailId,
      event: event("email.sent"),
    });
    expect(
      (await owner.query(api.broadcasts.getBroadcast, { broadcastId }))
        ?.delivery,
    ).toMatchObject({ delivered: 1, queued: 0 });
    await t.mutation(internal.email.handleEmailEvent, {
      id: "offline-email" as EmailId,
      event: event("email.complained"),
    });
    await t.mutation(internal.email.handleEmailEvent, {
      id: "offline-email" as EmailId,
      event: event("email.delivered"),
    });
    expect(
      (await owner.query(api.broadcasts.getBroadcast, { broadcastId }))
        ?.delivery,
    ).toMatchObject({ delivered: 0, failed: 1 });
    expect(await owner.query(api.broadcasts.recipientCount, {})).toEqual({
      count: 0,
      isExact: true,
    });
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
  });
});

describe("single-recipient search and sending", () => {
  it("searches names and emails, prioritizes exact email, and protects results", async () => {
    const { t, owner, id } = await setup();
    await t.run((ctx) => ctx.db.patch("users", id, { name: "Wayne Sutton" }));
    await t.run((ctx) =>
      ctx.db.insert("users", {
        workosId: "other-search-user",
        createdAt: 1,
        updatedAt: 1,
        email: "unrelated@example.com",
        name: "Other Person",
      }),
    );
    const exact = await owner.query(api.broadcasts.searchRecipients, {
      search: "wayne@socialwayne.com",
    });
    expect(exact.recipients.map((r) => r._id)).toEqual([id]);
    expect(exact.hasMore).toBe(false);
    const partial = await owner.query(api.broadcasts.searchRecipients, {
      search: "wayne@social",
    });
    expect(partial.recipients.map((r) => r._id)).toEqual([id]);
    expect(
      (
        await owner.query(api.broadcasts.searchRecipients, {
          search: "WAYNE@SOCIALWAYNE.COM",
        })
      ).recipients[0]._id,
    ).toBe(id);
    expect(
      (
        await owner.query(api.broadcasts.searchRecipients, { search: "Sutt" })
      ).recipients.map((r) => r._id),
    ).toContain(id);
    expect(
      await owner.query(api.broadcasts.searchRecipients, { search: "x" }),
    ).toEqual({ recipients: [], hasMore: false });
    expect(
      (
        await owner.query(api.broadcasts.searchRecipients, {
          search: "zznomatch",
        })
      ).recipients,
    ).toHaveLength(0);
    await expect(
      t.query(api.broadcasts.searchRecipients, { search: "wayne" }),
    ).rejects.toThrow("Not authenticated");
    const outsider = await setup("other@example.com");
    await expect(
      outsider.owner.query(api.broadcasts.searchRecipients, {
        search: "wayne",
      }),
    ).rejects.toThrow("Platform admin");
  });
  it("bounds results, deduplicates name/email matches and marks unavailable users", async () => {
    const { t, owner } = await setup();
    await t.run(async (ctx) => {
      for (let i = 0; i < 25; i++)
        await ctx.db.insert("users", {
          workosId: `match-${i}`,
          email: `match${i}@example.com`,
          name: "Match Person",
          createdAt: i,
          updatedAt: i,
          emailUpdatesOptOut: true,
        });
    });
    const result = await owner.query(api.broadcasts.searchRecipients, {
      search: "match",
    });
    expect(result.recipients).toHaveLength(20);
    expect(new Set(result.recipients.map((r) => r._id)).size).toBe(20);
    expect(result.hasMore).toBe(true);
    expect(result.recipients.every((r) => !r.eligible && r.reason)).toBe(true);
  });
  it("persists recipient selection, preserves it for legacy edits, and explicitly clears it", async () => {
    const { owner, id } = await setup();
    const broadcastId = await owner.mutation(api.broadcasts.createDraft, {
      ...content,
      recipientId: id,
    });
    await owner.mutation(api.broadcasts.updateDraft, {
      ...content,
      broadcastId,
    });
    expect(
      await owner.query(api.broadcasts.getBroadcast, { broadcastId }),
    ).toMatchObject({ recipientId: id, recipientEmail: owners[0] });
    expect(
      (await owner.query(api.broadcasts.listBroadcasts, {}))[0],
    ).toMatchObject({ recipientId: id, recipientEmail: owners[0] });
    await owner.mutation(api.broadcasts.updateDraft, {
      ...content,
      broadcastId,
      recipientId: null,
    });
    expect(
      (await owner.query(api.broadcasts.getBroadcast, { broadcastId }))
        ?.recipientId,
    ).toBeUndefined();
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
  });
  it("blocks one-person sending in test mode and blocks both bulk entry points", async () => {
    const { t, owner, id } = await setup();
    const broadcastId = await owner.mutation(api.broadcasts.createDraft, {
      ...content,
      recipientId: id,
    });
    await expect(
      owner.mutation(api.broadcasts.sendToRecipient, {
        broadcastId,
        recipientId: id,
        recipientEmail: owners[0],
      }),
    ).rejects.toThrow("test mode");
    vi.stubEnv("RESEND_TEST_MODE", "false");
    await expect(
      owner.mutation(api.broadcasts.sendBroadcast, { broadcastId }),
    ).rejects.toThrow("single-recipient");
    await t.run((ctx) =>
      ctx.db.patch("emailBroadcasts", broadcastId, { status: "sending" }),
    );
    await t.mutation(internal.broadcasts.sendBatch, {
      broadcastId,
      cursor: null,
    });
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").collect(),
      ),
    ).toHaveLength(0);
  });
  it("queues exactly one email once and records delivery and audit rows", async () => {
    vi.stubEnv("RESEND_TEST_MODE", "false");
    const { t, owner, id } = await setup();
    await t.run((ctx) =>
      ctx.db.insert("users", {
        workosId: "other",
        email: owners[1],
        createdAt: 1,
        updatedAt: 1,
      }),
    );
    const broadcastId = await owner.mutation(api.broadcasts.createDraft, {
      ...content,
      recipientId: id,
    });
    const args = { broadcastId, recipientId: id, recipientEmail: owners[0] };
    await owner.mutation(api.broadcasts.sendToRecipient, args);
    await owner.mutation(api.broadcasts.sendToRecipient, args);
    expect(sendBroadcastEmail).toHaveBeenCalledOnce();
    expect(vi.mocked(sendBroadcastEmail).mock.calls[0][1].to).toBe(owners[0]);
    expect(
      await owner.query(api.broadcasts.getBroadcast, { broadcastId }),
    ).toMatchObject({
      recipientCount: 1,
      sentCount: 1,
      delivery: { queued: 1, delivered: 0 },
    });
    expect(await owner.query(api.admin.listAuditLog, {})).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "send_email_to_recipient" }),
      ]),
    );
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").collect(),
      ),
    ).toHaveLength(0);
  });
  it.each([
    { emailUpdatesOptOut: true },
    { emailSuppressed: true },
    { deletionStatus: "pending" as const },
    { deletionStatus: "completed" as const },
  ])("rechecks recipient eligibility before sending %j", async (extra) => {
    vi.stubEnv("RESEND_TEST_MODE", "false");
    const { t, owner, id } = await setup();
    const broadcastId = await owner.mutation(api.broadcasts.createDraft, {
      ...content,
      recipientId: id,
    });
    await t.run((ctx) => ctx.db.patch("users", id, extra));
    // Use the other owner when the chosen recipient is marked for deletion.
    const actorId = await t.run((ctx) =>
      ctx.db.insert("users", {
        workosId: "second-owner",
        email: owners[1],
        createdAt: 1,
        updatedAt: 1,
      }),
    );
    expect(actorId).toBeTruthy();
    const actor = t.withIdentity({
      subject: "second-owner",
      email: owners[1],
      emailVerified: true,
    });
    await expect(
      actor.mutation(api.broadcasts.sendToRecipient, {
        broadcastId,
        recipientId: id,
        recipientEmail: owners[0],
      }),
    ).rejects.toThrow("no longer eligible");
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
  });
  it("rejects changed email, wrong selected account, and accidental all-account drafts", async () => {
    vi.stubEnv("RESEND_TEST_MODE", "false");
    const { t, owner, id } = await setup();
    const broadcastId = await owner.mutation(api.broadcasts.createDraft, {
      ...content,
      recipientId: id,
    });
    await t.run((ctx) =>
      ctx.db.patch("users", id, { email: "changed@example.com" }),
    );
    await expect(
      owner.mutation(api.broadcasts.sendToRecipient, {
        broadcastId,
        recipientId: id,
        recipientEmail: owners[0],
      }),
    ).rejects.toThrow("email changed");
    await expect(
      owner.mutation(api.broadcasts.sendToRecipient, {
        broadcastId,
        recipientId: id,
        recipientEmail: "changed@example.com",
      }),
    ).rejects.toThrow("selected recipient changed");
    const bulk = await owner.mutation(api.broadcasts.createDraft, content);
    await expect(
      owner.mutation(api.broadcasts.sendToRecipient, {
        broadcastId: bulk,
        recipientId: id,
        recipientEmail: owners[0],
      }),
    ).rejects.toThrow("selected recipient changed");
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
  });
  it("rejects unavailable recipient on save, unauthorized send and incomplete setup", async () => {
    const { t, owner, id } = await setup();
    const broadcastId = await owner.mutation(api.broadcasts.createDraft, {
      ...content,
      recipientId: id,
    });
    await expect(
      t.mutation(api.broadcasts.sendToRecipient, {
        broadcastId,
        recipientId: id,
        recipientEmail: owners[0],
      }),
    ).rejects.toThrow("Not authenticated");
    vi.stubEnv("RESEND_TEST_MODE", "false");
    vi.stubEnv("EMAIL_POSTAL_ADDRESS", "");
    await expect(
      owner.mutation(api.broadcasts.sendToRecipient, {
        broadcastId,
        recipientId: id,
        recipientEmail: owners[0],
      }),
    ).rejects.toThrow("incomplete");
    await t.run((ctx) => ctx.db.patch("users", id, { emailSuppressed: true }));
    await expect(
      owner.mutation(api.broadcasts.createDraft, {
        ...content,
        recipientId: id,
      }),
    ).rejects.toThrow("not eligible");
    expect(sendBroadcastEmail).not.toHaveBeenCalled();
  });
});
