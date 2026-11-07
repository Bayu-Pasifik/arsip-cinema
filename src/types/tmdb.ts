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

export interface MovieDetail extends Movie {
  tagline: string;
  runtime: number | null;
  genres: Genre[];
  status: string;
  /** true bila sinopsis berasal dari bahasa Inggris karena terjemahan Indonesia kosong */
  overviewFallback?: boolean;
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
}

export interface MovieListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export type Category = 'trending' | 'popular' | 'top_rated' | 'now_playing';

export type ListSource =
  | { kind: 'category'; category: Category }
  | { kind: 'search'; query: string }
  | { kind: 'demo' };

export type TmdbErrorKind = 'missing-key' | 'auth' | 'rate-limit' | 'not-found' | 'network' | 'http';
