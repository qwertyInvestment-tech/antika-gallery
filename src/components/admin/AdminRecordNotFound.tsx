import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

export function AdminRecordNotFound({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <AdminShell title={title}>
      <p className="max-w-xl text-muted">{message}</p>
      <p className="mt-8">
        <Link href="/admin" className="text-[0.72rem] uppercase tracking-wider underline underline-offset-4">
          Назад кон таблата
        </Link>
      </p>
    </AdminShell>
  );
}
