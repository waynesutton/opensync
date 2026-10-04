import { query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requirePlatformAdmin } from "./authHelper";

export const isPlatformAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    try {
      await requirePlatformAdmin(ctx);
      return true;
    } catch {
      return false;
    }
  },
});

/** Recent admin audit log entries. Platform admin only. */
export const listAuditLog = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("adminAuditLog"),
      actorEmail: v.optional(v.string()),
      action: v.string(),
      targetType: v.string(),
      targetId: v.string(),
      details: v.optional(v.any()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const entries = await ctx.db.query("adminAuditLog").order("desc").take(100);
    const results: Array<{
      _id: Id<"adminAuditLog">;
      actorEmail?: string;
      action: string;
      targetType: string;
      targetId: string;
      details?: unknown;
      createdAt: number;
    }> = [];
    for (const entry of entries) {
      const actor = await ctx.db.get("users", entry.actorId);
      results.push({
        _id: entry._id,
        actorEmail: actor?.email,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
        createdAt: entry.createdAt,
      });
    }
    return results;
  },
});

// Return actionable access guidance without exposing credentials or other accounts.
export const getAccessStatus = query({
  args: {},
  returns: v.object({ allowed: v.boolean(), message: v.optional(v.string()) }),
  handler: async ctx => {
    try { await requirePlatformAdmin(ctx); return { allowed: true }; }
    catch (error) {
      return { allowed: false, message: error instanceof ConvexError && typeof error.data === "string" ? error.data : "Unable to check admin access. Please try again." };
    }
  },
});
