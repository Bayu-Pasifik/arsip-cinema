import type { Movie, PersonSummary } from '../types/tmdb';
import { normalizeTv, type TvRaw } from './media';

/** Satu hasil /search/multi (bentuk longgar): `media_type` menentukan film, serial, atau orang. */
export type MultiRaw = { id: number; media_type: string } & Record<string, unknown>;

/**
 * Pisahkan hasil /search/multi: maksimal `maxPeople` orang dan `maxTitles` judul (film apa adanya, serial dipetakan ke bentuk film
 * dengan id ber-offset). Jenis lain diabaikan.
 */
export function splitMulti(results: MultiRaw[], maxPeople = 5, maxTitles = 8): { people: PersonSummary[]; titles: Movie[] } {
  const people: PersonSummary[] = [];
  const titles: Movie[] = [];
  for (const r of results) {
    if (r.media_type === 'person' && people.length < maxPeople) {
      people.push({
        id: r.id,
        name: String(r.name ?? ''),
        profile_path: (r.profile_path as string | null | undefined) ?? null,
        known_for_department: r.known_for_department as string | undefined,
      });
    } else if (r.media_type === 'tv' && titles.length < maxTitles) {
      titles.push(normalizeTv(r as unknown as TvRaw));
    } else if (r.media_type === 'movie' && titles.length < maxTitles) {
      titles.push({
        id: r.id,
        title: String(r.title ?? ''),
        overview: String(r.overview ?? ''),
        poster_path: (r.poster_path as string | null | undefined) ?? null,
        backdrop_path: (r.backdrop_path as string | null | undefined) ?? null,
        release_date: String(r.release_date ?? ''),
        vote_average: Number(r.vote_average ?? 0),
        vote_count: Number(r.vote_count ?? 0),
      });
    }
  }
  return { people, titles };
}
