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
  // TMDB kadang memuat satu negara beberapa kali (mis. content_ratings serial): gabungkan per negara
  const byCode = new Map<string, ReleaseRow>();
  for (const r of results ?? []) {
    const row = byCode.get(r.iso_3166_1) ?? { code: r.iso_3166_1, certs: [], dates: [] };
    for (const d of r.release_dates) {
      const cert = d.certification?.trim();
      if (cert && !row.certs.includes(cert)) row.certs.push(cert);
      if (d.release_date) row.dates.push({ type: d.type, date: d.release_date.slice(0, 10) });
    }
    byCode.set(r.iso_3166_1, row);
  }
  const rows = [...byCode.values()].filter((r) => r.certs.length > 0 || r.dates.length > 0);
  for (const r of rows) r.dates.sort((a, b) => a.date.localeCompare(b.date) || a.type - b.type);
  const rank = (code: string) => (code === region ? 0 : code === 'ID' ? 1 : code === 'US' ? 2 : 3);
  return rows.sort((a, b) => rank(a.code) - rank(b.code) || label(a.code).localeCompare(label(b.code), locale));
}
