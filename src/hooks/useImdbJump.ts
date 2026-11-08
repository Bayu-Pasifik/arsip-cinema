import { useEffect } from 'react';
import { findByImdb, hasApiKey } from '../services/tmdb';
import { isImdbId } from '../utils/imdb';

/** Bila `term` adalah ID IMDb (tt…/nm…), cari padanannya di TMDB (/find) dan panggil `onFound`. */
export function useImdbJump(term: string, onFound: (target: { kind: 'movie' | 'person'; id: number }) => void): void {
  useEffect(() => {
    if (!hasApiKey || !isImdbId(term)) return;
    const c = new AbortController();
    findByImdb(term.trim().toLowerCase(), c.signal)
      .then((hit) => {
        if (hit && !c.signal.aborted) onFound(hit);
      })
      .catch(() => {
        /* tidak ditemukan: biarkan pencarian biasa menampilkan "tidak ada hasil" */
      });
    return () => c.abort();
    // onFound sengaja tidak jadi dependensi: hanya term yang memicu pencarian
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);
}
