import { useEffect, useState } from 'react';
import { errorMessage, fetchMovieDetail } from '../services/tmdb';
import type { MovieDetail } from '../types/tmdb';

export type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; detail: MovieDetail }
  | { status: 'error'; message: string };

export function useMovieDetail(id: number | null): DetailState {
  const [state, setState] = useState<DetailState>({ status: 'idle' });

  useEffect(() => {
    if (id === null || id < 0) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchMovieDetail(id, controller.signal)
      .then((detail) => {
        if (!controller.signal.aborted) setState({ status: 'success', detail });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
        setState({ status: 'error', message: errorMessage(err) });
      });
    return () => controller.abort();
  }, [id]);

  return state;
}
