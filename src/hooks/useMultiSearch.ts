import { useEffect, useState } from 'react';
import { useLanguage } from '../services/language';
import { hasApiKey, searchMulti } from '../services/tmdb';
import type { Movie, PersonSummary } from '../types/tmdb';

export interface MultiResults {
  people: PersonSummary[];
  titles: Movie[];
}

const EMPTY: MultiResults = { people: [], titles: [] };

/** Hasil /search/multi (aktor/kru dan judul film/serial) untuk `query` yang sudah di-debounce; kosong bila query < 2 huruf. */
export function useMultiSearch(query: string): MultiResults {
  const [found, setFound] = useState<MultiResults>(EMPTY);
  const language = useLanguage();

  useEffect(() => {
    if (!hasApiKey || query.length < 2) {
      setFound(EMPTY);
      return;
    }
    const controller = new AbortController();
    searchMulti(query, controller.signal)
      .then((r) => {
        if (!controller.signal.aborted) setFound(r);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFound(EMPTY);
      });
    return () => controller.abort();
  }, [query, language]);

  return found;
}
