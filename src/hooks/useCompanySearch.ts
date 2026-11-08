import { useEffect, useState } from 'react';
import { hasApiKey, searchCompanies } from '../services/tmdb';
import type { CompanySummary } from '../types/tmdb';

/** Studio/perusahaan produksi yang cocok dengan `query` (sudah di-debounce); kosong bila query < 2 huruf. */
export function useCompanySearch(query: string): CompanySummary[] {
  const [found, setFound] = useState<CompanySummary[]>([]);
  useEffect(() => {
    if (!hasApiKey || query.length < 2) {
      setFound([]);
      return;
    }
    const c = new AbortController();
    searchCompanies(query, c.signal)
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
