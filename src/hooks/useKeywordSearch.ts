import { useEffect, useState } from 'react';
import { hasApiKey, searchKeywords } from '../services/tmdb';
import type { Keyword } from '../types/tmdb';

/** Saran kata kunci TMDB untuk `query` (sudah di-debounce); kosong bila query < 2 huruf. */
export function useKeywordSearch(query: string): Keyword[] {
  const [found, setFound] = useState<Keyword[]>([]);
  useEffect(() => {
    if (!hasApiKey || query.length < 2) {
      setFound([]);
      return;
    }
    const c = new AbortController();
    searchKeywords(query, c.signal)
      .then((r) => {
        if (!c.signal.aborted) setFound(r);
      })
      .catch(() => {
        if (!c.signal.aborted) setFound([]);
      });
    return () => c.abort();
  }, [query]);
  return found;
}
