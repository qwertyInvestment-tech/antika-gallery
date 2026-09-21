import { AdminShell } from "@/components/admin/AdminShell";
import { ItemForm } from "@/components/admin/ItemForm";
import { listCategories } from "@/server/repositories/item-repository";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const categories = await listCategories();
  return (
    <AdminShell title="Нов предмет">
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Референтниот број се доделува автоматски. Фотографиите се додаваат откако ќе се зачува нацртот.
      </p>
      <ItemForm categories={categories} />
    </AdminShell>
  );
}
