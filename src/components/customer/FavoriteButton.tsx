"use client";

import { useState, useSyncExternalStore } from "react";
import {
  addFavorite,
  hasFavorite,
  readFavorites,
  removeFavorite,
  writeFavorites,
  type FavoriteRef,
} from "@/lib/favorites/store";
import { toggleFavoriteAction } from "@/server/actions/customer";

const FAVORITES_EVENT = "antika-favorites";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(FAVORITES_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(FAVORITES_EVENT, onStoreChange);
  };
}

function emitFavoritesChange() {
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function FavoriteButton({
  item,
  authenticated = false,
  initiallySaved = false,
}: {
  item: FavoriteRef;
  authenticated?: boolean;
  initiallySaved?: boolean;
}) {
  const anonymousSaved = useSyncExternalStore(
    subscribe,
    () => hasFavorite(readFavorites(window.localStorage), item.id),
    () => false,
  );
  const [saved, setSaved] = useState(initiallySaved);
  const pressed = authenticated ? saved : anonymousSaved;

  async function toggle() {
    if (authenticated) {
      const result = await toggleFavoriteAction(item.id, saved);
      if (result.ok) setSaved(!saved);
      return;
    }
    const current = readFavorites(window.localStorage);
    const next = anonymousSaved ? removeFavorite(current, item.id) : addFavorite(current, item);
    writeFavorites(window.localStorage, next);
    emitFavoritesChange();
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-pressed={pressed}
      aria-label={pressed ? "Отстрани од омилени" : "Додај во омилени"}
      className="mt-6 text-[0.72rem] tracking-[0.16em] uppercase text-walnut hover:text-ink"
    >
      {pressed ? "♥ Во омилени" : "♡ Додај во омилени"}
    </button>
  );
}
