import { useEffect, useState } from 'react';
import { useLanguage } from '../services/language';
import { fetchCollection, hasApiKey } from '../services/tmdb';
import type { CollectionDetail } from '../types/tmdb';

const cache = new Map<string, CollectionDetail>();

/** Detail koleksi/franchise TMDB (menurut bahasa aktif); null selama belum diketahui. Di-cache per id dan bahasa. */
export function useCollection(id: number | null): CollectionDetail | null {
  const language = useLanguage();
  const key = id === null ? '' : `${id}|${language}`;
  const [collection, setCollection] = useState<CollectionDetail | null>(key ? (cache.get(key) ?? null) : null);

  useEffect(() => {
    if (id === null) {
      setCollection(null);
      return;
    }
    const hit = cache.get(key);
    if (hit) {
      setCollection(hit);
      return;
    }
    setCollection(null);
    if (!hasApiKey) return;
    const controller = new AbortController();
    fetchCollection(id, controller.signal)
      .then((c) => {
        cache.set(key, c);
        if (!controller.signal.aborted) setCollection(c);
      })
      .catch(() => {
        /* info opsional */
      });
    return () => controller.abort();
  }, [id, key]);

  return collection;
}

/** Nama koleksi untuk label; null selama belum diketahui. */
export const useCollectionName = (id: number | null): string | null => useCollection(id)?.name ?? null;
