import { translate } from '../i18n';
import type { MovieDetail } from '../types/tmdb';

export interface ExternalLink {
  label: string;
  url: string;
}

/** ID akun/entri dari TMDB hanya boleh berisi karakter aman (mencegah path/URL sisipan). */
const SAFE_ID = /^[A-Za-z0-9._-]{1,100}$/;

const safe = (id: string | null | undefined) => (id && SAFE_ID.test(id) ? id : null);

/** Tautan luar film: IMDb, situs resmi, media sosial, dan Wikidata. Hanya yang datanya valid. */
export function externalLinks(detail: MovieDetail | null): ExternalLink[] {
  if (!detail) return [];
  const ext = detail.external_ids;
  const links: ExternalLink[] = [];

  const imdb = safe(detail.imdb_id) ?? safe(ext?.imdb_id);
  if (imdb) links.push({ label: 'IMDb', url: `https://www.imdb.com/title/${imdb}/` });
  if (/^https?:\/\//.test(detail.homepage ?? '')) links.push({ label: translate('more.officialSite'), url: detail.homepage as string });

  const ig = safe(ext?.instagram_id);
  if (ig) links.push({ label: 'Instagram', url: `https://www.instagram.com/${ig}/` });
  const x = safe(ext?.twitter_id);
  if (x) links.push({ label: 'X', url: `https://x.com/${x}` });
  const fb = safe(ext?.facebook_id);
  if (fb) links.push({ label: 'Facebook', url: `https://www.facebook.com/${fb}` });
  const wd = safe(ext?.wikidata_id);
  if (wd) links.push({ label: 'Wikidata', url: `https://www.wikidata.org/wiki/${wd}` });
  return links;
}
