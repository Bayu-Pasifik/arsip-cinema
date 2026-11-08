import { useEffect, useState } from 'react';
import { fetchScreened, hasApiKey } from '../services/tmdb';

const cache = new Map<number, ReadonlySet<string>>();
const EMPTY: ReadonlySet<string> = new Set();

export const screenedKey = (season: number, episode: number): string => `${season}-${episode}`;

/** Episode serial yang pernah tayang di bioskop (/tv/{id}/screened_theatrically) sebagai himpunan "musim-episode". `id` = id ber-offset. */
export function useScreened(id: number): ReadonlySet<string> {
  const [set, setSet] = useState<ReadonlySet<string>>(cache.get(id) ?? EMPTY);
  useEffect(() => {
    const hit = cache.get(id);
    if (hit) {
      setSet(hit);
      return;
    }
    setSet(EMPTY);
    if (!hasApiKey) return;
    const c = new AbortController();
    fetchScreened(id, c.signal)
      .then((list) => {
        const s = new Set(list.map((e) => screenedKey(e.season_number, e.episode_number)));
        cache.set(id, s);
        if (!c.signal.aborted) setSet(s);
      })
      .catch(() => {
        /* penanda opsional */
      });
    return () => c.abort();
  }, [id]);
  return set;
}
