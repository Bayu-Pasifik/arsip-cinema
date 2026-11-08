import { useEffect, useState } from 'react';
import { fetchNetwork, hasApiKey } from '../services/tmdb';
import type { NetworkDetail } from '../types/tmdb';

const cache = new Map<number, NetworkDetail>();

/** Detail jaringan/penyiar TV TMDB (/network/{id}); null selama belum diketahui. Di-cache per id. */
export function useNetwork(id: number | null): NetworkDetail | null {
  const [network, setNetwork] = useState<NetworkDetail | null>(id !== null ? (cache.get(id) ?? null) : null);

  useEffect(() => {
    if (id === null) {
      setNetwork(null);
      return;
    }
    const hit = cache.get(id);
    if (hit) {
      setNetwork(hit);
      return;
    }
    setNetwork(null);
    if (!hasApiKey) return;
    const controller = new AbortController();
    fetchNetwork(id, controller.signal)
      .then((n) => {
        cache.set(id, n);
        if (!controller.signal.aborted) setNetwork(n);
      })
      .catch(() => {
        /* info opsional */
      });
    return () => controller.abort();
  }, [id]);

  return network;
}
