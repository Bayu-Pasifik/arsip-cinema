import { useEffect, useState } from 'react';
import { demoMovies } from '../services/demo';
import { errorMessage, fetchCategory, searchMovies, TmdbError } from '../services/tmdb';
import type { ListSource, Movie } from '../types/tmdb';

export type ListState =
  | { status: 'loading'; movies: Movie[] }
  | { status: 'success'; movies: Movie[] }
  | { status: 'error'; movies: Movie[]; message: string; kind?: string };

/** Kunci stabil agar efek tidak berjalan ulang untuk objek source yang sama isinya. */
function sourceKey(s: ListSource): string {
  if (s.kind === 'category') return `c:${s.category}`;
  if (s.kind === 'search') return `s:${s.query}`;
  return 'demo';
}

export function useMovieList(source: ListSource, reloadToken: number): ListState {
  const [state, setState] = useState<ListState>({ status: 'loading', movies: [] });
  const key = sourceKey(source);

  useEffect(() => {
    if (source.kind === 'demo') {
      setState({ status: 'success', movies: demoMovies() });
      return;
    }
    const controller = new AbortController();
    setState((prev) => ({ status: 'loading', movies: prev.movies }));

    const run =
      source.kind === 'search'
        ? searchMovies(source.query, controller.signal)
        : fetchCategory(source.category, controller.signal);

    run
      .then((movies) => {
        if (!controller.signal.aborted) setState({ status: 'success', movies });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
        setState({
          status: 'error',
          movies: [],
          message: errorMessage(err),
          kind: err instanceof TmdbError ? err.kind : undefined,
        });
      });

    // Request lama dibatalkan saat query/kategori berubah atau komponen dilepas.
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken]);

  return state;
}
