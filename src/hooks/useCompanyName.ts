import { useEffect, useState } from 'react';
import { fetchCompany, hasApiKey } from '../services/tmdb';

const cache = new Map<number, string>();

/** Nama studio/perusahaan produksi TMDB untuk label filter; null selama belum diketahui. */
export function useCompanyName(id: number | null): string | null {
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
    fetchCompany(id, controller.signal)
      .then((c) => {
        cache.set(id, c.name);
        if (!controller.signal.aborted) setName(c.name);
      })
      .catch(() => {
        /* label opsional */
      });
    return () => controller.abort();
  }, [id]);

  return name;
}
