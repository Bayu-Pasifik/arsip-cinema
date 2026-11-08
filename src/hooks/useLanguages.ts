import { useEffect, useState } from 'react';
import { LANGUAGES, useLanguage } from '../services/language';
import { fetchLanguages, fetchPrimaryTranslations, hasApiKey } from '../services/tmdb';
import { mergeLanguages, type LanguageOption, type RemoteLanguage } from '../utils/languages';

let remoteCache: RemoteLanguage[] | null = null;
let primaryCache: string[] | null = null;

/** Pilihan bahasa: daftar kurasi + semua bahasa TMDB (/configuration/languages) begitu terunduh. Bahasa terpilih selalu ada. */
export function useLanguages(): LanguageOption[] {
  const current = useLanguage();
  const [remote, setRemote] = useState<RemoteLanguage[]>(remoteCache ?? []);
  const [primary, setPrimary] = useState<string[]>(primaryCache ?? []);

  useEffect(() => {
    if (remoteCache || !hasApiKey) return;
    const controller = new AbortController();
    fetchLanguages(controller.signal)
      .then((r) => {
        remoteCache = r;
        if (!controller.signal.aborted) setRemote(r);
      })
      .catch(() => {
        /* tetap pakai daftar kurasi */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (primaryCache || !hasApiKey) return;
    const controller = new AbortController();
    fetchPrimaryTranslations(controller.signal)
      .then((p) => {
        primaryCache = p;
        if (!controller.signal.aborted) setPrimary(p);
      })
      .catch(() => {
        /* jatuh ke /configuration/languages */
      });
    return () => controller.abort();
  }, []);

  const list = mergeLanguages(LANGUAGES, remote, primary);
  return list.some((l) => l.code === current) ? list : [...list, { code: current, label: current }];
}
