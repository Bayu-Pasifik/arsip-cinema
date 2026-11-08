import { describe, expect, it } from 'vitest';
import { defaultSeason, orderSeasons } from './seasons';
import type { TvSeason } from '../types/tmdb';

const s = (n: number): TvSeason => ({ id: n + 100, season_number: n, name: `S${n}`, episode_count: 1 });

describe('defaultSeason', () => {
  it('musim 1 bila ada', () => {
    expect(defaultSeason([s(0), s(1), s(2)])).toBe(1);
  });
  it('musim bernomor terkecil bila tidak ada musim 1, dan abaikan Specials', () => {
    expect(defaultSeason([s(0), s(3), s(2)])).toBe(2);
    expect(defaultSeason([s(0)])).toBe(0);
    expect(defaultSeason([])).toBe(1);
  });
});

describe('orderSeasons', () => {
  it('Specials (0) di akhir, tidak mengubah input', () => {
    const input = [s(0), s(2), s(1)];
    expect(orderSeasons(input).map((x) => x.season_number)).toEqual([1, 2, 0]);
    expect(input.map((x) => x.season_number)).toEqual([0, 2, 1]);
    expect(orderSeasons(undefined)).toEqual([]);
  });
});
