import type { MovieDetail } from '../types/tmdb';

/** Negara yang diprioritaskan untuk klasifikasi usia dan tanggal tayang; US sebagai cadangan klasifikasi. */
const PRIMARY = 'ID';
const FALLBACK = 'US';

/** Jenis rilis TMDB: 3 = bioskop. */
const THEATRICAL = 3;

/** Klasifikasi usia (mis. "13+", "R"): Indonesia dulu, lalu AS. Kosong bila tidak ada. */
export function certification(detail: MovieDetail | null): { region: string; value: string } | null {
  const results = detail?.release_dates?.results ?? [];
  for (const region of [PRIMARY, FALLBACK]) {
    const entry = results.find((r) => r.iso_3166_1 === region);
    const value = entry?.release_dates.map((d) => d.certification?.trim()).find(Boolean);
    if (value) return { region, value };
  }
  return null;
}

/** Tanggal tayang bioskop di Indonesia (ISO, tanpa jam); null bila tidak ada. */
export function theatricalDateId(detail: MovieDetail | null): string | null {
  const entry = detail?.release_dates?.results.find((r) => r.iso_3166_1 === PRIMARY);
  const dates = (entry?.release_dates ?? [])
    .filter((d) => d.type === THEATRICAL && d.release_date)
    .map((d) => d.release_date.slice(0, 10))
    .sort();
  return dates[0] ?? null;
}
