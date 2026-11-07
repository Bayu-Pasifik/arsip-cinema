/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY?: string;
  /** Opsional: basis URL proxy gambar TMDB (default "/tmdb-img"). */
  readonly VITE_TMDB_IMG_BASE?: string;
}
