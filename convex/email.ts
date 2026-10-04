// Shared Resend email component instance and app email senders.
// Emails are queued, batched, and retried durably by @convex-dev/resend.
// Env vars: RESEND_API_KEY, RESEND_WEBHOOK_SECRET, RESEND_FROM_EMAIL,
// RESEND_TEST_MODE ("false" to send real email), SITE_URL for links.
import { Resend, vOnEmailEventArgs } from "@convex-dev/resend";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { components, internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

// Test mode is the safe default: only Resend test addresses receive mail.
// Opt into production delivery by setting RESEND_TEST_MODE=false.
export const resend: Resend = new Resend(components.resend, {
  testMode: process.env.RESEND_TEST_MODE !== "false",
  onEmailEvent: internal.email.handleEmailEvent,
});

// Default sender; must be a verified domain in Resend for production.
function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "OpenSync <onboarding@resend.dev>";
}

// Convex HTTP actions domain (.convex.site) hosting /unsubscribe
function convexSiteUrl(): string {
  return process.env.CONVEX_SITE_URL ?? "";
}

// Escape user-provided text before interpolating into the HTML template
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send a product update broadcast email with an unsubscribe footer and
 * List-Unsubscribe headers (Gmail/Yahoo bulk sender requirement).
 * Returns the Resend component email id for webhook correlation.
 */
export async function sendBroadcastEmail(
  ctx: MutationCtx,
  args: {
    to: string;
    subject: string;
    bodyText: string;
    unsubscribeToken: string;
  },
): Promise<string> {
  const unsubscribeUrl = `${convexSiteUrl()}/unsubscribe?token=${args.unsubscribeToken}`;
  // CAN-SPAM requires a physical postal address in commercial email
  const postalAddress = process.env.EMAIL_POSTAL_ADDRESS;

  // Render plain text paragraphs into the same minimal HTML style as invites
  const paragraphs = args.bodyText
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block.trim()).replace(/\n/g, "<br />"))
    .filter((block) => block.length > 0)
    .map(
      (block) =>
        `<p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">${block}</p>`,
    )
    .join("\n");

  const emailId = await resend.sendEmail(ctx, {
    from: fromAddress(),
    to: args.to,
    subject: args.subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px; color: #18181b;">
        <h2 style="font-size: 18px; margin: 0 0 16px;">${escapeHtml(args.subject)}</h2>
        ${paragraphs}
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px;" />
        <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 0;">
          You're receiving this because you have an OpenSync account.
          <a href="${unsubscribeUrl}" style="color: #71717a;">Unsubscribe</a> from product updates.
          ${postalAddress ? `<br />${escapeHtml(postalAddress)}` : ""}
        </p>
      </div>
    `,
    text: `${args.bodyText}\n\n---\nYou're receiving this because you have an OpenSync account.\nUnsubscribe: ${unsubscribeUrl}${postalAddress ? `\n${postalAddress}` : ""}`,
    headers: [
      { name: "List-Unsubscribe", value: `<${unsubscribeUrl}>` },
      { name: "List-Unsubscribe-Post", value: "List-Unsubscribe=One-Click" },
    ],
  });
  return emailId;
}

/**
 * Webhook-driven email lifecycle events from Resend.
 * Updates the matching broadcast send's delivery status.
 * Bounces and complaints suppress the user from future broadcasts.
 */
export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    // Broadcast sends: track status and suppress on bounce or complaint
    const send = await ctx.db
      .query("emailBroadcastSends")
      .withIndex("by_emailid", (q) => q.eq("emailId", args.id))
      .first();
    if (!send) {
      return null;
    }
    // Webhooks may arrive out of order. Never turn delivered or suppressed
    // mail back into "sent" when a delayed earlier event arrives.
    const priority: Record<string, number> = {
      queued: 0,
      "email.sent": 1,
      "email.delivery_delayed": 1,
      "email.delivered": 2,
      "email.opened": 3,
      "email.clicked": 3,
      failed: 4,
      "email.failed": 4,
      "email.bounced": 4,
      "email.complained": 4,
      "email.suppressed": 4,
    };
    if ((priority[args.event.type] ?? 0) >= (priority[send.status] ?? 0)) {
      await ctx.db.patch("emailBroadcastSends", send._id, {
        status: args.event.type,
      });
    }
    if (
      args.event.type === "email.bounced" ||
      args.event.type === "email.complained"
    ) {
      const user = await ctx.db.get("users", send.userId);
      if (user && !user.emailSuppressed) {
        await ctx.db.patch("users", send.userId, { emailSuppressed: true });
      }
    }
    return null;
  },
});
