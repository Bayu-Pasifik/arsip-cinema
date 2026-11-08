import { useEffect, useState } from 'react';
import { useLanguage } from '../services/language';
import { errorMessage, fetchEpisodeGroup, fetchEpisodeGroups, hasApiKey } from '../services/tmdb';
import type { EpisodeGroup, EpisodeGroupSummary } from '../types/tmdb';

const listCache = new Map<number, EpisodeGroupSummary[]>();

/** Urutan episode alternatif serial (DVD, produksi, …) dari /tv/{id}/episode_groups; kosong bila tidak ada. `id` = id ber-offset. */
export function useEpisodeGroups(id: number): EpisodeGroupSummary[] {
  const [groups, setGroups] = useState<EpisodeGroupSummary[]>(listCache.get(id) ?? []);
  useEffect(() => {
    const hit = listCache.get(id);
    if (hit) {
      setGroups(hit);
      return;
    }
    setGroups([]);
    if (!hasApiKey) return;
    const c = new AbortController();
    fetchEpisodeGroups(id, c.signal)
      .then((g) => {
        listCache.set(id, g);
        if (!c.signal.aborted) setGroups(g);
      })
      .catch(() => {
        /* opsional */
      });
    return () => c.abort();
  }, [id]);
  return groups;
}

export type GroupState =
  | { status: 'loading' }
  | { status: 'success'; group: EpisodeGroup }
  | { status: 'error'; message: string };

const groupCache = new Map<string, EpisodeGroup>();

/** Isi satu urutan alternatif (/tv/episode_group/{id}), di-cache per id dan bahasa. */
export function useEpisodeGroup(groupId: string): GroupState {
  const language = useLanguage();
  const key = `${groupId}|${language}`;
  const [state, setState] = useState<GroupState>(() => {
    const hit = groupCache.get(key);
    return hit ? { status: 'success', group: hit } : { status: 'loading' };
  });

  useEffect(() => {
    const hit = groupCache.get(key);
    if (hit) {
      setState({ status: 'success', group: hit });
      return;
    }
    setState({ status: 'loading' });
    const c = new AbortController();
    fetchEpisodeGroup(groupId, c.signal)
      .then((group) => {
        groupCache.set(key, group);
        if (!c.signal.aborted) setState({ status: 'success', group });
      })
      .catch((err: unknown) => {
        if (c.signal.aborted || (err as Error).name === 'AbortError') return;
        setState({ status: 'error', message: errorMessage(err) });
      });
    return () => c.abort();
  }, [groupId, key]);

  return state;
}
