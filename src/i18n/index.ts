import { useCallback } from 'react';
import { getLanguage, useLanguage } from '../services/language';
import { en, id, type MessageKey, type Messages } from './messages';

export type { MessageKey };

/** Kamus per kode bahasa dasar (ISO 639-1). Bahasa tanpa kamus memakai bahasa Inggris. */
const DICTIONARIES: Record<string, Messages> = { id, en };
const FALLBACK = 'en';

type Vars = Record<string, string | number>;

/** Kode bahasa antarmuka dari kode bahasa data TMDB ("ja-JP" → "ja" → kamus tersedia atau "en"). */
export function uiLocale(language: string): string {
  const base = language.split('-')[0];
  return base in DICTIONARIES ? base : FALLBACK;
}

export function translateFor(language: string, key: MessageKey, vars?: Vars): string {
  const text = DICTIONARIES[uiLocale(language)][key] ?? DICTIONARIES[FALLBACK][key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
}

/** Terjemahan di luar React (galat, util); memakai bahasa aktif saat dipanggil. */
export const translate = (key: MessageKey, vars?: Vars): string => translateFor(getLanguage(), key, vars);

/** Hook untuk komponen: komponen dirender ulang saat bahasa diganti. */
export function useT(): (key: MessageKey, vars?: Vars) => string {
  const language = useLanguage();
  return useCallback((key, vars) => translateFor(language, key, vars), [language]);
}
