import type { Episode } from '../types/tmdb';

export interface Person {
  id: number;
  name: string;
}

export interface EpisodeCredits {
  directors: Person[];
  writers: Person[];
  guests: Person[];
}

const unique = (people: Person[], max: number): Person[] => {
  const seen = new Set<number>();
  const out: Person[] = [];
  for (const p of people) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push({ id: p.id, name: p.name });
    if (out.length >= max) break;
  }
  return out;
};

/** Sutradara, penulis, dan bintang tamu satu episode (unik per orang; bintang tamu maksimal `maxGuests`). */
export function episodeCredits(e: Episode, maxGuests = 6): EpisodeCredits {
  const crew = e.crew ?? [];
  return {
    directors: unique(crew.filter((c) => c.job === 'Director'), 4),
    writers: unique(crew.filter((c) => c.job === 'Writer' || c.job === 'Teleplay' || c.job === 'Story' || c.job === 'Screenplay'), 4),
    guests: unique(e.guest_stars ?? [], maxGuests),
  };
}

export const hasEpisodeCredits = (c: EpisodeCredits): boolean => c.directors.length + c.writers.length + c.guests.length > 0;
