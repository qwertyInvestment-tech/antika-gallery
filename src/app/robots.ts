import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { publicPaths } from "@/lib/i18n/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        publicPaths.profile,
        `${publicPaths.myOrders}/`,
        publicPaths.myOrders,
        publicPaths.myReservations,
        publicPaths.login,
        publicPaths.register,
        publicPaths.favorites,
        "/prijava",
        "/registracija",
        "/moj-profil",
        "/moite-naracki",
        "/moite-rezervacii",
        "/omileni",
      ],
    },
    sitemap: new URL("/sitemap.xml", env.APP_URL).toString(),
  };
}
