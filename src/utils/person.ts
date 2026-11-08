import { getLanguage } from '../services/language';
import type { CreditMovie, PersonTranslation } from '../types/tmdb';

/** Filmografi: unik per film, hanya yang punya poster, terpopuler dulu, maksimal `max`. */
export function filmography(cast: CreditMovie[] | undefined, max = 60): CreditMovie[] {
  const seen = new Set<number>();
  const out: CreditMovie[] = [];
  for (const m of [...(cast ?? [])].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))) {
    if (seen.has(m.id) || !m.poster_path) continue;
    seen.add(m.id);
    out.push(m);
    if (out.length >= max) break;
  }
  return out;
}

/** Film yang dikerjakan seseorang sebagai kru dengan salah satu `jobs` (mis. Director). */
export function crewFilms(crew: CreditMovie[] | undefined, jobs: string[], max = 30): CreditMovie[] {
  return filmography(
    (crew ?? []).filter((m) => m.job && jobs.includes(m.job)),
    max,
  );
}

export interface BioOption {
  key: string;
  /** kode BCP 47 untuk atribut lang */
  lang: string;
  label: string;
  biography: string;
}

/**
 * Terjemahan biografi yang tidak kosong, tanpa bahasa yang sedang dipakai, diurut nama bahasa (menurut bahasa aktif).
 * Wilayah (pt-BR/pt-PT) hanya dipakai di label bila satu bahasa punya beberapa varian.
 */
export function bioOptions(translations: PersonTranslation[] | undefined, language = getLanguage()): BioOption[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([language], { type: 'language' });
  } catch {
    names = null;
  }
  const usable = (translations ?? []).filter((t) => t.iso_639_1 !== language.split('-')[0] && t.data?.biography?.trim());
  const perLang = new Map<string, number>();
  for (const t of usable) perLang.set(t.iso_639_1, (perLang.get(t.iso_639_1) ?? 0) + 1);
  return usable
    .map((t) => {
      const code = (perLang.get(t.iso_639_1) ?? 0) > 1 && t.iso_3166_1 ? `${t.iso_639_1}-${t.iso_3166_1}` : t.iso_639_1;
      let label = t.english_name || t.iso_639_1;
      try {
        label = names?.of(code) ?? label;
      } catch {
        /* pakai nama Inggris */
      }
      return {
        key: `${t.iso_639_1}-${t.iso_3166_1}`,
        lang: t.iso_3166_1 ? `${t.iso_639_1}-${t.iso_3166_1}` : t.iso_639_1,
        label,
        biography: t.data.biography?.trim() ?? '',
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, language));
}
