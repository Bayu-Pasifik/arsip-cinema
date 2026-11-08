import type { CrewMember } from '../types/tmdb';

export const CREW_ROLES = [
  { key: 'creator', jobs: ['Creator'] },
  { key: 'director', jobs: ['Director'] },
  { key: 'writing', jobs: ['Screenplay', 'Writer', 'Story'] },
  { key: 'producer', jobs: ['Producer'] },
  { key: 'music', jobs: ['Original Music Composer'] },
  { key: 'cinematography', jobs: ['Director of Photography'] },
  { key: 'editing', jobs: ['Editor'] },
] as const;

export type CrewRoleKey = (typeof CREW_ROLES)[number]['key'];

export interface CrewGroup {
  key: CrewRoleKey;
  people: { id: number; name: string }[];
}

/** Kru utama per peran: unik per orang, urutan asli TMDB, maksimal `per` orang; peran tanpa orang dibuang. */
export function crewGroups(crew: CrewMember[] | undefined, per = 4): CrewGroup[] {
  const out: CrewGroup[] = [];
  for (const role of CREW_ROLES) {
    const seen = new Set<number>();
    const people: { id: number; name: string }[] = [];
    for (const c of crew ?? []) {
      if (!(role.jobs as readonly string[]).includes(c.job) || seen.has(c.id)) continue;
      seen.add(c.id);
      people.push({ id: c.id, name: c.name });
      if (people.length >= per) break;
    }
    if (people.length > 0) out.push({ key: role.key, people });
  }
  return out;
}
