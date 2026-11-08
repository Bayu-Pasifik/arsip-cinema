export interface LanguageOption {
  code: string;
  label: string;
}

/** Bahasa dari /configuration/languages. */
export interface RemoteLanguage {
  iso_639_1: string;
  english_name: string;
  name: string;
}

/** Kode bahasa data yang sah: "id" atau "id-ID". */
export const isLanguageCode = (code: string | null | undefined): code is string => !!code && /^[a-z]{2}(-[A-Z]{2})?$/.test(code);

/**
 * Gabungkan daftar kurasi (kode lengkap, mis. ja-JP) dengan bahasa dari TMDB. Bahasa yang kode dasarnya sudah ada di daftar
 * kurasi dilewati; sisanya ditambahkan dengan kode dua huruf, diurutkan menurut nama Inggris. "xx" (tanpa bahasa) dibuang.
 */
export function mergeLanguages(curated: readonly LanguageOption[], remote: readonly RemoteLanguage[]): LanguageOption[] {
  const known = new Set(curated.map((l) => l.code.split('-')[0]));
  const extra = remote
    .filter((r) => /^[a-z]{2}$/.test(r.iso_639_1) && r.iso_639_1 !== 'xx' && !known.has(r.iso_639_1))
    .sort((a, b) => a.english_name.localeCompare(b.english_name))
    .map((r) => ({ code: r.iso_639_1, label: r.name && r.name !== r.english_name ? `${r.name} (${r.english_name})` : r.english_name }));
  return [...curated, ...extra];
}
