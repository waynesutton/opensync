// Admin-only delivery check. The recipient is restricted to the owner's approved address.
// This explicit test sends one real email; it does not change RESEND_TEST_MODE.
import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const sendEmailTest = internalMutation({
  args: { recipient: v.literal("wayne@socialwayne.com") },
  returns: v.string(),
  handler: async (ctx, { recipient }) => {
    const sender = new Resend(components.resend, { testMode: false });
    return await sender.sendEmail(ctx, {
      from: process.env.RESEND_FROM_EMAIL ?? "OpenSync <updates@notifications.opensync.dev>",
      to: recipient,
      subject: "OpenSync Convex hosting migration — delivery test",
      text: "OpenSync is now served by the Convex static-hosting component at https://www.opensync.dev. This single requested test checks production Resend delivery after the migration. Routine application email remains in test mode. Netlify is disabled and retained for the seven-day rollback window.",
    });
  },
});
