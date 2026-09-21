"use client";

import { useEffect } from "react";
import { readFavorites, writeFavorites } from "@/lib/favorites/store";
import { mergeFavoritesAction } from "@/server/actions/customer";

const FAVORITES_EVENT = "antika-favorites";

export function FavoritesMerger({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const refs = readFavorites(window.localStorage);
    if (refs.length === 0) return;
    void mergeFavoritesAction(refs.map((row) => row.id)).then((result) => {
      if (result.ok) {
        writeFavorites(window.localStorage, []);
        window.dispatchEvent(new Event(FAVORITES_EVENT));
      }
    });
  }, [enabled]);
  return null;
}
