import { useMemo, useSyncExternalStore } from 'react';
import type { Category } from '../types/tmdb';

/**
 * Router mini berbasis History API (tanpa dependensi):
 *   /                          pembuka
 *   /browse/:category?q=...&genre=ID    galeri (category: trending|popular|top_rated|now_playing|favorites|watchlist)
 *   /movie/:id                 halaman detail film
 *   /person/:id                profil aktor/kru dan filmografi
 */
export type Route =
  | { name: 'home' }
  | { name: 'browse'; category: Category; q: string; genre: number | null }
  | { name: 'movie'; id: number }
  | { name: 'person'; id: number };

const CATEGORIES: readonly Category[] = ['trending', 'popular', 'top_rated', 'now_playing', 'upcoming', 'favorites', 'watchlist'];
const listeners = new Set<() => void>();

const snapshot = () => window.location.pathname + window.location.search;

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('popstate', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('popstate', cb);
  };
}

export function parseRoute(loc: string): Route {
  const url = new URL(loc, 'http://local');
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'movie' && /^-?\d+$/.test(parts[1] ?? '')) return { name: 'movie', id: Number(parts[1]) };
  if (parts[0] === 'person' && /^[0-9]+$/.test(parts[1] ?? '')) return { name: 'person', id: Number(parts[1]) };
  if (parts[0] === 'browse') {
    const c = parts[1] as Category;
    const g = url.searchParams.get('genre') ?? '';
    return {
      name: 'browse',
      category: CATEGORIES.includes(c) ? c : 'trending',
      q: url.searchParams.get('q') ?? '',
      genre: /^[0-9]+$/.test(g) ? Number(g) : null,
    };
  }
  return { name: 'home' };
}

export const browsePath = (category: Category, q = '', genre: number | null = null) => {
  const parts: string[] = [];
  if (q.trim()) parts.push(`q=${encodeURIComponent(q.trim())}`);
  if (genre !== null) parts.push(`genre=${genre}`);
  const qs = parts.join('&');
  return `/browse/${category}${qs ? `?${qs}` : ''}`;
};
export const moviePath = (id: number) => `/movie/${id}`;
export const personPath = (id: number) => `/person/${id}`;

/** Tanda `from: 'app'` pada state history = entri ini dibuat oleh navigasi di dalam aplikasi. */
export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === snapshot()) return;
  if (opts.replace) window.history.replaceState(window.history.state, '', to);
  else window.history.pushState({ from: 'app' }, '', to);
  listeners.forEach((l) => l());
}

export const cameFromApp = () => (window.history.state as { from?: string } | null)?.from === 'app';

export function useRoute(): Route {
  const loc = useSyncExternalStore(subscribe, snapshot, () => '/');
  return useMemo(() => parseRoute(loc), [loc]);
}
