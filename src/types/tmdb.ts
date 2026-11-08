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
  recommendations?: { results: Movie[] };
  similar?: { results: Movie[] };
  images?: { backdrops: ImageInfo[]; posters: ImageInfo[]; logos: ImageInfo[] };
}

export interface MovieListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

/** Kategori yang diambil dari TMDB. */
export type TmdbCategory = 'trending' | 'popular' | 'top_rated' | 'now_playing';
/** Daftar lokal milik pengguna (localStorage). */
export type CollectionKey = 'favorites' | 'watchlist';
export type Category = TmdbCategory | CollectionKey;

export type ListSource =
  | { kind: 'category'; category: Category }
  | { kind: 'search'; query: string }
  | { kind: 'demo' };

export type TmdbErrorKind = 'missing-key' | 'auth' | 'rate-limit' | 'not-found' | 'network' | 'http';
