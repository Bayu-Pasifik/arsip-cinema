import { useEffect, useState } from 'react';
import { fetchCertifications, hasApiKey } from '../services/tmdb';
import type { CertificationMap } from '../types/tmdb';

let cache: CertificationMap | null = null;

/** Sertifikasi usia film (PG-13, R, 17+, …) di `region`, urut dari paling ringan; kosong bila negara itu tidak punya. */
export function useCertifications(region: string): string[] {
  const [all, setAll] = useState<CertificationMap | null>(cache);
  useEffect(() => {
    if (cache || !hasApiKey) return;
    const c = new AbortController();
    fetchCertifications(c.signal)
      .then((m) => {
        cache = m;
        if (!c.signal.aborted) setAll(m);
      })
      .catch(() => {
        /* filter sertifikasi disembunyikan bila gagal */
      });
    return () => c.abort();
  }, []);
  return [...(all?.[region] ?? [])].sort((a, b) => a.order - b.order).map((c) => c.certification);
}
