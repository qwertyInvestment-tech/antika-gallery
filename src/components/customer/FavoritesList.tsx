"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { ItemPreview } from "@/components/editorial/ItemPreview";
import { toPreviewModel } from "@/lib/catalog/present";
import { readFavorites } from "@/lib/favorites/store";
import { loadFavoriteItemsAction } from "@/server/actions/customer";
import type { PublicCatalogItem } from "@/server/catalog/queries";

const FAVORITES_EVENT = "antika-favorites";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(FAVORITES_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(FAVORITES_EVENT, onStoreChange);
  };
}

function snapshot() {
  return JSON.stringify(readFavorites(window.localStorage).map((row) => row.id));
}

export function FavoritesList() {
  const idsJson = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const [items, setItems] = useState<PublicCatalogItem[] | null>(null);

  useEffect(() => {
    const ids = JSON.parse(idsJson) as string[];
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const next = ids.length === 0 ? [] : await loadFavoriteItemsAction(ids);
      if (!cancelled) setItems(next);
    });
    return () => {
      cancelled = true;
    };
  }, [idsJson]);

  if (items === null) {
    return <p className="text-muted">Се вчитува колекцијата…</p>;
  }

  if (items.length === 0) {
    return (
      <CatalogEmpty
        title="Сè уште немате зачувано предмети."
        description="Зачувајте предмети што сакате повторно да ги видите — дури и ако подоцна бидат продадени."
        cta="Разгледај ја колекцијата"
      />
    );
  }

  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14">
      {items.map((item) => (
        <ItemPreview key={item.id} {...toPreviewModel(item)} />
      ))}
    </div>
  );
}
