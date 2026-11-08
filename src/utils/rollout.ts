import type { ReleaseDate } from '../types/tmdb';

export interface ReleaseRow {
  /** kode negara ISO 3166-1 */
  code: string;
  /** klasifikasi usia unik di negara itu (mis. "PG-13", "TV-MA") */
  certs: string[];
  /** tanggal rilis per jenis (1 premiere … 6 TV), terurut menurut tanggal */
  dates: { type: number; date: string }[];
}

/**
 * Baris "rilis & klasifikasi per negara": negara terpilih (`region`) paling atas, lalu ID dan US, sisanya urut `label`.
 * Negara tanpa klasifikasi maupun tanggal dibuang. Tanggal dipotong ke YYYY-MM-DD.
 */
export function releaseRows(
  results: { iso_3166_1: string; release_dates: ReleaseDate[] }[] | undefined,
  region: string,
  label: (code: string) => string,
  locale: string,
): ReleaseRow[] {
  const rows: ReleaseRow[] = [];
  for (const r of results ?? []) {
    const certs = [...new Set(r.release_dates.map((d) => d.certification?.trim()).filter((c): c is string => !!c))];
    const dates = r.release_dates
      .filter((d) => d.release_date)
      .map((d) => ({ type: d.type, date: d.release_date.slice(0, 10) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.type - b.type);
    if (certs.length === 0 && dates.length === 0) continue;
    rows.push({ code: r.iso_3166_1, certs, dates });
  }
  const rank = (code: string) => (code === region ? 0 : code === 'ID' ? 1 : code === 'US' ? 2 : 3);
  return rows.sort((a, b) => rank(a.code) - rank(b.code) || label(a.code).localeCompare(label(b.code), locale));
}
