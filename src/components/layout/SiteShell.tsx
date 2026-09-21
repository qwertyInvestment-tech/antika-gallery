import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { FavoritesMerger } from "@/components/customer/FavoritesMerger";
import { SiteFrame } from "@/components/layout/SiteFrame";

export async function SiteShell({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  return (
    <SiteFrame user={user}>
      <FavoritesMerger enabled={Boolean(user)} />
      {children}
    </SiteFrame>
  );
}
