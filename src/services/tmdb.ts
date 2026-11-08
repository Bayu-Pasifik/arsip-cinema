import type {
  Category,
  Genre,
  NetworkDetail,
  EpisodeGroup,
  EpisodeGroupSummary,
  PersonDetail,
  SeasonDetail,
  PersonSummary,
  CollectionDetail,
  CollectionSummary,
  ImageInfo,
  CompanyDetail,
  CompanySummary,
  CertificationMap,
  TmdbCategory,
  Movie,
  MovieDetail,
  MovieListResponse,
  Review,
  TmdbErrorKind,
  Video,
  WatchProvider,
} from '../types/tmdb';
import { translate } from '../i18n';
import { discoverParams, discoverParamsTv, type Filters } from '../utils/filters';
import { isTvId, normalizeTv, normalizeTvDetail, rawId, type TvRaw } from '../utils/media';
import { splitMulti, type MultiRaw } from '../utils/multi';
import type { RemoteLanguage } from '../utils/languages';
import { getLanguage } from './language';
import { getRegion } from './region';

const API_BASE = 'https://api.themoviedb.org/3';

const IMG_BASE = 'https://image.tmdb.org/t/p';

/**
 * Basis URL proxy gambar untuk tekstur WebGL (image.tmdb.org tidak mengirim header CORS).
 * Default `/tmdb-img` (proxy Vite saat dev/preview, rewrite Netlify/Vercel/Nginx di produksi);
 * ganti lewat VITE_TMDB_IMG_BASE bila proxy/CDN Anda ada di alamat lain.
 */
const IMG_PROXY = (import.meta.env.VITE_TMDB_IMG_BASE ?? '/tmdb-img').trim().replace(/\/+$/, '') || '/tmdb-img';

const rawKey = (import.meta.env.VITE_TMDB_API_KEY ?? '').trim();

/** Kunci v4 (JWT, diawali "eyJ") dikirim sebagai Bearer; kunci v3 sebagai query api_key. */
const isBearer = rawKey.startsWith('eyJ');

export const hasApiKey = rawKey.length > 0;

export class TmdbError extends Error {
  readonly kind: TmdbErrorKind;
  readonly status?: number;
  constructor(kind: TmdbErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'TmdbError';
    this.kind = kind;
    this.status = status;
  }
}

type Params = Record<string, string | number | undefined>;

