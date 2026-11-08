export const SORTS = ['popularity.desc', 'vote_average.desc', 'primary_release_date.desc', 'revenue.desc'] as const;
export type SortKey = (typeof SORTS)[number];

/** Filter /discover/movie. null = tidak dipakai. */
export interface Filters {
  genre: number | null;
  year: number | null;
  /** rating minimum 1–9 */
  rating: number | null;
  sort: SortKey | null;
  keyword: number | null;
  /** id koleksi/franchise: daftar film koleksi itu (tidak memakai /discover) */
  collection: number | null;
  /** id penyedia tontonan (streaming) di negara terpilih */
  provider: number | null;
  /** id studio/perusahaan produksi */
  company: number | null;
  /** id aktor/kru: film yang dibintanginya (with_cast) */
  cast: number | null;
  /** sertifikasi usia (mis. "PG-13") menurut negara tontonan terpilih */
  cert: string | null;
  /** bahasa asli film (ISO 639-1) */
  lang: string | null;
  runtime: RuntimeKey | null;
  /** tahun awal dekade (1990 = 1990–1999); diabaikan bila `year` terisi */
  decade: number | null;
}

export const NO_FILTERS: Filters = { genre: null, year: null, rating: null, sort: null, keyword: null, collection: null, provider: null, company: null, cast: null, cert: null, lang: null, runtime: null, decade: null };

export const RATINGS = [5, 6, 7, 8] as const;

/** Preset durasi: pendek < 90 menit, sedang 90–120, panjang > 120. */
export const RUNTIMES = ['short', 'medium', 'long'] as const;
export type RuntimeKey = (typeof RUNTIMES)[number];

/** Bahasa asli film yang ditawarkan di filter (ISO 639-1). */
export const ORIGINAL_LANGUAGES = ['en', 'id', 'ja', 'ko', 'zh', 'hi', 'th', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'tr', 'sv', 'da'] as const;

/** Dekade yang ditawarkan: 2020, 2010, … 1920. */
export const DECADES = Array.from({ length: 11 }, (_, i) => 2020 - i * 10);

export const hasFilters = (f: Filters): boolean => Object.values(f).some((v) => v !== null);

/** Jumlah filter yang aktif (untuk lencana tombol). */
export const filterCount = (f: Filters): number => Object.values(f).filter((v) => v !== null).length;

const int = (v: string | null, min: number, max: number): number | null => {
  if (v === null || !/^[0-9]+$/.test(v)) return null;
  const n = Number(v);
  return n >= min && n <= max ? n : null;
};

/** Baca filter dari query string; nilai tak valid diabaikan. */
export function parseFilters(params: URLSearchParams): Filters {
  const sort = params.get('sort');
  return {
    genre: int(params.get('genre'), 1, 999999),
    year: int(params.get('year'), 1870, 2200),
    rating: int(params.get('rating'), 1, 9),
    sort: (SORTS as readonly string[]).includes(sort ?? '') ? (sort as SortKey) : null,
    keyword: int(params.get('keyword'), 1, 99999999),
    collection: int(params.get('collection'), 1, 99999999),
    provider: int(params.get('provider'), 1, 99999999),
    company: int(params.get('company'), 1, 99999999),
    cast: int(params.get('cast'), 1, 99999999),
    cert: /^[A-Za-z0-9+./-]{1,10}$/.test(params.get('cert') ?? '') ? params.get('cert') : null,
    lang: /^[a-z]{2}$/.test(params.get('lang') ?? '') ? params.get('lang') : null,
    runtime: (RUNTIMES as readonly string[]).includes(params.get('runtime') ?? '') ? (params.get('runtime') as RuntimeKey) : null,
    decade: (() => {
      const d = int(params.get('decade'), 1900, 2020);
      return d !== null && d % 10 === 0 ? d : null;
    })(),
  };
}

/** Pasangan `k=v` untuk URL (urutan tetap agar stabil). */
export function filterParts(f: Filters): string[] {
  const parts: string[] = [];
  if (f.genre !== null) parts.push(`genre=${f.genre}`);
  if (f.year !== null) parts.push(`year=${f.year}`);
  if (f.rating !== null) parts.push(`rating=${f.rating}`);
  if (f.sort !== null) parts.push(`sort=${f.sort}`);
  if (f.keyword !== null) parts.push(`keyword=${f.keyword}`);
  if (f.collection !== null) parts.push(`collection=${f.collection}`);
  if (f.provider !== null) parts.push(`provider=${f.provider}`);
  if (f.company !== null) parts.push(`company=${f.company}`);
  if (f.cast !== null) parts.push(`cast=${f.cast}`);
  if (f.cert !== null) parts.push(`cert=${encodeURIComponent(f.cert)}`);
  if (f.lang !== null) parts.push(`lang=${f.lang}`);
  if (f.runtime !== null) parts.push(`runtime=${f.runtime}`);
  if (f.decade !== null) parts.push(`decade=${f.decade}`);
  return parts;
}

export const sameFilters = (a: Filters, b: Filters): boolean => filterParts(a).join('&') === filterParts(b).join('&');

/** Parameter TMDB /discover/movie untuk filter ini. */
export function discoverParams(f: Filters, today: string, region = 'ID'): Record<string, string | number> {
  const sort = f.sort ?? 'popularity.desc';
  const p: Record<string, string | number> = { sort_by: sort, include_adult: 'false' };
  if (f.genre !== null) p.with_genres = f.genre;
  if (f.keyword !== null) p.with_keywords = f.keyword;
  if (f.company !== null) p.with_companies = f.company;
  if (f.cast !== null) p.with_cast = f.cast;
  if (f.lang !== null) p.with_original_language = f.lang;
  if (f.runtime === 'short') p['with_runtime.lte'] = 89;
  if (f.runtime === 'medium') {
    p['with_runtime.gte'] = 90;
    p['with_runtime.lte'] = 120;
  }
  if (f.runtime === 'long') p['with_runtime.gte'] = 121;
  if (f.cert !== null) {
    p.certification_country = region;
    p.certification = f.cert;
  }
  if (f.year !== null) p.primary_release_year = f.year;
  if (f.provider !== null) {
    p.with_watch_providers = f.provider;
    p.watch_region = region;
    p.with_watch_monetization_types = 'flatrate|free|ads';
  }
  if (f.rating !== null) p['vote_average.gte'] = f.rating;
  // tanpa batas suara minimum, urutan rating dipenuhi film dengan 1-2 suara
  if (f.rating !== null || sort === 'vote_average.desc') p['vote_count.gte'] = sort === 'vote_average.desc' ? 300 : 50;
  if (sort === 'primary_release_date.desc') {
    p['primary_release_date.lte'] = today;
    p['vote_count.gte'] = 5;
  }
  if (f.decade !== null && f.year === null) {
    p['primary_release_date.gte'] = `${f.decade}-01-01`;
    const end = `${f.decade + 9}-12-31`;
    const cap = p['primary_release_date.lte'];
    p['primary_release_date.lte'] = typeof cap === 'string' && cap < end ? cap : end;
  }
  return p;
}
