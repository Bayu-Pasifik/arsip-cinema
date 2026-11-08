import { useEffect, useState } from 'react';
import { fetchPersonName, hasApiKey } from '../services/tmdb';

const cache = new Map<number, string>();

/** Nama aktor/kru TMDB untuk label filter; null selama belum diketahui. */
export function usePersonName(id: number | null): string | null {
  const [name, setName] = useState<string | null>(id !== null ? (cache.get(id) ?? null) : null);

  useEffect(() => {
    if (id === null) {
      setName(null);
      return;
    }
    const hit = cache.get(id);
    if (hit) {
      setName(hit);
      return;
    }
    setName(null);
    if (!hasApiKey) return;
    const controller = new AbortController();
    fetchPersonName(id, controller.signal)
      .then((n) => {
        cache.set(id, n);
        if (!controller.signal.aborted) setName(n);
      })
      .catch(() => {
        /* label opsional */
      });
    return () => controller.abort();
  }, [id]);

  return name;
}
