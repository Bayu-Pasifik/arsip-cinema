import { useCallback, useEffect, useRef, useState } from 'react';
import { demoMovies } from '../services/demo';
import { isCollectionKey, type Collections } from '../services/collections';
import { useLanguage } from '../services/language';
import { discoverByGenre, errorMessage, fetchCategory, MAX_TOTAL, searchMovies, TmdbError, type MoviePage } from '../services/tmdb';
import type { ListSource, Movie } from '../types/tmdb';
import { appendUnique, canLoadMore } from '../utils/movies';

interface Base {
  movies: Movie[];
  /** bertambah tiap daftar BARU dimuat (ganti kategori/pencarian/coba lagi), bukan saat halaman berikutnya ditambahkan */
  generation: number;
  hasMore: boolean;
  loadingMore: boolean;
  moreError: string | null;
  loadMore: () => void;
}

export type ListState =
  | (Base & { status: 'loading' })
  | (Base & { status: 'success' })
  | (Base & { status: 'error'; message: string; kind?: string });

/** Kunci stabil agar efek tidak berjalan ulang untuk objek source yang sama isinya. */
function sourceKey(s: ListSource): string {
  if (s.kind === 'category') return `c:${s.category}`;
  if (s.kind === 'search') return `s:${s.query}`;
  if (s.kind === 'genre') return `g:${s.genre}`;
  return 'demo';
}

interface Core {
  status: 'loading' | 'success' | 'error';
  movies: Movie[];
  page: number;
  totalPages: number;
  generation: number;
  message?: string;
  kind?: string;
}

export function useMovieList(source: ListSource, reloadToken: number, local: Collections): ListState {
  const [core, setCore] = useState<Core>({ status: 'loading', movies: [], page: 0, totalPages: 0, generation: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const language = useLanguage();
  const key = `${sourceKey(source)}|${language}`;

  const sourceRef = useRef(source);
  sourceRef.current = source;
  const coreRef = useRef(core);
  coreRef.current = core;
  const moreController = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  const fetchPage = (src: ListSource, page: number, signal: AbortSignal): Promise<MoviePage> =>
    src.kind === 'search'
      ? searchMovies(src.query, page, signal)
      : src.kind === 'genre'
        ? discoverByGenre(src.genre, page, signal)
        : fetchCategory(src.kind === 'category' && !isCollectionKey(src.category) ? src.category : 'trending', page, signal);

  useEffect(() => {
    moreController.current?.abort();
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setMoreError(null);

    // Favorit/Watchlist berasal dari penyimpanan lokal: tidak ada request jaringan
    if (source.kind === 'category' && isCollectionKey(source.category)) return;

    if (source.kind === 'demo') {
      setCore((p) => ({ status: 'success', movies: demoMovies(), page: 1, totalPages: 1, generation: p.generation + 1 }));
      return;
    }
    const controller = new AbortController();
    setCore((p) => ({ ...p, status: 'loading' }));

    fetchPage(source, 1, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setCore((p) => ({
          status: 'success',
          movies: appendUnique([], r.movies, MAX_TOTAL),
          page: r.page,
          totalPages: r.totalPages,
          generation: p.generation + 1,
        }));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
        setCore((p) => ({
          status: 'error',
          movies: [],
          page: 0,
          totalPages: 0,
          generation: p.generation,
          message: errorMessage(err),
          kind: err instanceof TmdbError ? err.kind : undefined,
        }));
      });

    // Request lama dibatalkan saat query/kategori berubah atau komponen dilepas.
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken]);

  const hasMore = core.status === 'success' && canLoadMore(core.page, core.totalPages, core.movies.length, MAX_TOTAL);

  const loadMore = useCallback(() => {
    const c = coreRef.current;
    if (c.status !== 'success' || !canLoadMore(c.page, c.totalPages, c.movies.length, MAX_TOTAL)) return;
    if (loadingMoreRef.current) return;
    const controller = new AbortController();
    moreController.current = controller;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setMoreError(null);
    fetchPage(sourceRef.current, c.page + 1, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setCore((p) => ({
          ...p,
          movies: appendUnique(p.movies, r.movies, MAX_TOTAL),
          page: r.page,
          totalPages: r.totalPages,
        }));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
        setMoreError(errorMessage(err));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, []);

  useEffect(() => () => moreController.current?.abort(), []);

  // Daftar lokal diturunkan langsung dari store (selalu mutakhir saat film ditambah/dihapus).
  if (source.kind === 'category' && isCollectionKey(source.category)) {
    return {
      status: 'success',
      movies: local[source.category],
      generation: source.category === 'favorites' ? -1 : -2, // konstan per daftar: fokus tidak di-reset saat isi berubah
      hasMore: false,
      loadingMore: false,
      moreError: null,
      loadMore,
    };
  }

  const base: Base = {
    movies: core.movies,
    generation: core.generation,
    hasMore,
    loadingMore,
    moreError,
    loadMore,
  };
  if (core.status === 'error') return { ...base, status: 'error', message: core.message ?? '', kind: core.kind };
  return { ...base, status: core.status };
}
