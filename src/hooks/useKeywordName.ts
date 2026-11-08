import { useEffect, useState } from 'react';
import { fetchKeyword, hasApiKey } from '../services/tmdb';

const cache = new Map<number, string>();

/** Nama kata kunci TMDB (selalu bahasa Inggris) untuk label filter; null selama belum diketahui. */
export function useKeywordName(id: number | null): string | null {
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
    fetchKeyword(id, controller.signal)
      .then((k) => {
        cache.set(id, k.name);
        if (!controller.signal.aborted) setName(k.name);
      })
      .catch(() => {
        /* label opsional */
      });
    return () => controller.abort();
  }, [id]);

  return name;
}
