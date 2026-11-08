import type { AlternativeTitle } from '../types/tmdb';

/** Judul alternatif unik (tanpa beda huruf besar/kecil), tanpa judul yang sama dengan `current`, maksimal `max`. */
export function uniqueTitles(titles: AlternativeTitle[] | undefined, current: string, max: number): AlternativeTitle[] {
  const seen = new Set([current.trim().toLowerCase()]);
  const out: AlternativeTitle[] = [];
  for (const a of titles ?? []) {
    const key = a.title.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
    if (out.length >= max) break;
  }
  return out;
}
