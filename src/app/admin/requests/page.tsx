import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requestAdminStatuses, requestStatusLabels } from "@/lib/domain/request-status";
import { listWantedRequests } from "@/server/services/request-service";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const statusRaw = typeof params.status === "string" ? params.status : "";
  const status = requestAdminStatuses.find((value) => value === statusRaw);
  const requests = await listWantedRequests({ q, status });

  return (
    <AdminShell title="Барања за пронаоѓање">
      <form className="mb-8 grid gap-3 border border-line p-4 md:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="Име, е-пошта, опис" className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          <option value="">Сите статуси</option>
          {requestAdminStatuses.map((value) => (
            <option key={value} value={value}>
              {requestStatusLabels[value]}
            </option>
          ))}
        </select>
        <button type="submit" className="border border-ink px-3 py-2 text-[0.72rem] uppercase tracking-wider">
          Филтрирај
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="text-[0.68rem] uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-3">Име</th>
              <th className="pb-3">Е-пошта</th>
              <th className="pb-3">Телефон</th>
              <th className="pb-3">Барање</th>
              <th className="pb-3">Статус</th>
              <th className="pb-3">Датум</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <Link href={`/admin/requests/${request.id}`} className="underline underline-offset-4">
                    {request.name}
                  </Link>
                </td>
                <td className="py-3 pr-3">{request.email}</td>
                <td className="py-3 pr-3">{request.phone || "—"}</td>
                <td className="py-3 pr-3">{request.description.slice(0, 80)}{request.description.length > 80 ? "…" : ""}</td>
                <td className="py-3 pr-3">{requestStatusLabels[request.status]}</td>
                <td className="py-3">{request.createdAt.toLocaleDateString("mk-MK")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 ? <p className="mt-6 text-muted">Нема барања за овој филтер.</p> : null}
      </div>
    </AdminShell>
  );
}
