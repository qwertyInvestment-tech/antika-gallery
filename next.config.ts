import type { NextConfig } from "next";
import { routeRewrites } from "./src/lib/i18n/routes";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    // Images may still use Server Actions up to 30 MB (+ multipart overhead).
    // Videos (≤200 MB) use /api/admin/media/upload; proxy body buffer must allow this.
    serverActions: {
      bodySizeLimit: "32mb",
    },
    proxyClientMaxBodySize: "210mb",
  },
  async rewrites() {
    return [...routeRewrites];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    localPatterns: [
      { pathname: "/mock/**" },
      { pathname: "/media/**" },
      { pathname: "/api/media/**" },
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
