import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../services/language';
import { errorMessage, fetchPeople, type PeopleKind } from '../services/tmdb';
import type { PersonSummary } from '../types/tmdb';

export interface PeopleList {
  people: PersonSummary[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

/** Daftar aktor/kru populer atau trending, dimuat per halaman. Berganti `kind`/bahasa = mulai dari awal. */
export function usePeopleList(kind: PeopleKind): PeopleList {
  const language = useLanguage();
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);

  const load = useCallback(
    (next: number) => {
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      busy.current = true;
      setLoading(true);
      setError(null);
      fetchPeople(kind, next, c.signal)
        .then((r) => {
          if (c.signal.aborted) return;
          setPeople((prev) => {
            const seen = new Set(next === 1 ? [] : prev.map((p) => p.id));
            return [...(next === 1 ? [] : prev), ...r.people.filter((p) => !seen.has(p.id))];
          });
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
    },
    [kind],
  );

  useEffect(() => {
    setPeople([]);
    setPage(0);
    load(1);
    return () => controller.current?.abort();
  }, [load, language]);

  const loadMore = useCallback(() => {
    if (!busy.current) load(page + 1); // page 0 = muat awal gagal → coba halaman 1 lagi
  }, [page, load]);

  return { people, loading, error, hasMore: page < total, loadMore };
}
