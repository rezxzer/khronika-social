/**
 * Server-only admin check. Reads ADMIN_USER_IDS (not NEXT_PUBLIC).
 * Import ONLY in server components, route handlers, or middleware.
 */

const adminIds: string[] = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export function isAdminServer(userId: string | undefined): boolean {
  if (!userId) return false;
  return adminIds.includes(userId);
}
