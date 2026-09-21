import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { inquiryAdminStatuses, inquiryStatusLabels } from "@/lib/domain/inquiry-status";
import { listInquiries } from "@/server/services/inquiry-service";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const statusRaw = typeof params.status === "string" ? params.status : "";
  const status = inquiryAdminStatuses.find((value) => value === statusRaw);
  const inquiries = await listInquiries({ q, status });

  return (
    <AdminShell title="Барања за предмети">
      <form className="mb-8 grid gap-3 border border-line p-4 md:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="Име, е-пошта, референца" className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          <option value="">Сите статуси</option>
          {inquiryAdminStatuses.map((value) => (
            <option key={value} value={value}>
              {inquiryStatusLabels[value]}
            </option>
          ))}
        </select>
        <button type="submit" className="border border-ink px-3 py-2 text-[0.72rem] uppercase tracking-wider">
          Филтрирај
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="text-[0.68rem] uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-3">Име</th>
              <th className="pb-3">Е-пошта</th>
              <th className="pb-3">Телефон</th>
              <th className="pb-3">Предмет</th>
              <th className="pb-3">Порака</th>
              <th className="pb-3">Статус</th>
              <th className="pb-3">Датум</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <Link href={`/admin/inquiries/${inquiry.id}`} className="underline underline-offset-4">
                    {inquiry.name}
                  </Link>
                </td>
                <td className="py-3 pr-3">{inquiry.email}</td>
                <td className="py-3 pr-3">{inquiry.phone || "—"}</td>
                <td className="py-3 pr-3">
                  {inquiry.item ? `${inquiry.item.referenceNumber} · ${inquiry.item.title}` : "Општа порака"}
                </td>
                <td className="py-3 pr-3">{inquiry.message.slice(0, 80)}{inquiry.message.length > 80 ? "…" : ""}</td>
                <td className="py-3 pr-3">{inquiryStatusLabels[inquiry.status]}</td>
                <td className="py-3">{inquiry.createdAt.toLocaleDateString("mk-MK")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {inquiries.length === 0 ? <p className="mt-6 text-muted">Нема барања за овој филтер.</p> : null}
      </div>
    </AdminShell>
  );
}
