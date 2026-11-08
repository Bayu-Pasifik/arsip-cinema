import type { Video } from '../types/tmdb';

/** Jenis video TMDB yang ditampilkan, urut tampil. */
export const VIDEO_TYPES = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes', 'Bloopers'] as const;
export type VideoType = (typeof VIDEO_TYPES)[number];

export interface VideoGroup {
  type: VideoType;
  videos: Video[];
}

/**
 * Video YouTube tambahan per jenis (terbaru dulu, maksimal `per` per jenis). Trailer utama (`exceptKey`) dan video
 * dengan key tidak sah dibuang; jenis yang tidak dikenal diabaikan.
 */
export function videoGroups(videos: Video[] | undefined, exceptKey: string | null, per = 6): VideoGroup[] {
  const valid = (videos ?? []).filter((v) => v.site === 'YouTube' && /^[\w-]{6,20}$/.test(v.key) && v.key !== exceptKey);
  const groups: VideoGroup[] = [];
  for (const type of VIDEO_TYPES) {
    const list = valid
      .filter((v) => v.type === type)
      .sort((a, b) => Date.parse(b.published_at || '') - Date.parse(a.published_at || '') || 0)
      .slice(0, per);
    if (list.length > 0) groups.push({ type, videos: list });
  }
  return groups;
}
