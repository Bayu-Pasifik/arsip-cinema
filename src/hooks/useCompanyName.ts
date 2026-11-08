import { useEffect, useState } from 'react';
import { fetchCompany, hasApiKey } from '../services/tmdb';
import type { CompanyDetail } from '../types/tmdb';

const cache = new Map<number, CompanyDetail>();

/** Detail studio/perusahaan TMDB (/company/{id}); null selama belum diketahui. Di-cache per id. */
export function useCompany(id: number | null): CompanyDetail | null {
  const [company, setCompany] = useState<CompanyDetail | null>(id !== null ? (cache.get(id) ?? null) : null);

  useEffect(() => {
    if (id === null) {
      setCompany(null);
      return;
    }
    const hit = cache.get(id);
    if (hit) {
      setCompany(hit);
      return;
    }
    setCompany(null);
    if (!hasApiKey) return;
    const controller = new AbortController();
    fetchCompany(id, controller.signal)
      .then((c) => {
        cache.set(id, c);
        if (!controller.signal.aborted) setCompany(c);
      })
      .catch(() => {
        /* info opsional */
      });
    return () => controller.abort();
  }, [id]);

  return company;
}

/** Nama studio untuk label filter; null selama belum diketahui. */
export const useCompanyName = (id: number | null): string | null => useCompany(id)?.name ?? null;
