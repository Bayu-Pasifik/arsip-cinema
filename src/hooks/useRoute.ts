import { useMemo, useSyncExternalStore } from 'react';
import type { Category } from '../types/tmdb';

/**
 * Router mini berbasis History API (tanpa dependensi):
 *   /                          pembuka
 *   /browse/:category?q=...    galeri (category: trending|popular|top_rated|now_playing|favorites|watchlist)
 *   /movie/:id                 halaman detail film
 */
export type Route =
  | { name: 'home' }
  | { name: 'browse'; category: Category; q: string }
  | { name: 'movie'; id: number };

const CATEGORIES: readonly Category[] = ['trending', 'popular', 'top_rated', 'now_playing', 'favorites', 'watchlist'];
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
  if (parts[0] === 'browse') {
    const c = parts[1] as Category;
    return { name: 'browse', category: CATEGORIES.includes(c) ? c : 'trending', q: url.searchParams.get('q') ?? '' };
  }
  return { name: 'home' };
}

export const browsePath = (category: Category, q = '') =>
  `/browse/${category}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`;
export const moviePath = (id: number) => `/movie/${id}`;

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
