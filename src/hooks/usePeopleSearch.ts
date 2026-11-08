import { useEffect, useState } from 'react';
import { useLanguage } from '../services/language';
import { hasApiKey, searchPeople } from '../services/tmdb';
import type { PersonSummary } from '../types/tmdb';

/** Hasil pencarian orang (aktor/kru) untuk `query` yang sudah di-debounce; kosong bila query < 2 huruf. */
export function usePeopleSearch(query: string): PersonSummary[] {
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const language = useLanguage();

  useEffect(() => {
    if (!hasApiKey || query.length < 2) {
      setPeople([]);
      return;
    }
    const controller = new AbortController();
    searchPeople(query, controller.signal)
      .then((r) => {
        if (!controller.signal.aborted) setPeople(r);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPeople([]);
      });
    return () => controller.abort();
  }, [query, language]);

  return people;
}
