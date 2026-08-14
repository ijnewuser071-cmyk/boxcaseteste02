export const PRIMARY_ADMIN_USER_ID = "9f2d2416-247f-4cfe-ac95-419375b102d6";

export function hasAdminAccess(userId: string, role?: string | null) {
  return userId === PRIMARY_ADMIN_USER_ID && role === "admin";
}
