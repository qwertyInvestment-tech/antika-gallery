import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { listCustomers } from "@/server/services/account-service";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = await listCustomers();

  return (
    <AdminShell title="Корисници">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-[0.68rem] uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-3">Име</th>
              <th className="pb-3">Е-пошта</th>
              <th className="pb-3">Телефон</th>
              <th className="pb-3">Создадено</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <Link href={`/admin/customers/${customer.id}`} className="underline underline-offset-4">
                    {customer.name}
                  </Link>
                </td>
                <td className="py-3 pr-3">{customer.email}</td>
                <td className="py-3 pr-3">{customer.phone || "—"}</td>
                <td className="py-3">{customer.createdAt.toLocaleDateString("mk-MK")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 ? <p className="mt-6 text-muted">Нема регистрирани купувачи.</p> : null}
      </div>
    </AdminShell>
  );
}
