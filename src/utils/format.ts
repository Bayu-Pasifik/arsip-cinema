export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function formatRuntime(min: number | null): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}j ${m}m` : `${m}m`;
}

/** "2024-03-01" → "1 Maret 2024"; format tak dikenal → ''. */
export function formatDate(iso: string | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Nilai USD ringkas ("$165 jt", "$1,2 M"); 0/kosong = tidak diketahui → ''. */
export function formatMoney(usd: number | undefined): string {
  if (!usd || usd <= 0) return '';
  if (usd >= 1e9) return `$${(usd / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  if (usd >= 1e6) return `$${(usd / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  return `$${usd.toLocaleString('id-ID')}`;
}

const STATUS_ID: Record<string, string> = {
  Released: 'Sudah rilis',
  'Post Production': 'Pascaproduksi',
  'In Production': 'Dalam produksi',
  Planned: 'Direncanakan',
  Rumored: 'Baru rumor',
  Canceled: 'Dibatalkan',
};
export const statusLabel = (status: string | undefined) => (status ? (STATUS_ID[status] ?? status) : '');

/** Kode bahasa ISO 639-1 → nama bahasa Indonesia ("ja" → "Jepang"); gagal → kode apa adanya. */
export function languageName(code: string | undefined): string {
  if (!code) return '';
  try {
    return new Intl.DisplayNames(['id'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Rapikan teks ulasan (hapus penanda markdown ringan) lalu potong di batas kata. */
export function excerpt(text: string, max: number): { text: string; truncated: boolean } {
  const clean = text.replace(/\r\n?/g, '\n').replace(/[*_`#>]+/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (clean.length <= max) return { text: clean, truncated: false };
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return { text: `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`, truncated: true };
}
