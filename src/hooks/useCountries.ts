import { useEffect, useState } from 'react';
import { fetchCountries, hasApiKey } from '../services/tmdb';

let cache: ReadonlyMap<string, string> | null = null;
const EMPTY: ReadonlyMap<string, string> = new Map();

/** Kode negara → nama Inggris dari /configuration/countries (cadangan bila Intl tidak mengenal kodenya). */
export function useCountries(): ReadonlyMap<string, string> {
  const [names, setNames] = useState<ReadonlyMap<string, string>>(cache ?? EMPTY);
  useEffect(() => {
    if (cache || !hasApiKey) return;
    const c = new AbortController();
    fetchCountries(c.signal)
      .then((list) => {
        cache = new Map(list.map((x) => [x.iso_3166_1, x.english_name]));
        if (!c.signal.aborted) setNames(cache);
      })
      .catch(() => {
        /* cukup memakai Intl */
      });
    return () => c.abort();
  }, []);
  return names;
}
