"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { SessionUser } from "@/lib/auth/session-token";

export function SiteFrame({
  children,
  user = null,
}: {
  children: ReactNode;
  user?: SessionUser | null;
}) {
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#содржина"
        className="sr-only focus:not-sr-only focus:absolute focus:left-5 focus:top-5 focus:z-50 focus:bg-ivory focus:px-3 focus:py-2"
      >
        Прескокни кон содржината
      </a>
      <Header user={user} />
      <main id="содржина" className={`flex-1 ${isHome ? "" : "pt-[4.75rem] lg:pt-[5.5rem]"}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
