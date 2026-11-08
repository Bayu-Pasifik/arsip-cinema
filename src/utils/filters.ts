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
}

export const NO_FILTERS: Filters = { genre: null, year: null, rating: null, sort: null, keyword: null, collection: null };

export const RATINGS = [5, 6, 7, 8] as const;

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
  return parts;
}

export const sameFilters = (a: Filters, b: Filters): boolean => filterParts(a).join('&') === filterParts(b).join('&');

/** Parameter TMDB /discover/movie untuk filter ini. */
export function discoverParams(f: Filters, today: string): Record<string, string | number> {
  const sort = f.sort ?? 'popularity.desc';
  const p: Record<string, string | number> = { sort_by: sort, include_adult: 'false' };
  if (f.genre !== null) p.with_genres = f.genre;
  if (f.keyword !== null) p.with_keywords = f.keyword;
  if (f.year !== null) p.primary_release_year = f.year;
  if (f.rating !== null) p['vote_average.gte'] = f.rating;
  // tanpa batas suara minimum, urutan rating dipenuhi film dengan 1-2 suara
  if (f.rating !== null || sort === 'vote_average.desc') p['vote_count.gte'] = sort === 'vote_average.desc' ? 300 : 50;
  if (sort === 'primary_release_date.desc') {
    p['primary_release_date.lte'] = today;
    p['vote_count.gte'] = 5;
  }
  return p;
}
