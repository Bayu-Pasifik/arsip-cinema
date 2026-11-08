import { useEffect, useState } from 'react';
import { fetchProviders, fetchRegions, hasApiKey } from '../services/tmdb';
import type { WatchProvider } from '../types/tmdb';

let regionsCache: string[] | null = null;
const providersCache = new Map<string, WatchProvider[]>();

/** Kode negara yang punya data penyedia tontonan (/watch/providers/regions). */
export function useWatchRegions(): string[] {
  const [regions, setRegions] = useState<string[]>(regionsCache ?? []);
  useEffect(() => {
    if (regionsCache || !hasApiKey) return;
    const c = new AbortController();
    fetchRegions(c.signal)
      .then((r) => {
        regionsCache = r;
        if (!c.signal.aborted) setRegions(r);
      })
      .catch(() => {
        /* pemilih negara disembunyikan bila gagal */
      });
    return () => c.abort();
  }, []);
  return regions;
}

/** Penyedia streaming populer di `region` (/watch/providers/movie), urut menurut prioritas tampil. */
export function useProviders(region: string): WatchProvider[] {
  const [providers, setProviders] = useState<WatchProvider[]>(providersCache.get(region) ?? []);
  useEffect(() => {
    const hit = providersCache.get(region);
    if (hit) {
      setProviders(hit);
      return;
    }
    setProviders([]);
    if (!hasApiKey) return;
    const c = new AbortController();
    fetchProviders(region, c.signal)
      .then((p) => {
        providersCache.set(region, p);
        if (!c.signal.aborted) setProviders(p);
      })
      .catch(() => {
        /* filter penyedia disembunyikan bila gagal */
      });
    return () => c.abort();
  }, [region]);
  return providers;
}
