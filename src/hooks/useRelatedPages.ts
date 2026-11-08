import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../services/language';
import { errorMessage, fetchRelated, type RelatedKind } from '../services/tmdb';
import type { Movie } from '../types/tmdb';
import { appendUnique } from '../utils/movies';

export interface RelatedPages {
  /** film dari halaman 2 dan seterusnya (halaman 1 sudah ada di detail film) */
  extra: Movie[];
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  loadMore: () => void;
}

/** Memuat halaman berikutnya dari /movie/{id}/recommendations atau /similar atas permintaan pengguna. */
export function useRelatedPages(movieId: number, kind: RelatedKind, firstPage: number, totalPages: number): RelatedPages {
  const language = useLanguage();
  const [extra, setExtra] = useState<Movie[]>([]);
  const [page, setPage] = useState(firstPage);
  const [total, setTotal] = useState(totalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);

  // film/bahasa/jumlah halaman berubah: mulai dari awal
  useEffect(() => {
    controller.current?.abort();
    busy.current = false;
    setExtra([]);
    setPage(firstPage);
    setTotal(totalPages);
    setLoading(false);
    setError(null);
  }, [movieId, kind, language, firstPage, totalPages]);

  useEffect(() => () => controller.current?.abort(), []);

  const loadMore = useCallback(() => {
    if (busy.current || page >= total) return;
    busy.current = true;
    const c = new AbortController();
    controller.current = c;
    setLoading(true);
    setError(null);
    fetchRelated(movieId, kind, page + 1, c.signal)
      .then((r) => {
        if (c.signal.aborted) return;
        setExtra((prev) => appendUnique(prev, r.movies));
        setPage(r.page);
        setTotal(r.totalPages);
      })
      .catch((err: unknown) => {
        if (c.signal.aborted || (err as Error).name === 'AbortError') return;
        setError(errorMessage(err));
      })
      .finally(() => {
        if (c.signal.aborted) return;
        busy.current = false;
        setLoading(false);
      });
  }, [movieId, kind, page, total]);

  return { extra, hasMore: page < total, loading, error, loadMore };
}
