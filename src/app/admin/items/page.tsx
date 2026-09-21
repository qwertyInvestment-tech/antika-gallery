import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminItemsTable, type AdminItemRow } from "@/components/admin/AdminItemsTable";
import { itemStatusLabels } from "@/lib/domain/labels";
import { itemListQuerySchema } from "@/lib/validation/item";
import { listAdminItems, listCategories } from "@/server/repositories/item-repository";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function itemsHref(params: {
  q?: string;
  categoryId?: string;
  status?: string;
  sort?: string;
  order?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.status) search.set("status", params.status);
  if (params.sort && params.sort !== "createdAt") search.set("sort", params.sort);
  if (params.order && params.order !== "desc") search.set("order", params.order);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/admin/items?${qs}` : "/admin/items";
}

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsedResult = itemListQuerySchema.safeParse({
    q: typeof params.q === "string" ? params.q : undefined,
    categoryId: typeof params.categoryId === "string" && params.categoryId ? params.categoryId : undefined,
    status: typeof params.status === "string" && params.status ? params.status : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    order: typeof params.order === "string" ? params.order : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });
  const parsed = parsedResult.success
    ? parsedResult.data
    : { sort: "createdAt" as const, order: "desc" as const, page: 1 };

  const [{ items, total, page, pageCount }, categories] = await Promise.all([
    listAdminItems(parsed),
    listCategories(),
  ]);

  const itemIds = items.map((item) => item.id);
  const [reservationRows, orderItemRows] = itemIds.length
    ? await Promise.all([
        prisma.reservation.groupBy({
          by: ["itemId"],
          where: { itemId: { in: itemIds } },
          _count: { _all: true },
        }),
        prisma.orderItem.groupBy({
          by: ["itemId"],
          where: { itemId: { in: itemIds } },
          _count: { _all: true },
        }),
      ])
    : [[], []];

  const commerceByItem = new Set<string>([
    ...reservationRows.map((row) => row.itemId),
    ...orderItemRows.map((row) => row.itemId),
  ]);

  const rows: AdminItemRow[] = items.map((item) => {
    const photo = item.images[0]?.asset;
    return {
      id: item.id,
      referenceNumber: item.referenceNumber,
      title: item.title,
      status: item.status,
      price: item.price.toString(),
      currency: item.currency,
      createdAtLabel: item.createdAt.toLocaleDateString("mk-MK"),
      categoryName: item.category.name,
      photoUrl: photo?.url ?? null,
      photoAlt: photo?.alt ?? item.title,
      hasCommerceHistory: commerceByItem.has(item.id),
    };
  });

  const filterBase = {
    q: parsed.q,
    categoryId: parsed.categoryId,
    status: parsed.status,
    sort: parsed.sort,
    order: parsed.order,
  };

  return (
    <AdminShell
      title="Предмети"
      actions={
        <Link href="/admin/items/new" className="border border-ink px-4 py-2 text-[0.72rem] uppercase tracking-wider">
          Нов предмет
        </Link>
      }
    >
      <form className="mb-8 grid gap-3 border border-line p-4 md:grid-cols-5">
        <input name="q" defaultValue={parsed.q} placeholder="Назив или референца" className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm" />
        <select name="categoryId" defaultValue={parsed.categoryId ?? ""} className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          <option value="">Сите категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={parsed.status ?? ""} className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          <option value="">Сите статуси</option>
          {Object.entries(itemStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={parsed.sort} className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          <option value="createdAt">Датум</option>
          <option value="title">Назив</option>
          <option value="price">Цена</option>
          <option value="referenceNumber">Референца</option>
        </select>
        <button type="submit" className="border border-ink px-3 py-2 text-[0.72rem] uppercase tracking-wider">
          Филтрирај
        </button>
      </form>

      <AdminItemsTable items={rows} />

      {total > 0 ? (
        <nav className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Страници">
          <p className="text-muted">
            Страница {page} од {pageCount} · {total} предмети
          </p>
          <div className="flex gap-3">
            {page > 1 ? (
              <Link href={itemsHref({ ...filterBase, page: page - 1 })} className="underline underline-offset-4">
                Претходна
              </Link>
            ) : (
              <span className="text-muted">Претходна</span>
            )}
            {page < pageCount ? (
              <Link href={itemsHref({ ...filterBase, page: page + 1 })} className="underline underline-offset-4">
                Следна
              </Link>
            ) : (
              <span className="text-muted">Следна</span>
            )}
          </div>
        </nav>
      ) : null}
    </AdminShell>
  );
}
