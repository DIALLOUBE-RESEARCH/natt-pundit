import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "natt-pundit-favorites";
const CHANGE_EVENT = "natt-pundit-favorites-changed";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function getFavorites(): string[] {
  return readFavorites();
}

export function isFavorite(id: string): boolean {
  return readFavorites().includes(id);
}

/** Toggle favorite; newly added ids append to end (first added stays on top). */
export function toggleFavorite(id: string): string[] {
  const current = readFavorites();
  const idx = current.indexOf(id);
  const next =
    idx >= 0 ? [...current.slice(0, idx), ...current.slice(idx + 1)] : [...current, id];
  writeFavorites(next);
  return next;
}

export function useMatchFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readFavorites());
    const sync = () => setFavorites(readFavorites());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites(toggleFavorite(id));
  }, []);

  const check = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite: toggle, isFavorite: check };
}
