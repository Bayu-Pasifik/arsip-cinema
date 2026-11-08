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

/** Nama bahasa dalam bahasa itu sendiri ("pt-PT" → "português (Portugal)"); gagal → kodenya. */
export function nativeLabel(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Kode bahasa data yang sah: "id" atau "id-ID". */
export const isLanguageCode = (code: string | null | undefined): code is string => !!code && /^[a-z]{2}(-[A-Z]{2})?$/.test(code);

/**
 * Gabungkan daftar kurasi (kode lengkap, mis. ja-JP) dengan bahasa dari TMDB. Bahasa yang kode dasarnya sudah ada di daftar
 * kurasi dilewati; sisanya ditambahkan dengan kode dua huruf, diurutkan menurut nama Inggris. "xx" (tanpa bahasa) dibuang.
 */
export function mergeLanguages(
  curated: readonly LanguageOption[],
  remote: readonly RemoteLanguage[],
  primary?: readonly string[],
): LanguageOption[] {
  // Daftar terjemahan utama TMDB (kode lengkap, mis. pt-PT) lebih tepat: hanya bahasa yang benar-benar punya terjemahan.
  if (primary && primary.length > 0) {
    const have = new Set(curated.map((l) => l.code));
    const extra = [...new Set(primary)]
      .filter((c) => isLanguageCode(c) && !have.has(c) && c.split('-')[0] !== 'xx')
      .map((code) => ({ code, label: nativeLabel(code) }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [...curated, ...extra];
  }
  const known = new Set(curated.map((l) => l.code.split('-')[0]));
  const extra = remote
    .filter((r) => /^[a-z]{2}$/.test(r.iso_639_1) && r.iso_639_1 !== 'xx' && !known.has(r.iso_639_1))
    .sort((a, b) => a.english_name.localeCompare(b.english_name))
    .map((r) => ({ code: r.iso_639_1, label: r.name && r.name !== r.english_name ? `${r.name} (${r.english_name})` : r.english_name }));
  return [...curated, ...extra];
}
