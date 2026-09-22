import { publicPaths } from "@/lib/i18n/routes";

export type AdminNavLink = {
  href: string;
  label: string;
  exact?: boolean;
  external?: boolean;
};

export const adminNavLinks: AdminNavLink[] = [
  { href: "/admin", label: "Табла", exact: true },
  { href: "/admin/items", label: "Предмети" },
  { href: "/admin/inquiries", label: "Барања" },
  { href: "/admin/reservations", label: "Резервации" },
  { href: "/admin/orders", label: "Нарачки" },
  { href: "/admin/requests", label: "Побарано" },
  { href: "/admin/customers", label: "Корисници" },
  { href: publicPaths.home, label: "Јавна страна", external: true },
];
