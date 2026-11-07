import type { Movie } from '../types/tmdb';

/** Menambahkan halaman berikutnya tanpa duplikat (halaman TMDB bisa saling tumpang-tindih, mis. trending) dan memotong di `max`. */
export function appendUnique(prev: Movie[], next: Movie[], max = Infinity): Movie[] {
  const seen = new Set(prev.map((m) => m.id));
  const out = [...prev];
  for (const m of next) {
    if (out.length >= max) break;
    if (!seen.has(m.id)) {
      seen.add(m.id);
      out.push(m);
    }
  }
  return out;
}

/** Masih ada halaman berikutnya yang boleh dimuat? */
export function canLoadMore(page: number, totalPages: number, loaded: number, max: number): boolean {
  return page < totalPages && loaded < max;
}
