import { useSyncExternalStore } from 'react';

/** Negara untuk data penyedia tontonan dan sertifikasi usia (kode ISO 3166-1), dipilih pengguna dan disimpan di perangkat. */
export const DEFAULT_REGION = 'ID';
const STORAGE_KEY = 'arsip-sinema:region';
const listeners = new Set<() => void>();

const valid = (code: string | null): code is string => !!code && /^[A-Z]{2}$/.test(code);

function load(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (valid(saved)) return saved;
  } catch {
    /* penyimpanan tidak tersedia (mode privat) */
  }
  return DEFAULT_REGION;
}

let current = load();

export const getRegion = () => current;

export function setRegion(code: string): void {
  if (!valid(code) || code === current) return;
  current = code;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* abaikan: pilihan tetap berlaku selama sesi */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useRegion(): string {
  return useSyncExternalStore(subscribe, getRegion, () => DEFAULT_REGION);
}
