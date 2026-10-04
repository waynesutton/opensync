// Product update email broadcasts: composed on /admin, sent to all opted-in
// accounts through the @convex-dev/resend component. The component handles
// queueing, rate limits, and durable retries; sendBatch only enqueues.
import { v, ConvexError } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireAuthUser, requirePlatformAdmin } from "./authHelper";
import { sendBroadcastEmail } from "./email";

// Users enqueued per sendBatch run before self-scheduling the next batch
const BATCH_SIZE = 50;
const PREVIEW_LIMIT = 1000;

// Share validation across create, edit and send so direct API calls are safe too.
function validateContent(subjectInput: string, bodyInput: string) {
  const subject = subjectInput.trim();
  const bodyText = bodyInput.trim();
  if (!subject || !bodyText)
    throw new ConvexError("Subject and body are required");
  if (subject.length > 200 || /[\r\n]/.test(subject)) {
    throw new ConvexError(
      "Subject must be one line and at most 200 characters",
    );
  }
  if (bodyText.length > 50000)
    throw new ConvexError("Body must be at most 50,000 characters");
  return { subject, bodyText };
}

function emailConfiguration() {
  const testMode = process.env.RESEND_TEST_MODE !== "false";
  const missing: string[] = [];
  for (const key of [
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "RESEND_WEBHOOK_SECRET",
    "EMAIL_POSTAL_ADDRESS",
  ]) {
    if (!process.env[key]?.trim()) missing.push(key);
  }
  try {
    const url = new URL(process.env.CONVEX_SITE_URL ?? "");
    if (url.protocol !== "https:")
      missing.push("CONVEX_SITE_URL (HTTPS required)");
  } catch {
    missing.push("CONVEX_SITE_URL");
  }
  return { testMode, missing, canSend: !testMode && missing.length === 0 };
}

function requireEmailReady() {
  const config = emailConfiguration();
  if (config.testMode) {
    throw new ConvexError(
      "Email sending is disabled while Resend test mode is on. Drafts and previews remain available.",
    );
  }
  if (config.missing.length) {
    throw new ConvexError(
      `Email setup is incomplete: ${config.missing.join(", ")}`,
    );
  }
}

function generateUnsubscribeToken(): string {
  // 32 bytes of randomness, hex encoded (Convex runtime supports crypto)
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Is this user eligible to receive a broadcast? */
function isEligibleRecipient(user: Doc<"users">): boolean {
  if (!user.email?.trim()) return false;
  if (user.emailUpdatesOptOut) return false;
  if (user.emailSuppressed) return false;
  // Skip accounts mid-deletion
  if (
    user.deletionStatus === "pending" ||
    user.deletionStatus === "in_progress" ||
    user.deletionStatus === "completed"
  ) {
    return false;
  }
  return true;
}

/** Write an admin audit log entry (same shape as convex/admin.ts). */
async function logAdminAction(
  ctx: MutationCtx,
  args: {
    actorId: Id<"users">;
    action: string;
    targetType: string;
    targetId: string;
    details?: unknown;
  },
): Promise<void> {
  await ctx.db.insert("adminAuditLog", {
    actorId: args.actorId,
    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId,
    details: args.details,
    createdAt: Date.now(),
  });
}

const broadcastStatus = v.union(
  v.literal("draft"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("failed"),
);

/** Recent broadcasts, newest first. Platform admin only. */
export const listBroadcasts = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("emailBroadcasts"),
      recipientId: v.optional(v.id("users")),
      recipientEmail: v.optional(v.string()),
      subject: v.string(),
      status: broadcastStatus,
      recipientCount: v.optional(v.number()),
      sentCount: v.optional(v.number()),
      failedCount: v.optional(v.number()),
      error: v.optional(v.string()),
      createdAt: v.number(),
      sentAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const broadcasts = await ctx.db
      .query("emailBroadcasts")
      .order("desc")
      .take(50);
    return broadcasts.map((b) => ({
      _id: b._id,
      recipientId: b.recipientId,
      recipientEmail: b.recipientEmail,
      subject: b.subject,
      status: b.status,
      recipientCount: b.recipientCount,
      sentCount: b.sentCount,
      failedCount: b.failedCount,
      error: b.error,
      createdAt: b.createdAt,
      sentAt: b.sentAt,
    }));
  },
});

