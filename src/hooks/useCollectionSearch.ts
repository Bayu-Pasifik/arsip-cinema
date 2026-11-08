import { useEffect, useState } from 'react';
import { useLanguage } from '../services/language';
import { hasApiKey, searchCollections } from '../services/tmdb';
import type { CollectionSummary } from '../types/tmdb';

/** Franchise/koleksi yang cocok dengan `query` (sudah di-debounce); kosong bila query < 2 huruf. */
export function useCollectionSearch(query: string): CollectionSummary[] {
  const [found, setFound] = useState<CollectionSummary[]>([]);
  const language = useLanguage();
  useEffect(() => {
    if (!hasApiKey || query.length < 2) {
      setFound([]);
      return;
    }
    const c = new AbortController();
    searchCollections(query, c.signal)
      .then((r) => {
        if (!c.signal.aborted) setFound(r);
      })
      .catch(() => {
        if (!c.signal.aborted) setFound([]);
      });
    return () => c.abort();
  }, [query, language]);
  return found;
}