async function request<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  if (!hasApiKey) {
    throw new TmdbError('missing-key', translate('error.missingKey'));
  }
  const url = new URL(API_BASE + path);
  // Bahasa data dipilih pengguna (lihat language.ts). Bila terjemahan kosong, TMDB mengembalikan teks kosong atau judul asli.
  url.searchParams.set('language', params.language ? String(params.language) : getLanguage());
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  if (!isBearer) url.searchParams.set('api_key', rawKey);

  let res: Response;
  try {
    res = await fetch(url, {
      signal,
      headers: isBearer ? { Authorization: `Bearer ${rawKey}` } : undefined,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new TmdbError('network', translate('error.network'));
  }

  if (!res.ok) {
    if (res.status === 401) throw new TmdbError('auth', translate('error.auth'), 401);
    if (res.status === 404) throw new TmdbError('not-found', translate('error.notFound'), 404);
    if (res.status === 429) throw new TmdbError('rate-limit', translate('error.rateLimit'), 429);
    throw new TmdbError('http', translate('error.http', { status: res.status }), res.status);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new TmdbError('http', translate('error.parse'), res.status);
  }
}

const CATEGORY_PATH: Record<TmdbCategory, string> = {
  trending: '/trending/movie/week',
  trending_day: '/trending/movie/day',
  trending_all: '/trending/all/week',
  popular: '/movie/popular',
  top_rated: '/movie/top_rated',
  now_playing: '/movie/now_playing',
  upcoming: '/movie/upcoming',
  tv_trending: '/trending/tv/week',
  tv_popular: '/tv/popular',
  tv_top_rated: '/tv/top_rated',
  tv_airing_today: '/tv/airing_today',
  tv_on_the_air: '/tv/on_the_air',
};

export const CATEGORIES: readonly Category[] = ['trending', 'trending_day', 'trending_all', 'popular', 'top_rated', 'now_playing', 'upcoming', 'favorites', 'watchlist'];

export const TV_CATEGORIES: readonly Category[] = ['tv_trending', 'tv_popular', 'tv_top_rated', 'tv_airing_today', 'tv_on_the_air', 'favorites', 'watchlist'];

export const isTvCategory = (c: string): boolean => c.startsWith('tv_');

/** Batas total film yang dimuat per daftar (5 halaman TMDB × 20), agar jumlah tekstur dan elemen DOM tetap wajar. */
export const MAX_TOTAL = 100;

export interface MoviePage {
  movies: Movie[];
  page: number;
  totalPages: number;
}

function toPage(data: MovieListResponse, tv = false): MoviePage {
  // TMDB membatasi page maksimum 500; serial TV dipetakan ke bentuk film (lihat utils/media.ts)
  const movies = tv ? (data.results as unknown as TvRaw[]).map(normalizeTv) : data.results;
  return { movies, page: data.page, totalPages: Math.min(data.total_pages, 500) };
}

export async function fetchCategory(category: TmdbCategory, page = 1, signal?: AbortSignal): Promise<MoviePage> {
  if (category === 'trending_all') {
    // campuran film + serial (+ orang, dibuang): tiap item punya media_type
    const data = await request<{ results: MultiRaw[]; page: number; total_pages: number }>(CATEGORY_PATH[category], { page }, signal);
    return { movies: splitMulti(data.results, 0, 100).titles, page: data.page, totalPages: Math.min(data.total_pages, 500) };
  }
  return toPage(await request<MovieListResponse>(CATEGORY_PATH[category], { page }, signal), isTvCategory(category));
}

export async function searchMovies(query: string, page = 1, signal?: AbortSignal): Promise<MoviePage> {
  return toPage(await request<MovieListResponse>('/search/movie', { query, page, include_adult: 'false' }, signal));
}

export async function discoverTv(filters: Filters, page = 1, signal?: AbortSignal): Promise<MoviePage> {
  const today = new Date().toISOString().slice(0, 10);
  return toPage(await request<MovieListResponse>('/discover/tv', { ...discoverParamsTv(filters, today, getRegion()), page }, signal), true);
}

export async function searchTv(query: string, page = 1, signal?: AbortSignal): Promise<MoviePage> {
  return toPage(await request<MovieListResponse>('/search/tv', { query, page, include_adult: 'false' }, signal), true);
}

export async function discoverMovies(filters: Filters, page = 1, signal?: AbortSignal): Promise<MoviePage> {
  const today = new Date().toISOString().slice(0, 10);
  return toPage(await request<MovieListResponse>('/discover/movie', { ...discoverParams(filters, today, getRegion()), page }, signal));
}

export const fetchCollection = (id: number, signal?: AbortSignal) => request<CollectionDetail>(`/collection/${id}`, {}, signal);

/** Poster dan backdrop koleksi (/collection/{id}/images); bahasa gambar mengikuti bahasa aktif, Inggris, dan tanpa teks. */
export function fetchCollectionImages(id: number, signal?: AbortSignal): Promise<{ posters: ImageInfo[]; backdrops: ImageInfo[] }> {
  const base = getLanguage().split('-')[0];
  return request<{ posters: ImageInfo[]; backdrops: ImageInfo[] }>(
    `/collection/${id}/images`,
    { include_image_language: [...new Set([base, 'en', 'null'])].join(',') },
    signal,
  );
}

/** Seluruh film satu koleksi (satu halaman), berurutan menurut tanggal rilis. */
export async function fetchCollectionMovies(id: number, signal?: AbortSignal): Promise<MoviePage> {
  const c = await fetchCollection(id, signal);
  const movies = [...c.parts].sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'));
  return { movies, page: 1, totalPages: 1 };
}

export type RelatedKind = 'recommendations' | 'similar';

export async function fetchRelated(id: number, kind: RelatedKind, page: number, signal?: AbortSignal): Promise<MoviePage> {
  const tv = isTvId(id);
  return toPage(await request<MovieListResponse>(`/${tv ? 'tv' : 'movie'}/${rawId(id)}/${kind}`, { page }, signal), tv);
}

export const fetchLanguages = (signal?: AbortSignal) => request<RemoteLanguage[]>('/configuration/languages', {}, signal);

/** Kode negara yang punya data penyedia tontonan. */
export async function fetchRegions(signal?: AbortSignal): Promise<string[]> {
  const data = await request<{ results: { iso_3166_1: string }[] }>('/watch/providers/regions', {}, signal);
  return data.results.map((r) => r.iso_3166_1).sort();
}

/** Penyedia streaming film di `region`, maksimal 40 teratas menurut prioritas tampil TMDB. */
export async function fetchProviders(region: string, signal?: AbortSignal, mode: 'movie' | 'tv' = 'movie'): Promise<WatchProvider[]> {
  const data = await request<{ results: (WatchProvider & { display_priorities?: Record<string, number> })[] }>(
    `/watch/providers/${mode}`,
    { watch_region: region },
    signal,
  );
  const rank = (p: { display_priorities?: Record<string, number> }) => p.display_priorities?.[region] ?? 999;
  return [...data.results].sort((a, b) => rank(a) - rank(b)).slice(0, 40);
}

/** Maksimal 8 kata kunci yang cocok dengan `query`. */
export async function searchKeywords(query: string, signal?: AbortSignal): Promise<{ id: number; name: string }[]> {
  const data = await request<{ results: { id: number; name: string }[] }>('/search/keyword', { query }, signal);
  return data.results.slice(0, 8);
}

export const fetchCompany = (id: number, signal?: AbortSignal) => request<CompanyDetail>(`/company/${id}`, {}, signal);

export const fetchPersonName = async (id: number, signal?: AbortSignal) =>
  (await request<{ name: string }>(`/person/${id}`, {}, signal)).name;

export type PeopleKind = 'popular' | 'trending';

export async function fetchPeople(kind: PeopleKind, page: number, signal?: AbortSignal): Promise<{ people: PersonSummary[]; page: number; totalPages: number }> {
  const path = kind === 'popular' ? '/person/popular' : '/trending/person/week';
  const data = await request<{ results: PersonSummary[]; page: number; total_pages: number }>(path, { page }, signal);
  return { people: data.results, page: data.page, totalPages: Math.min(data.total_pages, 500) };
}

/** Maksimal 3 franchise/koleksi yang cocok dengan `query`. */
export async function searchCollections(query: string, signal?: AbortSignal): Promise<CollectionSummary[]> {
  const data = await request<{ results: CollectionSummary[] }>('/search/collection', { query }, signal);
  return data.results.slice(0, 3);
}

export async function fetchCertifications(signal?: AbortSignal): Promise<CertificationMap> {
  return (await request<{ certifications: CertificationMap }>('/certification/movie/list', {}, signal)).certifications;
}

export const fetchCountries = (signal?: AbortSignal) =>
  request<{ iso_3166_1: string; english_name: string; native_name: string }[]>('/configuration/countries', {}, signal);

/** Cari film/orang TMDB dari ID IMDb (/find). null bila tidak ada padanannya. */
export async function findByImdb(imdbId: string, signal?: AbortSignal): Promise<{ kind: 'movie' | 'tv' | 'person'; id: number } | null> {
  const data = await request<{ movie_results: { id: number }[]; tv_results?: { id: number }[]; person_results: { id: number }[] }>(
    `/find/${imdbId}`,
    { external_source: 'imdb_id' },
    signal,
  );
  if (data.movie_results[0]) return { kind: 'movie', id: data.movie_results[0].id };
  if (data.tv_results?.[0]) return { kind: 'tv', id: data.tv_results[0].id };
  if (data.person_results[0]) return { kind: 'person', id: data.person_results[0].id };
  return null;
}

/** Maksimal 3 studio yang cocok dengan `query`. */
export async function searchCompanies(query: string, signal?: AbortSignal): Promise<CompanySummary[]> {
  const data = await request<{ results: CompanySummary[] }>('/search/company', { query }, signal);
  return data.results.slice(0, 3);
}

/** Episode satu musim; `id` = id ber-offset serial (lihat utils/media.ts). */
export const fetchSeason = (id: number, season: number, signal?: AbortSignal) =>
  request<SeasonDetail>(`/tv/${rawId(id)}/season/${season}`, {}, signal);

export const fetchNetwork = (id: number, signal?: AbortSignal) => request<NetworkDetail>(`/network/${id}`, {}, signal);

/** Urutan episode alternatif serial (DVD, produksi, …); `id` = id ber-offset. */
export async function fetchEpisodeGroups(id: number, signal?: AbortSignal): Promise<EpisodeGroupSummary[]> {
  const data = await request<{ results: EpisodeGroupSummary[] }>(`/tv/${rawId(id)}/episode_groups`, {}, signal);
  return data.results ?? [];
}

export const fetchEpisodeGroup = (groupId: string, signal?: AbortSignal) => request<EpisodeGroup>(`/tv/episode_group/${encodeURIComponent(groupId)}`, {}, signal);

export async function fetchKeyword(id: number, signal?: AbortSignal): Promise<{ id: number; name: string }> {
  return request<{ id: number; name: string }>(`/keyword/${id}`, {}, signal);
}

export async function fetchGenres(mode: 'movie' | 'tv' = 'movie', signal?: AbortSignal): Promise<Genre[]> {
  const data = await request<{ genres: Genre[] }>(`/genre/${mode}/list`, {}, signal);
  return data.genres;
}

/** Satu panggilan /search/multi: maksimal 5 aktor/kru dan 8 judul (film dan serial) yang cocok dengan `query`. */
export async function searchMulti(query: string, signal?: AbortSignal): Promise<{ people: PersonSummary[]; titles: Movie[] }> {
  const data = await request<{ results: MultiRaw[] }>('/search/multi', { query, include_adult: 'false' }, signal);
  return splitMulti(data.results);
}

export async function fetchPersonDetail(id: number, signal?: AbortSignal): Promise<PersonDetail> {
  const person = await request<PersonDetail>(`/person/${id}`, { append_to_response: 'movie_credits,tv_credits,external_ids,images,translations' }, signal);
  // Banyak biografi hanya tersedia dalam bahasa Inggris: pakai itu sebagai cadangan (diberi label di UI).
  if (!person.biography && getLanguage().split('-')[0] !== 'en') {
    try {
      const en = await request<PersonDetail>(`/person/${id}`, { language: 'en-US' }, signal);
      if (en.biography) return { ...person, biography: en.biography, biographyFallback: true };
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }
  return person;
}

export async function fetchMovieDetail(id: number, signal?: AbortSignal): Promise<MovieDetail> {
  const base = getLanguage().split('-')[0];
  const mediaLangs = [...new Set([base, 'en', 'null'])].join(',');
  const tv = isTvId(id);
  const rid = rawId(id);
  const path = tv ? '/tv' : '/movie';
  const mediaParams = { include_video_language: mediaLangs, include_image_language: mediaLangs };
  const detail = tv
    ? normalizeTvDetail(
        await request<TvRaw & Record<string, unknown>>(
          `/tv/${rid}`,
          { append_to_response: 'credits,aggregate_credits,videos,recommendations,similar,images,reviews,watch/providers,content_ratings,keywords,external_ids,translations', ...mediaParams },
          signal,
        ),
      )
    : await request<MovieDetail>(
        `/movie/${rid}`,
        {
          append_to_response: 'credits,videos,recommendations,similar,images,reviews,watch/providers,release_dates,keywords,external_ids,translations,alternative_titles,lists',
          ...mediaParams,
        },
        signal,
      );
  // Banyak film belum punya sinopsis/tagline bahasa Indonesia: ambil versi en-US sebagai cadangan (diberi label di UI).
  let result = detail;
  // Terjemahan sudah ikut di respons (append_to_response) → pakai versi Inggris dari sana tanpa request tambahan.
  const enData = detail.translations?.translations.find((t) => t.iso_639_1 === 'en' && t.data.overview)?.data;
  if (!detail.overview && enData?.overview) {
    result = { ...detail, overview: enData.overview, overviewFallback: true, tagline: detail.tagline || enData.tagline || '' };
  } else if (!detail.overview && base !== 'en') {
    try {
      const en = await request<MovieDetail>(`${path}/${rid}`, { language: 'en-US' }, signal);
      if (en.overview) result = { ...detail, overview: en.overview, overviewFallback: true, tagline: detail.tagline || en.tagline };
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }
  // Ulasan TMDB difilter menurut `language`; hampir semuanya berbahasa Inggris, jadi daftar id-ID biasanya kosong.
  if (result.reviews && result.reviews.results.length === 0) {
    try {
      const en = await request<{ results: Review[] }>(`${path}/${rid}/reviews`, { language: 'en-US' }, signal);
      if (en.results?.length) result = { ...result, reviews: { results: en.results } };
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }
  return result;
}

type ImageKind = 'poster' | 'backdrop' | 'profile' | 'logo';
const SIZES: Record<ImageKind, readonly string[]> = {
  poster: ['w185', 'w342', 'w500', 'w780'],
  backdrop: ['w300', 'w780', 'w1280'],
  profile: ['w45', 'w185', 'h632'],
  logo: ['w45', 'w92', 'w154', 'w185'],
};

/** Mengembalikan URL gambar TMDB; `size` harus salah satu ukuran resmi untuk jenis tersebut. */
export function imageUrl(path: string | null, kind: ImageKind, size: string): string | null {
  if (!path) return null;
  const safe = SIZES[kind].includes(size) ? size : SIZES[kind][1];
  return `${IMG_BASE}/${safe}${path}`;
}

/**
 * URL untuk tekstur WebGL. CDN gambar TMDB tidak mengirim header CORS, jadi diakses lewat
 * proxy same-origin (lihat IMG_PROXY).
 */
export function textureUrl(path: string | null, size: string): string | null {
  if (!path) return null;
  const safe = SIZES.poster.includes(size) ? size : SIZES.poster[1];
  return `${IMG_PROXY}/${safe}${path}`;
}

/** Tekstur backdrop untuk WebGL (lewat proxy same-origin, lihat textureUrl). */
export function backdropTextureUrl(path: string | null): string | null {
  return path ? `${IMG_PROXY}/w780${path}` : null;
}

/**
 * Memilih trailer terbaik dari daftar video TMDB: hanya YouTube bertipe "Trailer";
 * urutan prioritas: resmi → bahasa Indonesia → Inggris → paling baru.
 */
export function pickTrailer(videos: Video[] | undefined): Video | null {
  const candidates = (videos ?? []).filter(
    (v) => v.site === 'YouTube' && v.type === 'Trailer' && /^[\w-]{6,20}$/.test(v.key),
  );
  if (candidates.length === 0) return null;
  const lang = (v: Video) => (v.iso_639_1 === 'id' ? 2 : v.iso_639_1 === 'en' ? 1 : 0);
  return (
    [...candidates].sort(
      (a, b) =>
        Number(b.official) - Number(a.official) ||
        lang(b) - lang(a) ||
        Date.parse(b.published_at || '') - Date.parse(a.published_at || '') ||
        0,
    )[0] ?? null
  );
}

/** URL embed YouTube (domain tanpa cookie pelacak sebelum diputar). Kunci divalidasi untuk mencegah injeksi URL. */
export function youtubeEmbedUrl(key: string): string | null {
  return /^[\w-]{6,20}$/.test(key) ? `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&modestbranding=1` : null;
}

export function releaseYear(date: string): string {
  return date ? date.slice(0, 4) : '—';
}

export function errorMessage(err: unknown): string {
  if (err instanceof TmdbError) return err.message;
  return translate('error.unknown');
}
