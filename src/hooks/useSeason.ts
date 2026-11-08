import { useEffect, useState } from 'react';
import { useLanguage } from '../services/language';
import { errorMessage, fetchSeason } from '../services/tmdb';
import type { SeasonDetail } from '../types/tmdb';

export type SeasonState =
  | { status: 'loading' }
  | { status: 'success'; season: SeasonDetail }
  | { status: 'error'; message: string };

const cache = new Map<string, SeasonDetail>();

/** Episode satu musim serial TV (/tv/{id}/season/{n}), di-cache per serial+musim+bahasa. `id` = id ber-offset. */
export function useSeason(id: number, seasonNumber: number): SeasonState {
  const language = useLanguage();
  const key = `${id}|${seasonNumber}|${language}`;
  const [state, setState] = useState<SeasonState>(() => {
    const hit = cache.get(key);
    return hit ? { status: 'success', season: hit } : { status: 'loading' };
  });

  useEffect(() => {
    const hit = cache.get(key);
    if (hit) {
      setState({ status: 'success', season: hit });
      return;
    }
    setState({ status: 'loading' });
    const controller = new AbortController();
    fetchSeason(id, seasonNumber, controller.signal)
      .then((season) => {
        cache.set(key, season);
        if (!controller.signal.aborted) setState({ status: 'success', season });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
        setState({ status: 'error', message: errorMessage(err) });
      });
    return () => controller.abort();
  }, [id, seasonNumber, key]);

  return state;
}