/** Full broadcast detail including body. Platform admin only. */
export const getBroadcast = query({
  args: { broadcastId: v.id("emailBroadcasts") },
  returns: v.union(
    v.object({
      _id: v.id("emailBroadcasts"),
      recipientId: v.optional(v.id("users")),
      recipientEmail: v.optional(v.string()),
      subject: v.string(),
      bodyText: v.string(),
      status: broadcastStatus,
      recipientCount: v.optional(v.number()),
      sentCount: v.optional(v.number()),
      failedCount: v.optional(v.number()),
      error: v.optional(v.string()),
      createdAt: v.number(),
      sentAt: v.optional(v.number()),
      delivery: v.object({
        queued: v.number(),
        delivered: v.number(),
        failed: v.number(),
        pending: v.number(),
        isExact: v.boolean(),
      }),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const b = await ctx.db.get("emailBroadcasts", args.broadcastId);
    if (!b) return null;
    const sends = await ctx.db
      .query("emailBroadcastSends")
      .withIndex("by_broadcastid", (q) => q.eq("broadcastId", b._id))
      .take(PREVIEW_LIMIT + 1);
    const sample = sends.slice(0, PREVIEW_LIMIT);
    const failed = sample.filter((s) =>
      [
        "failed",
        "email.failed",
        "email.bounced",
        "email.complained",
        "email.suppressed",
      ].includes(s.status),
    ).length;
    const delivered = sample.filter((s) =>
      ["email.delivered", "email.opened", "email.clicked"].includes(s.status),
    ).length;
    const queued = sample.filter((s) => s.status === "queued").length;
    return {
      _id: b._id,
      recipientId: b.recipientId,
      recipientEmail: b.recipientEmail,
      subject: b.subject,
      bodyText: b.bodyText,
      status: b.status,
      recipientCount: b.recipientCount,
      sentCount: b.sentCount,
      failedCount: b.failedCount,
      error: b.error,
      createdAt: b.createdAt,
      sentAt: b.sentAt,
      delivery: {
        queued,
        delivered,
        failed,
        pending: sample.length - failed - delivered - queued,
        isExact: sends.length <= PREVIEW_LIMIT,
      },
    };
  },
});

/**
 * Count of users who would receive a broadcast right now.
 * Shown as the recipient preview on the compose form. Platform admin only.
 */
export const recipientCount = query({
  args: {},
  returns: v.object({ count: v.number(), isExact: v.boolean() }),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const users = await ctx.db.query("users").take(PREVIEW_LIMIT + 1);
    return {
      count: users.slice(0, PREVIEW_LIMIT).filter(isEligibleRecipient).length,
      isExact: users.length <= PREVIEW_LIMIT,
    };
  },
});

/** Readiness and the authenticated test recipient, without exposing secrets. */
export const getEmailConfiguration = query({
  args: {},
  returns: v.object({
    testMode: v.boolean(),
    missing: v.array(v.string()),
    canSend: v.boolean(),
    testRecipient: v.string(),
  }),
  handler: async (ctx) => {
    const { identity } = await requirePlatformAdmin(ctx);
    return {
      ...emailConfiguration(),
      testRecipient: identity.email!.trim().toLowerCase(),
    };
  },
});

/**
 * Whether Resend test mode is active (RESEND_TEST_MODE not "false").
 * The admin UI shows a banner while test mode is on. Platform admin only.
 */
export const emailTestMode = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    return process.env.RESEND_TEST_MODE !== "false";
  },
});

