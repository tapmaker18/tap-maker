export const SUPER_ADMIN_EMAIL = "adriancalicdan2@gmail.com";
export const SUPER_ADMIN_ROLE = "super_admin" as const;

export function isSuperAdminEmail(email?: string | null): boolean {
  return email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}
