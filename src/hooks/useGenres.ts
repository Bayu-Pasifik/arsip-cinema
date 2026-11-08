import { useEffect, useState } from 'react';
import { hasApiKey, fetchGenres } from '../services/tmdb';
import { useLanguage } from '../services/language';
import type { Genre } from '../types/tmdb';

const cache = new Map<string, Genre[]>();

/** Daftar genre TMDB (film atau serial TV) dalam bahasa aktif, di-cache. Kosong bila tanpa API key atau gagal dimuat. */
export function useGenres(mode: 'movie' | 'tv' = 'movie'): Genre[] {
  const language = useLanguage();
  const key = `${mode}|${language}`;
  const [genres, setGenres] = useState<Genre[]>(() => cache.get(key) ?? []);

  useEffect(() => {
    const hit = cache.get(key);
    if (hit) {
      setGenres(hit);
      return;
    }
    setGenres([]);
    if (!hasApiKey) return;
    const controller = new AbortController();
    fetchGenres(mode, controller.signal)
      .then((g) => {
        cache.set(key, g);
        if (!controller.signal.aborted) setGenres(g);
      })
      .catch(() => {
        /* genre opsional: pemilih disembunyikan bila gagal */
      });
    return () => controller.abort();
  }, [key, mode]);

  return genres;
}
