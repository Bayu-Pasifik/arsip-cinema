import { describe, expect, it } from 'vitest';
import { episodeCredits, hasEpisodeCredits } from './episodes';
import type { Episode } from '../types/tmdb';

const ep = (extra: Partial<Episode>): Episode => ({ id: 1, episode_number: 1, name: 'Pilot', vote_average: 8, ...extra });

describe('episodeCredits', () => {
  it('memisah sutradara, penulis, dan bintang tamu', () => {
    const c = episodeCredits(
      ep({
        crew: [
          { id: 1, name: 'Vince', job: 'Director' },
          { id: 2, name: 'Vince', job: 'Writer' },
          { id: 3, name: 'Gaffer', job: 'Gaffer' },
        ],
        guest_stars: [{ id: 9, name: 'Guest A', character: 'X' }],
      }),
    );
    expect(c.directors.map((p) => p.id)).toEqual([1]);
    expect(c.writers.map((p) => p.id)).toEqual([2]);
    expect(c.guests.map((p) => p.name)).toEqual(['Guest A']);
    expect(hasEpisodeCredits(c)).toBe(true);
  });
  it('unik per orang dan membatasi bintang tamu', () => {
    const guests = Array.from({ length: 10 }, (_, i) => ({ id: i % 8, name: `G${i % 8}`, character: '' }));
    expect(episodeCredits(ep({ guest_stars: guests }), 3).guests).toHaveLength(3);
    expect(episodeCredits(ep({ guest_stars: guests })).guests).toHaveLength(6);
  });
  it('episode tanpa kredit', () => {
    expect(hasEpisodeCredits(episodeCredits(ep({})))).toBe(false);
  });
});
