export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  /** true bila item berasal dari data demo lokal (bukan TMDB) */
  demo?: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
  published_at: string;
}

export interface Translation {
  iso_3166_1: string;
  iso_639_1: string;
  name: string;
  english_name: string;
  data: { title?: string; overview?: string; tagline?: string; homepage?: string };
}

export interface Keyword {
  id: number;
  name: string;
}

export interface ReleaseDate {
  certification?: string;
  /** 1 Premiere, 2 Bioskop terbatas, 3 Bioskop, 4 Digital, 5 Fisik, 6 TV */
  type: number;
  release_date: string;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

/** Ketersediaan film di satu negara (data JustWatch lewat TMDB). */
export interface WatchRegion {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
}

export interface Review {
  id: string;
  author: string;
  content: string;
  created_at: string;
  url?: string;
  author_details?: { username?: string; rating: number | null };
}

export interface ImageInfo {
  file_path: string;
  width: number;
  height: number;
  vote_average: number;
  iso_639_1: string | null;
}

export interface MovieDetail extends Movie {
  tagline: string;
  runtime: number | null;
  genres: Genre[];
  status: string;
  original_title?: string;
  original_language?: string;
  /** USD; 0 = tidak diketahui */
  budget?: number;
  revenue?: number;
  popularity?: number;
  homepage?: string | null;
  imdb_id?: string | null;
  production_companies?: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  spoken_languages?: { iso_639_1: string; english_name: string; name: string }[];
  belongs_to_collection?: { id: number; name: string } | null;
  /** true bila sinopsis berasal dari bahasa Inggris karena terjemahan Indonesia kosong */
  overviewFallback?: boolean;
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  recommendations?: { results: Movie[]; page?: number; total_pages?: number };
  similar?: { results: Movie[]; page?: number; total_pages?: number };
  images?: { backdrops: ImageInfo[]; posters: ImageInfo[]; logos: ImageInfo[] };
  reviews?: { results: Review[] };
  'watch/providers'?: { results: Record<string, WatchRegion> };
  keywords?: { keywords: Keyword[] };
  translations?: { translations: Translation[] };
  external_ids?: {
    imdb_id?: string | null;
    facebook_id?: string | null;
    instagram_id?: string | null;
    twitter_id?: string | null;
    wikidata_id?: string | null;
  };
  release_dates?: { results: { iso_3166_1: string; release_dates: ReleaseDate[] }[] };
}

/** Film dalam filmografi seseorang (TMDB movie_credits). */
export interface CreditMovie extends Movie {
  popularity?: number;
  character?: string;
  job?: string;
}

/** Hasil /search/person. */
export interface PersonSummary {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
}

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  /** true bila biografi diambil dari bahasa Inggris karena terjemahan kosong */
  biographyFallback?: boolean;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department?: string;
  movie_credits?: { cast: CreditMovie[]; crew: CreditMovie[] };
  external_ids?: { imdb_id?: string | null };
}

export interface MovieListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

/** Kategori yang diambil dari TMDB. */
export type TmdbCategory = 'trending' | 'popular' | 'top_rated' | 'now_playing' | 'upcoming';
/** Daftar lokal milik pengguna (localStorage). */
export type CollectionKey = 'favorites' | 'watchlist';
export type Category = TmdbCategory | CollectionKey;

import type { Filters } from '../utils/filters';

export type ListSource =
  | { kind: 'category'; category: Category }
  | { kind: 'search'; query: string }
  | { kind: 'discover'; filters: Filters }
  | { kind: 'collection'; id: number }
  | { kind: 'demo' };

export type TmdbErrorKind = 'missing-key' | 'auth' | 'rate-limit' | 'not-found' | 'network' | 'http';
