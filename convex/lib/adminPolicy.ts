// Only these authenticated accounts administer this OpenSync instance.
const PLATFORM_ADMIN_EMAILS: ReadonlySet<string> = new Set([
  "wayne@socialwayne.com",
  "wayne@convex.dev",
]);

export function isPlatformAdminEmail(email: string | undefined): boolean {
  return (
    typeof email === "string" &&
    PLATFORM_ADMIN_EMAILS.has(email.trim().toLowerCase())
  );
}
