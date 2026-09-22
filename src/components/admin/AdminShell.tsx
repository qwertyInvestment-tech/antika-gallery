import type { ReactNode } from "react";
import { AdminShellLayout } from "@/components/admin/AdminShellLayout";

export function AdminShell({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <AdminShellLayout title={title} actions={actions}>
      {children}
    </AdminShellLayout>
  );
}
