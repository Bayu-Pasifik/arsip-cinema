import type {
  Category,
  Movie,
  MovieDetail,
  MovieListResponse,
  TmdbErrorKind,
} from '../types/tmdb';

const API_BASE = 'https://api.themoviedb.org/3';

/** Bahasa data TMDB (parameter `language`). Bila terjemahan kosong, TMDB mengembalikan teks kosong atau judul asli. */
const LANGUAGE = 'id-ID';
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
    throw new TmdbError('missing-key', 'VITE_TMDB_API_KEY belum diisi.');
  }
  const url = new URL(API_BASE + path);
  url.searchParams.set('language', params.language ? String(params.language) : LANGUAGE);
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
    throw new TmdbError('network', 'Tidak dapat terhubung ke TMDB. Periksa koneksi internet Anda.');
  }

  if (!res.ok) {
    if (res.status === 401) throw new TmdbError('auth', 'Kunci API TMDB ditolak (401).', 401);
    if (res.status === 404) throw new TmdbError('not-found', 'Data tidak ditemukan (404).', 404);
    if (res.status === 429) throw new TmdbError('rate-limit', 'Terlalu banyak permintaan ke TMDB (429).', 429);
    throw new TmdbError('http', `TMDB mengembalikan status ${res.status}.`, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new TmdbError('http', 'Respons TMDB tidak dapat dibaca.', res.status);
  }
}

const CATEGORY_PATH: Record<Category, string> = {
  trending: '/trending/movie/week',
  popular: '/movie/popular',
  top_rated: '/movie/top_rated',
  now_playing: '/movie/now_playing',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  trending: 'Trending',
  popular: 'Popular',
  top_rated: 'Top Rated',
  now_playing: 'Now Playing',
};

export const MAX_ITEMS = 20;

export async function fetchCategory(category: Category, signal?: AbortSignal): Promise<Movie[]> {
  const data = await request<MovieListResponse>(CATEGORY_PATH[category], { page: 1 }, signal);
  return data.results.slice(0, MAX_ITEMS);
}

export async function searchMovies(query: string, signal?: AbortSignal): Promise<Movie[]> {
  const data = await request<MovieListResponse>(
    '/search/movie',
    { query, page: 1, include_adult: 'false' },
    signal,
  );
  return data.results.slice(0, MAX_ITEMS);
}

export async function fetchMovieDetail(id: number, signal?: AbortSignal): Promise<MovieDetail> {
  const detail = await request<MovieDetail>(`/movie/${id}`, { append_to_response: 'credits' }, signal);
  // Banyak film belum punya sinopsis/tagline bahasa Indonesia: ambil versi en-US sebagai cadangan (diberi label di UI).
  if (!detail.overview) {
    try {
      const en = await request<MovieDetail>(`/movie/${id}`, { language: 'en-US' }, signal);
      if (en.overview) return { ...detail, overview: en.overview, overviewFallback: true, tagline: detail.tagline || en.tagline };
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }
  return detail;
}

type ImageKind = 'poster' | 'backdrop' | 'profile';
const SIZES: Record<ImageKind, readonly string[]> = {
  poster: ['w185', 'w342', 'w500', 'w780'],
  backdrop: ['w300', 'w780', 'w1280'],
  profile: ['w45', 'w185', 'h632'],
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

export function releaseYear(date: string): string {
  return date ? date.slice(0, 4) : '—';
}

export function errorMessage(err: unknown): string {
  if (err instanceof TmdbError) return err.message;
  return 'Terjadi kesalahan tak terduga.';
}
