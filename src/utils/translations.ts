import { getLanguage } from '../services/language';
import type { Translation } from '../types/tmdb';

export interface TranslationOption {
  /** kunci unik (bahasa + negara) */
  key: string;
  /** kode BCP 47 untuk atribut lang, mis. "pt-BR" */
  lang: string;
  label: string;
  title: string;
  tagline: string;
  overview: string;
}

/**
 * Daftar terjemahan yang punya sinopsis, tanpa bahasa yang sedang dipakai (sudah jadi tampilan utama), diurut nama bahasa.
 * Nama bahasa menurut bahasa aktif lewat Intl.DisplayNames; gagal → nama Inggris dari TMDB.
 */
export function translationOptions(translations: Translation[] | undefined): TranslationOption[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([getLanguage()], { type: 'language' });
  } catch {
    names = null;
  }
  const usable = (translations ?? []).filter((t) => t.iso_639_1 !== getLanguage().split('-')[0] && t.data?.overview?.trim());
  // wilayah hanya ditampilkan bila satu bahasa punya beberapa varian (mis. pt-BR dan pt-PT)
  const perLang = new Map<string, number>();
  for (const t of usable) perLang.set(t.iso_639_1, (perLang.get(t.iso_639_1) ?? 0) + 1);
  const label = (t: Translation) => {
    const code = (perLang.get(t.iso_639_1) ?? 0) > 1 && t.iso_3166_1 ? `${t.iso_639_1}-${t.iso_3166_1}` : t.iso_639_1;
    try {
      return names?.of(code) ?? t.english_name ?? t.iso_639_1;
    } catch {
      return t.english_name || t.iso_639_1;
    }
  };

  return usable
    .map((t) => ({
      key: `${t.iso_639_1}-${t.iso_3166_1}`,
      lang: t.iso_3166_1 ? `${t.iso_639_1}-${t.iso_3166_1}` : t.iso_639_1,
      label: label(t),
      title: t.data.title?.trim() ?? '',
      tagline: t.data.tagline?.trim() ?? '',
      overview: t.data.overview?.trim() ?? '',
    }))
    .sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
}
