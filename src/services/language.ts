import { useSyncExternalStore } from 'react';

/** Bahasa data TMDB yang dapat dipilih (parameter `language`, format ISO 639-1 + ISO 3166-1). */
export const LANGUAGES = [
  { code: 'id-ID', label: 'Indonesia' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'zh-TW', label: '中文 (繁體)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'ar-SA', label: 'العربية' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'th-TH', label: 'ไทย' },
  { code: 'vi-VN', label: 'Tiếng Việt' },
  { code: 'ms-MY', label: 'Bahasa Melayu' },
  { code: 'tr-TR', label: 'Türkçe' },
  { code: 'nl-NL', label: 'Nederlands' },
] as const;

export const DEFAULT_LANGUAGE = 'id-ID';
const STORAGE_KEY = 'arsip-sinema:language';
const listeners = new Set<() => void>();

const isSupported = (code: string | null): code is string => !!code && LANGUAGES.some((l) => l.code === code);

function load(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {
    /* penyimpanan tidak tersedia (mode privat) */
  }
  return DEFAULT_LANGUAGE;
}

let current = load();

export const getLanguage = () => current;

export function setLanguage(code: string): void {
  if (!isSupported(code) || code === current) return;
  current = code;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* abaikan: pilihan tetap berlaku selama sesi */
  }
  document.documentElement.lang = code.split('-')[0];
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Bahasa data TMDB aktif; komponen yang memakainya dirender ulang saat bahasa diganti. */
export function useLanguage(): string {
  return useSyncExternalStore(subscribe, getLanguage, () => DEFAULT_LANGUAGE);
}
