import type { CreditMovie } from '../types/tmdb';

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
