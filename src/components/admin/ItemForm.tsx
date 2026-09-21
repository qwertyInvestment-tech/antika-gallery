"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ItemCondition, ItemStatus, type Category } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { currencyLabels, itemConditionLabels, itemStatusLabels } from "@/lib/domain/labels";
import { createItemAction, updateItemAction, type CatalogActionResult } from "@/server/actions/items";

type ItemFormValues = {
  id?: string;
  title: string;
  slug: string;
  categoryId: string;
  shortDescription?: string | null;
  description?: string | null;
  price: string;
  currency: string;
  status: ItemStatus;
  periodLabel?: string | null;
  origin?: string | null;
  maker?: string | null;
  provenance?: string | null;
  material?: string | null;
  condition?: ItemCondition | null;
  conditionNotes?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  authenticityNotes?: string | null;
  documentationNotes?: string | null;
  expertNotes?: string | null;
  certificateNotes?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

const fieldClass = "mt-1 w-full border border-ink/15 bg-ivory-soft px-3 py-2 text-sm";
const labelClass = "block text-sm";

export function ItemForm({
  categories,
  item,
}: {
  categories: Pick<Category, "id" | "name">[];
  item?: ItemFormValues;
}) {
  const router = useRouter();
  const action = item?.id ? updateItemAction : createItemAction;
  const [state, formAction, pending] = useActionState<CatalogActionResult | null, FormData>(action, null);
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? ItemStatus.DRAFT);
  const [statusSource, setStatusSource] = useState(item?.status);

  // Keep catalog status select aligned after commerce-driven item refreshes.
  if (item?.status && item.status !== statusSource) {
    setStatusSource(item.status);
    setStatus(item.status);
  }

  function createSubmitLabel() {
    if (status === ItemStatus.PUBLISHED) return "Објави предмет";
    if (status === ItemStatus.AVAILABLE) return "Зачувај и објави";
    if (status === ItemStatus.ARCHIVED) return "Зачувај и архивирај";
    return "Зачувај нацрт";
  }

  useEffect(() => {
    if (state?.ok && state.id && !item?.id) {
      router.push(`/admin/items/${state.id}`);
    }
  }, [state, item?.id, router]);

  return (
    <form action={formAction} className="space-y-10">
      {item?.id ? <input type="hidden" name="id" value={item.id} /> : null}
      {state && !state.ok ? <p className="text-sm text-walnut">{state.message}</p> : null}
      {state?.ok ? <p className="text-sm text-muted">Зачувано.</p> : null}

      <fieldset className="space-y-4">
        <legend className="font-serif text-2xl">Основно</legend>
        <label className={labelClass}>
          Наслов
          <input name="title" required minLength={2} defaultValue={item?.title} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Категорија
          <select name="categoryId" required defaultValue={item?.categoryId} className={fieldClass}>
            <option value="">Изберете</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            Цена
            <input name="price" required defaultValue={item?.price ?? "0"} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Валута
            <select name="currency" defaultValue={item?.currency ?? "MKD"} className={fieldClass}>
              {Object.entries(currencyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Каталог статус
            <select
              name="status"
              value={
                status === ItemStatus.RESERVED || status === ItemStatus.SOLD
                  ? status
                  : status
              }
              onChange={(event) => setStatus(event.target.value as ItemStatus)}
              disabled={status === ItemStatus.RESERVED || status === ItemStatus.SOLD}
              className={fieldClass}
            >
              {Object.entries(itemStatusLabels)
                .filter(([value]) => {
                  if (value === ItemStatus.RESERVED || value === ItemStatus.SOLD) {
                    return item?.status === value;
                  }
                  return true;
                })
                .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {status === ItemStatus.RESERVED || status === ItemStatus.SOLD ? (
              <span className="mt-1 block text-xs text-muted">
                Комерцијалниот статус се менува само преку резервацискиот тек.
              </span>
            ) : null}
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-2xl">Историја</legend>
        <label className={labelClass}>
          Период
          <input name="periodLabel" defaultValue={item?.periodLabel ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Потекло
          <input name="origin" defaultValue={item?.origin ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Производител / автор
          <input name="maker" defaultValue={item?.maker ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Провениенција
          <textarea name="provenance" rows={4} defaultValue={item?.provenance ?? ""} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-2xl">Карактеристики</legend>
        <label className={labelClass}>
          Материјал
          <input name="material" defaultValue={item?.material ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Состојба
          <select name="condition" defaultValue={item?.condition ?? ""} className={fieldClass}>
            <option value="">Не е наведено</option>
            {Object.entries(itemConditionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Детал за состојбата
          <textarea name="conditionNotes" rows={3} defaultValue={item?.conditionNotes ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Димензии
          <input name="dimensions" defaultValue={item?.dimensions ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Тежина
          <input name="weight" defaultValue={item?.weight ?? ""} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-2xl">Опис</legend>
        <label className={labelClass}>
          Краток опис
          <textarea name="shortDescription" rows={3} defaultValue={item?.shortDescription ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Детален опис
          <textarea name="description" rows={8} defaultValue={item?.description ?? ""} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-2xl">Автентичност</legend>
        <p className="text-sm text-muted">
          Системот не тврди автентичност сам. Внесете само она што го знаете.
        </p>
        <label className={labelClass}>
          Информации за автентичност
          <textarea name="authenticityNotes" rows={3} defaultValue={item?.authenticityNotes ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Документација
          <textarea name="documentationNotes" rows={3} defaultValue={item?.documentationNotes ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Белешки од стручно лице
          <textarea name="expertNotes" rows={3} defaultValue={item?.expertNotes ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Сертификати
          <textarea name="certificateNotes" rows={3} defaultValue={item?.certificateNotes ?? ""} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-2xl">SEO</legend>
        <label className={labelClass}>
          Slug
          <input name="slug" defaultValue={item?.slug ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          SEO наслов
          <input name="seoTitle" defaultValue={item?.seoTitle ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          SEO опис
          <textarea name="seoDescription" rows={3} defaultValue={item?.seoDescription ?? ""} className={fieldClass} />
        </label>
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Се зачувува…" : item?.id ? "Зачувај" : createSubmitLabel()}
      </Button>
    </form>
  );
}
