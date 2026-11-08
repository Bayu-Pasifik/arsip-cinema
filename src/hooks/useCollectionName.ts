import { useEffect, useState } from 'react';
import { useLanguage } from '../services/language';
import { fetchCollection, hasApiKey } from '../services/tmdb';

const cache = new Map<string, string>();

/** Nama koleksi/franchise TMDB (menurut bahasa aktif) untuk label; null selama belum diketahui. */
export function useCollectionName(id: number | null): string | null {
  const language = useLanguage();
  const key = id === null ? '' : `${id}|${language}`;
  const [name, setName] = useState<string | null>(key ? (cache.get(key) ?? null) : null);

  useEffect(() => {
    if (id === null) {
      setName(null);
      return;
    }
    const hit = cache.get(key);
    if (hit) {
      setName(hit);
      return;
    }
    setName(null);
    if (!hasApiKey) return;
    const controller = new AbortController();
    fetchCollection(id, controller.signal)
      .then((c) => {
        cache.set(key, c.name);
        if (!controller.signal.aborted) setName(c.name);
      })
      .catch(() => {
        /* label opsional */
      });
    return () => controller.abort();
  }, [id, key]);

  return name;
}
