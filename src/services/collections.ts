import { useSyncExternalStore } from 'react';
import type { CollectionKey, Movie } from '../types/tmdb';

/**
 * Favorit & Watchlist disimpan di localStorage (tanpa akun TMDB). Yang disimpan adalah salinan ringkas data film
 * sehingga daftar dapat ditampilkan tanpa memanggil API lagi. Bila localStorage tidak tersedia (mode privat,
 * diblokir) data tetap bekerja selama sesi tetapi tidak persisten.
 */
export interface Collections {
  favorites: Movie[];
  watchlist: Movie[];
}

export const STORAGE_KEY = 'arsip.collections.v1';
export const MAX_PER_LIST = 200;

const EMPTY: Collections = { favorites: [], watchlist: [] };

/** Salinan ringkas film yang aman disimpan (tanpa field demo atau data tak dikenal). */
export function toSaved(m: Movie): Movie {
  return {
    id: m.id,
    title: m.title,
    overview: m.overview ?? '',
    poster_path: m.poster_path ?? null,
    backdrop_path: m.backdrop_path ?? null,
    release_date: m.release_date ?? '',
    vote_average: m.vote_average ?? 0,
    vote_count: m.vote_count ?? 0,
    ...(m.media === 'tv' ? { media: 'tv' as const } : {}),
  };
}

function isMovieLike(v: unknown): v is Movie {
  if (!v || typeof v !== 'object') return false;
  const m = v as Record<string, unknown>;
  return typeof m.id === 'number' && m.id > 0 && typeof m.title === 'string';
}

function sanitizeList(raw: unknown): Movie[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const out: Movie[] = [];
  for (const item of raw) {
    if (!isMovieLike(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(toSaved(item));
    if (out.length >= MAX_PER_LIST) break;
  }
  return out;
}

/** Membersihkan data hasil parse localStorage yang mungkin rusak atau diubah manual. */
export function sanitize(raw: unknown): Collections {
  if (!raw || typeof raw !== 'object') return { favorites: [], watchlist: [] };
  const r = raw as Record<string, unknown>;
  return { favorites: sanitizeList(r.favorites), watchlist: sanitizeList(r.watchlist) };
}

/** Menambah film di urutan terdepan, atau menghapusnya bila sudah ada. */
export function toggleIn(list: Movie[], movie: Movie): Movie[] {
  if (list.some((m) => m.id === movie.id)) return list.filter((m) => m.id !== movie.id);
  return [toSaved(movie), ...list].slice(0, MAX_PER_LIST);
}

export const isCollectionKey = (v: string): v is CollectionKey => v === 'favorites' || v === 'watchlist';
export const isIn = (c: Collections, key: CollectionKey, id: number) => c[key].some((m) => m.id === id);

// ---- store ----------------------------------------------------------------
function load(): Collections {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

let state: Collections = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* penyimpanan penuh/diblokir: tetap berfungsi di memori */
  }
}

/** Mengalihkan status film pada daftar; mengembalikan true bila sekarang ADA di daftar. Film demo diabaikan. */
export function toggleCollection(key: CollectionKey, movie: Movie): boolean {
  if (movie.demo) return false;
  state = { ...state, [key]: toggleIn(state[key], movie) };
  persist();
  emit();
  return isIn(state, key, movie.id);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // sinkronkan antar tab
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      state = load();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export const useCollections = (): Collections => useSyncExternalStore(subscribe, () => state, () => EMPTY);
