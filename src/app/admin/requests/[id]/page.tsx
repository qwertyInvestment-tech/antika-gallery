import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatusButtons } from "@/components/admin/AdminStatusButtons";
import { requestStatusLabels } from "@/lib/domain/request-status";
import { getWantedRequestById } from "@/server/services/request-service";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getWantedRequestById(id);
  if (!request) notFound();

  return (
    <AdminShell title="Барање за пронаоѓање">
      <dl className="grid max-w-2xl gap-5 text-sm">
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Име</dt>
          <dd className="mt-1">{request.name}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Е-пошта</dt>
          <dd className="mt-1">{request.email}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Телефон</dt>
          <dd className="mt-1">{request.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Што бара</dt>
          <dd className="mt-1 whitespace-pre-line leading-7">{request.description}</dd>
        </div>
        {request.details ? (
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Детали</dt>
            <dd className="mt-1 whitespace-pre-line leading-7">{request.details}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Создадено</dt>
          <dd className="mt-1">{request.createdAt.toLocaleString("mk-MK")}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Статус</dt>
          <dd className="mt-1">{requestStatusLabels[request.status]}</dd>
        </div>
      </dl>
      <div className="mt-8">
        <AdminStatusButtons id={request.id} current={request.status} labels={requestStatusLabels} kind="request" />
      </div>
    </AdminShell>
  );
}
