import { useMemo, useSyncExternalStore } from 'react';
import type { Category } from '../types/tmdb';
import { filterParts, NO_FILTERS, parseFilters, type Filters } from '../utils/filters';

/**
 * Router mini berbasis History API (tanpa dependensi):
 *   /                          pembuka
 *   /browse/:category?q=...&genre=&year=&rating=&sort=&keyword=    galeri (category: trending|popular|top_rated|now_playing|favorites|watchlist)
 *   /movie/:id                 halaman detail film
 *   /people                   aktor/kru populer dan trending
 *   /person/:id                profil aktor/kru dan filmografi
 */
export type Route =
  | { name: 'home' }
  | { name: 'browse'; category: Category; q: string; filters: Filters }
  | { name: 'movie'; id: number }
  | { name: 'person'; id: number }
  | { name: 'people' };

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
  if (parts[0] === 'people') return { name: 'people' };
  if (parts[0] === 'browse') {
    const c = parts[1] as Category;
    return {
      name: 'browse',
      category: CATEGORIES.includes(c) ? c : 'trending',
      q: url.searchParams.get('q') ?? '',
      filters: parseFilters(url.searchParams),
    };
  }
  return { name: 'home' };
}

export const browsePath = (category: Category, q = '', filters: Filters = NO_FILTERS) => {
  const parts: string[] = [];
  if (q.trim()) parts.push(`q=${encodeURIComponent(q.trim())}`);
  parts.push(...filterParts(filters));
  const qs = parts.join('&');
  return `/browse/${category}${qs ? `?${qs}` : ''}`;
};
export const moviePath = (id: number) => `/movie/${id}`;
export const personPath = (id: number) => `/person/${id}`;
export const PEOPLE_PATH = '/people';

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
