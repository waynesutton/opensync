import { ConvexError } from "convex/values";
import type { Auth, UserIdentity } from "convex/server";
import type { QueryCtx } from "./_generated/server";
import { isPlatformAdminEmail } from "./lib/adminPolicy";

/**
 * Shared auth helper: validates identity only (no user lookup).
 * Accepts any ctx with auth (query, mutation, or action).
 * Throws ConvexError if not authenticated. Returns the identity object.
 */
export async function requireAuth(ctx: { auth: Auth }): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  return identity;
}

/**
 * Soft auth: returns identity or null without throwing.
 * Accepts any ctx with auth (query, mutation, or action).
 * Use for intentionally public endpoints that optionally benefit from auth.
 */
export async function softAuth(ctx: {
  auth: Auth;
}): Promise<UserIdentity | null> {
  return await ctx.auth.getUserIdentity();
}

/**
 * Shared auth helper: validates identity and looks up the user record.
 * Throws ConvexError if not authenticated or user not found.
 */
export async function requireAuthUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
    .unique();
  if (!user) throw new ConvexError("User not found");

  return { identity, user };
}

/**
 * Use the signed identity's current email, never a client argument or a
 * previously granted database role. Missing or unverified email claims fail
 * closed; WorkOS must include email and email_verified in its signed token.
 */
export async function requirePlatformAdmin(ctx: QueryCtx) {
  const { identity, user } = await requireAuthUser(ctx);
  // Custom JWT providers preserve snake_case claims; OIDC providers normalize them.
  const emailVerified = identity.emailVerified ?? identity["email_verified"];
  if (
    !isPlatformAdminEmail(identity.email) ||
    user.deletionStatus === "pending" ||
    user.deletionStatus === "in_progress" ||
    user.deletionStatus === "completed"
  ) {
    throw new ConvexError("Platform admin access required");
  }
  if (emailVerified !== true) {
    throw new ConvexError(emailVerified === false
      ? "Your owner email is not verified. Verify it with your sign-in provider."
      : "Your session is missing the verified-email claim. Sign out and sign in again.");
  }
  return { identity, user };
}
