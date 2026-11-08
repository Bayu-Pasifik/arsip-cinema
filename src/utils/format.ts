import { translate, type MessageKey } from '../i18n';
import { getLanguage } from '../services/language';

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function formatRuntime(min: number | null): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hu = translate('fmt.hour');
  const mu = translate('fmt.minute');
  return h ? `${h}${hu} ${m}${mu}` : `${m}${mu}`;
}

/** "2024-03-01" → "1 Maret 2024" (menurut bahasa aktif); format tak dikenal → ''. */
export function formatDate(iso: string | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLanguage(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Nilai USD ringkas ("$165 jt", "$1,2 M"); 0/kosong = tidak diketahui → ''. */
export function formatMoney(usd: number | undefined): string {
  if (!usd || usd <= 0) return '';
  if (usd >= 1e9) return `$${(usd / 1e9).toLocaleString(getLanguage(), { maximumFractionDigits: 2 })} ${translate('fmt.billion')}`;
  if (usd >= 1e6) return `$${(usd / 1e6).toLocaleString(getLanguage(), { maximumFractionDigits: 1 })} ${translate('fmt.million')}`;
  return `$${usd.toLocaleString(getLanguage())}`;
}

const STATUS_KEY: Record<string, MessageKey> = {
  Released: 'status.Released',
  'Post Production': 'status.PostProduction',
  'In Production': 'status.InProduction',
  Planned: 'status.Planned',
  Rumored: 'status.Rumored',
  Canceled: 'status.Canceled',
};
export const statusLabel = (status: string | undefined) =>
  status ? (STATUS_KEY[status] ? translate(STATUS_KEY[status]) : status) : '';

/** Kode bahasa ISO 639-1 → nama bahasa dalam bahasa aktif ("ja" → "Jepang"); gagal → kode apa adanya. */
export function languageName(code: string | undefined): string {
  if (!code) return '';
  try {
    return new Intl.DisplayNames([getLanguage()], { type: 'language' }).of(code) ?? code;
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

/** Kode negara ISO 3166-1 → nama negara dalam bahasa aktif ("ID" → "Indonesia"); gagal → kode apa adanya. */
export function regionName(code: string): string {
  try {
    return new Intl.DisplayNames([getLanguage()], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
