export const USER_ROLES = ["SUPER_ADMIN", "ADMIN", "CUSTOMER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export function isAdminRole(role: string): role is UserRole {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}
