import { useEffect, useState } from 'react';
import { hasApiKey, fetchGenres } from '../services/tmdb';
import { useLanguage } from '../services/language';
import type { Genre } from '../types/tmdb';

const cache = new Map<string, Genre[]>();

/** Daftar genre film TMDB dalam bahasa aktif (di-cache per bahasa). Kosong bila tanpa API key atau gagal dimuat. */
export function useGenres(): Genre[] {
  const language = useLanguage();
  const [genres, setGenres] = useState<Genre[]>(() => cache.get(language) ?? []);

  useEffect(() => {
    const hit = cache.get(language);
    if (hit) {
      setGenres(hit);
      return;
    }
    if (!hasApiKey) return;
    const controller = new AbortController();
    fetchGenres(controller.signal)
      .then((g) => {
        cache.set(language, g);
        if (!controller.signal.aborted) setGenres(g);
      })
      .catch(() => {
        /* genre opsional: pemilih disembunyikan bila gagal */
      });
    return () => controller.abort();
  }, [language]);

  return genres;
}
