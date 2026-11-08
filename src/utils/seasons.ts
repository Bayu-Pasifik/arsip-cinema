import type { TvSeason } from '../types/tmdb';

/** Musim yang dibuka pertama: musim 1 bila ada, bila tidak musim bernomor terkecil (mis. hanya "Specials" = 0). */
export function defaultSeason(seasons: TvSeason[]): number {
  if (seasons.some((s) => s.season_number === 1)) return 1;
  const nums = seasons.map((s) => s.season_number).sort((a, b) => a - b);
  return nums.find((n) => n > 0) ?? nums[0] ?? 1;
}

/** Urutan tampil: musim 1, 2, 3, …, dan "Specials" (musim 0) di akhir. */
export function orderSeasons(seasons: TvSeason[] | undefined): TvSeason[] {
  return [...(seasons ?? [])].sort((a, b) => (a.season_number || Infinity) - (b.season_number || Infinity));
}
