import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { publicPaths } from "@/lib/i18n/routes";
import { redirect } from "@/lib/i18n/redirect";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || !isAdminRole(user.role)) {
    redirect(publicPaths.login);
  }
  return children;
}