/** Create a new draft broadcast. Platform admin only. */
export const createDraft = mutation({
  args: {
    subject: v.string(),
    bodyText: v.string(),
    recipientId: v.optional(v.union(v.id("users"), v.null())),
  },
  returns: v.id("emailBroadcasts"),
  handler: async (ctx, args) => {
    const { user } = await requirePlatformAdmin(ctx);
    const { subject, bodyText } = validateContent(args.subject, args.bodyText);
    const now = Date.now();
    const recipient = await draftRecipient(ctx, args.recipientId);
    return await ctx.db.insert("emailBroadcasts", {
      ...recipient,
      subject,
      bodyText,
      status: "draft" as const,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Update a draft's subject or body. Draft status only. Platform admin only. */
export const updateDraft = mutation({
  args: {
    broadcastId: v.id("emailBroadcasts"),
    recipientId: v.optional(v.union(v.id("users"), v.null())),
    subject: v.string(),
    bodyText: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const broadcast = await ctx.db.get("emailBroadcasts", args.broadcastId);
    if (!broadcast) throw new ConvexError("Broadcast not found");
    if (broadcast.status !== "draft") {
      throw new ConvexError("Only drafts can be edited");
    }
    const content = validateContent(args.subject, args.bodyText);
    const recipient =
      args.recipientId === undefined
        ? {}
        : await draftRecipient(ctx, args.recipientId);
    await ctx.db.patch("emailBroadcasts", args.broadcastId, {
      ...recipient,
      ...content,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Delete a draft. Draft status only. Platform admin only. */
export const deleteDraft = mutation({
  args: { broadcastId: v.id("emailBroadcasts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const broadcast = await ctx.db.get("emailBroadcasts", args.broadcastId);
    if (!broadcast) return null; // Idempotent: already gone
    if (broadcast.status !== "draft") {
      throw new ConvexError("Only drafts can be deleted");
    }
    await ctx.db.delete("emailBroadcasts", args.broadcastId);
    return null;
  },
});

/** Send a draft to the calling admin's own email only. Platform admin only. */
export const sendTest = mutation({
  args: { broadcastId: v.id("emailBroadcasts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user, identity } = await requirePlatformAdmin(ctx);
    requireEmailReady();
    const broadcast = await ctx.db.get("emailBroadcasts", args.broadcastId);
    if (!broadcast) throw new ConvexError("Broadcast not found");
    if (broadcast.status !== "draft")
      throw new ConvexError("Only drafts can be tested");
    validateContent(broadcast.subject, broadcast.bodyText);

    // Lazily create the admin's unsubscribe token so the footer link works
    let token = user.unsubscribeToken;
    if (!token) {
      token = generateUnsubscribeToken();
      await ctx.db.patch("users", user._id, { unsubscribeToken: token });
    }

    await sendBroadcastEmail(ctx, {
      to: identity.email!.trim().toLowerCase(),
      subject: `[Test] ${broadcast.subject}`,
      bodyText: broadcast.bodyText,
      unsubscribeToken: token,
    });
    await logAdminAction(ctx, {
      actorId: user._id,
      action: "test_email_broadcast",
      targetType: "emailBroadcast",
      targetId: args.broadcastId,
      details: { recipient: identity.email!.trim().toLowerCase() },
    });
    return null;
  },
});

/**
 * Kick off a broadcast to all opted-in accounts. Idempotent: only a draft
 * can start sending. Writes an audit log row and schedules the first batch.
 */
export const sendBroadcast = mutation({
  args: { broadcastId: v.id("emailBroadcasts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requirePlatformAdmin(ctx);
    const broadcast = await ctx.db.get("emailBroadcasts", args.broadcastId);
    if (!broadcast) throw new ConvexError("Broadcast not found");
    if (broadcast.recipientId)
      throw new ConvexError(
        "Use the single-recipient send action for this draft",
      );
    // Idempotent early return: already sending or done
    if (broadcast.status !== "draft") return null;
    requireEmailReady();
    validateContent(broadcast.subject, broadcast.bodyText);

    await ctx.db.patch("emailBroadcasts", args.broadcastId, {
      status: "sending" as const,
      sentCount: 0,
      failedCount: 0,
      recipientCount: 0,
      updatedAt: Date.now(),
    });

    await logAdminAction(ctx, {
      actorId: user._id,
      action: "send_email_broadcast",
      targetType: "emailBroadcast",
      targetId: args.broadcastId,
      details: { subject: broadcast.subject },
    });

    await ctx.scheduler.runAfter(0, internal.broadcasts.sendBatch, {
      broadcastId: args.broadcastId,
      cursor: null,
    });
    return null;
  },
});

/**
 * Enqueue one batch of broadcast emails, then self-schedule the next batch.
 * Pages through users with a cursor. The Resend component owns delivery,
 * batching, rate limits, and retries; this only enqueues and records rows.
 */
export const sendBatch = internalMutation({
  args: {
    broadcastId: v.id("emailBroadcasts"),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const broadcast = await ctx.db.get("emailBroadcasts", args.broadcastId);
    if (!broadcast) return null;
    if (broadcast.recipientId) return null; // Never fan out a one-person draft.
    // Only proceed while sending (guards against stale scheduled runs)
    if (broadcast.status !== "sending") return null;
    // Stop safely if delivery is disabled between scheduled batches.
    const config = emailConfiguration();
    if (!config.canSend) {
      await ctx.db.patch("emailBroadcasts", broadcast._id, {
        status: "failed",
        error:
          "Email sending was disabled or its configuration became incomplete.",
        updatedAt: Date.now(),
      });
      return null;
    }

    const page = await ctx.db.query("users").paginate({
      numItems: BATCH_SIZE,
      cursor: args.cursor,
    });

    let enqueued = 0;
    let failed = 0;
    for (const user of page.page) {
      if (!isEligibleRecipient(user)) continue;

      // Retry safety: skip users who already have a send row
      const existingSend = await ctx.db
        .query("emailBroadcastSends")
        .withIndex("by_broadcastid_and_userid", (q) =>
          q.eq("broadcastId", args.broadcastId).eq("userId", user._id),
        )
        .first();
      if (existingSend) continue;

      // Lazily create the unsubscribe token used in the footer link
      let token = user.unsubscribeToken;
      if (!token) {
        token = generateUnsubscribeToken();
        await ctx.db.patch("users", user._id, { unsubscribeToken: token });
      }

      try {
        const emailId = await sendBroadcastEmail(ctx, {
          to: user.email!,
          subject: broadcast.subject,
          bodyText: broadcast.bodyText,
          unsubscribeToken: token,
        });
        await ctx.db.insert("emailBroadcastSends", {
          broadcastId: args.broadcastId,
          userId: user._id,
          emailId,
          status: "queued",
        });
        enqueued += 1;
      } catch (err) {
        await ctx.db.insert("emailBroadcastSends", {
          broadcastId: args.broadcastId,
          userId: user._id,
          status: "failed",
        });
        failed += 1;
        console.error(
          `Broadcast ${args.broadcastId}: failed to enqueue for user ${user._id}`,
          err,
        );
      }
    }

    const now = Date.now();
    if (page.isDone) {
      // Legacy "sent" means queueing finished; delivery comes from webhooks.
      const totalQueued = (broadcast.sentCount ?? 0) + enqueued;
      const totalFailed = (broadcast.failedCount ?? 0) + failed;
      await ctx.db.patch("emailBroadcasts", args.broadcastId, {
        status: totalQueued === 0 && totalFailed > 0 ? "failed" : "sent",
        error:
          totalQueued === 0 && totalFailed > 0
            ? "No messages could be queued."
            : undefined,
        sentCount: totalQueued,
        failedCount: totalFailed,
        recipientCount: (broadcast.recipientCount ?? 0) + enqueued + failed,
        sentAt: now,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.patch("emailBroadcasts", args.broadcastId, {
      sentCount: (broadcast.sentCount ?? 0) + enqueued,
      failedCount: (broadcast.failedCount ?? 0) + failed,
      recipientCount: (broadcast.recipientCount ?? 0) + enqueued + failed,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.broadcasts.sendBatch, {
      broadcastId: args.broadcastId,
      cursor: page.continueCursor,
    });
    return null;
  },
});

/** Bounded name/email search. No recipient details are exposed to non-owners. */
export const searchRecipients = query({
  args: { search: v.string() },
  returns: v.object({
    recipients: v.array(
      v.object({
        _id: v.id("users"),
        email: v.string(),
        name: v.optional(v.string()),
        eligible: v.boolean(),
        reason: v.optional(v.string()),
      }),
    ),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const search = args.search.trim().toLowerCase();
    if (search.length < 2 || !/[\p{L}\p{N}]/u.test(search))
      return { recipients: [], hasMore: false };
    if (
      search.length > 254 ||
      search.split(/[^\p{L}\p{N}]+/u).filter(Boolean).length > 16
    )
      throw new ConvexError("Use a shorter name or email search");
    // Exact addresses must not fan out to every token match for a common domain.
    const exact = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", search))
      .take(21);
    const emailSearch = search.includes("@");
    const [emails, names] = exact.length
      ? [[], []]
      : await Promise.all([
          ctx.db
            .query("users")
            .withSearchIndex("search_email", (q) =>
              q.search(
                "email",
                emailSearch ? search.split("@")[0] || search : search,
              ),
            )
            .take(21),
          emailSearch
            ? Promise.resolve([])
            : ctx.db
                .query("users")
                .withSearchIndex("search_name", (q) => q.search("name", search))
                .take(21),
        ]);
    const unique = [
      ...new Map(
        [...exact, ...emails, ...names]
          .filter(
            (user) =>
              !emailSearch || user.email?.toLowerCase().includes(search),
          )
          .map((user) => [user._id, user]),
      ).values(),
    ];
    return {
      recipients: unique.slice(0, 20).map((user) => ({
        _id: user._id,
        email: user.email ?? "",
        name: user.name,
        eligible: isEligibleRecipient(user),
        reason: isEligibleRecipient(user)
          ? undefined
          : "Unavailable: unsubscribed, suppressed, inactive, or no email",
      })),
      hasMore:
        unique.length > 20 ||
        emails.length > 20 ||
        names.length > 20 ||
        exact.length > 20,
    };
  },
});

// Recipient IDs choose an audience, never authorize the caller.
async function draftRecipient(
  ctx: MutationCtx,
  recipientId?: Id<"users"> | null,
) {
  if (!recipientId)
    return { recipientId: undefined, recipientEmail: undefined };
  const recipient = await ctx.db.get("users", recipientId);
  if (!recipient || !isEligibleRecipient(recipient))
    throw new ConvexError(
      "This account is not eligible for product update emails",
    );
  return { recipientId, recipientEmail: recipient.email!.trim() };
}

/** Queue exactly the draft's selected account. Transactional and retry safe. */
export const sendToRecipient = mutation({
  args: {
    broadcastId: v.id("emailBroadcasts"),
    recipientId: v.id("users"),
    recipientEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user: admin } = await requirePlatformAdmin(ctx);
    const draft = await ctx.db.get("emailBroadcasts", args.broadcastId);
    if (!draft) throw new ConvexError("Draft not found");
    if (
      !draft.recipientId ||
      draft.recipientId !== args.recipientId ||
      draft.recipientEmail !== args.recipientEmail
    )
      throw new ConvexError(
        "The selected recipient changed. Reopen and review this draft.",
      );
    if (draft.status !== "draft") return null;
    requireEmailReady();
    validateContent(draft.subject, draft.bodyText);
    const recipient = await ctx.db.get("users", draft.recipientId);
    if (!recipient || !isEligibleRecipient(recipient))
      throw new ConvexError(
        "This account is no longer eligible for product update emails",
      );
    if (recipient.email!.trim() !== draft.recipientEmail)
      throw new ConvexError(
        "The recipient email changed. Select the account again and review the new address.",
      );
    let token = recipient.unsubscribeToken;
    if (!token) {
      token = generateUnsubscribeToken();
      await ctx.db.patch("users", recipient._id, { unsubscribeToken: token });
    }
    const emailId = await sendBroadcastEmail(ctx, {
      to: draft.recipientEmail,
      subject: draft.subject,
      bodyText: draft.bodyText,
      unsubscribeToken: token,
    });
    await ctx.db.insert("emailBroadcastSends", {
      broadcastId: draft._id,
      userId: recipient._id,
      emailId,
      status: "queued",
    });
    const now = Date.now();
    await ctx.db.patch("emailBroadcasts", draft._id, {
      status: "sent",
      recipientCount: 1,
      sentCount: 1,
      failedCount: 0,
      updatedAt: now,
      sentAt: now,
    });
    await logAdminAction(ctx, {
      actorId: admin._id,
      action: "send_email_to_recipient",
      targetType: "emailBroadcast",
      targetId: draft._id,
      details: {
        recipientId: recipient._id,
        recipientEmail: draft.recipientEmail,
        subject: draft.subject,
      },
    });
    return null;
  },
});

/**
 * Signed-in preference toggle for product update emails (Settings page).
 * Not admin gated: any user can manage their own preference.
 */
export const setEmailUpdatesOptOut = mutation({
  args: { optOut: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireAuthUser(ctx);
    // Idempotent early return when already in the desired state
    if ((user.emailUpdatesOptOut ?? false) === args.optOut) return null;
    await ctx.db.patch("users", user._id, {
      emailUpdatesOptOut: args.optOut,
      emailUpdatesOptOutAt: args.optOut ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Current user's opt-out state for the Settings toggle. */
export const getEmailUpdatesOptOut = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .unique();
    return user?.emailUpdatesOptOut ?? false;
  },
});

/**
 * Public unsubscribe by token (no auth: recipients may be signed out).
 * Called from the /unsubscribe HTTP route. Idempotent.
 */
export const unsubscribeByToken = internalMutation({
  args: { token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!args.token) return false;
    const user = await ctx.db
      .query("users")
      .withIndex("by_unsubscribetoken", (q) =>
        q.eq("unsubscribeToken", args.token),
      )
      .first();
    if (!user) return false;
    if (user.emailUpdatesOptOut) return true; // Already opted out
    await ctx.db.patch("users", user._id, {
      emailUpdatesOptOut: true,
      emailUpdatesOptOutAt: Date.now(),
      updatedAt: Date.now(),
    });
    return true;
  },
});
