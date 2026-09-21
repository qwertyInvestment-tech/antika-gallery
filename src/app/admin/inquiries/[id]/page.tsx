import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatusButtons } from "@/components/admin/AdminStatusButtons";
import { inquiryStatusLabels } from "@/lib/domain/inquiry-status";
import { ItemStatus } from "@prisma/client";
import { ReserveForm } from "@/components/admin/ReservationPanel";
import { getInquiryById } from "@/server/services/inquiry-service";

export const dynamic = "force-dynamic";

export default async function AdminInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await getInquiryById(id);
  if (!inquiry) notFound();

  return (
    <AdminShell title="Барање">
      <dl className="grid max-w-2xl gap-5 text-sm">
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Име</dt>
          <dd className="mt-1">{inquiry.name}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Е-пошта</dt>
          <dd className="mt-1">{inquiry.email}</dd>
        </div>
        {inquiry.user ? (
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Сметка</dt>
            <dd className="mt-1">
              <Link href={`/admin/customers/${inquiry.user.id}`} className="underline underline-offset-4">
                {inquiry.user.name}
              </Link>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Телефон</dt>
          <dd className="mt-1">{inquiry.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Предмет</dt>
          <dd className="mt-1">
            {inquiry.item ? (
              <Link href={`/admin/items/${inquiry.item.id}`} className="underline underline-offset-4">
                {inquiry.item.referenceNumber} · {inquiry.item.title}
              </Link>
            ) : (
              "Општа порака"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Порака</dt>
          <dd className="mt-1 whitespace-pre-line leading-7">{inquiry.message}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Создадено</dt>
          <dd className="mt-1">{inquiry.createdAt.toLocaleString("mk-MK")}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Ажурирано</dt>
          <dd className="mt-1">{inquiry.updatedAt.toLocaleString("mk-MK")}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Статус</dt>
          <dd className="mt-1">{inquiryStatusLabels[inquiry.status]}</dd>
        </div>
      </dl>
      <div className="mt-8">
        <AdminStatusButtons id={inquiry.id} current={inquiry.status} labels={inquiryStatusLabels} kind="inquiry" />
      </div>
      {inquiry.item?.status === ItemStatus.AVAILABLE ? (
        <div className="mt-8 max-w-md border border-line p-4">
          <p className="mb-3 text-[0.72rem] uppercase tracking-wider text-muted">Резервација</p>
          <ReserveForm
            itemId={inquiry.item.id}
            inquiries={[{ id: inquiry.id, name: inquiry.name, email: inquiry.email }]}
          />
        </div>
      ) : null}
    </AdminShell>
  );
}
