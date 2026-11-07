import { describe, expect, it } from 'vitest';
import type { Movie } from '../types/tmdb';
import { appendUnique, canLoadMore } from './movies';

const m = (id: number): Movie => ({
  id,
  title: `F${id}`,
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '',
  vote_average: 0,
  vote_count: 0,
});

describe('appendUnique', () => {
  it('menambahkan film baru di belakang tanpa mengubah urutan lama', () => {
    expect(appendUnique([m(1), m(2)], [m(3), m(4)]).map((x) => x.id)).toEqual([1, 2, 3, 4]);
  });

  it('membuang duplikat (halaman TMDB bisa tumpang-tindih)', () => {
    expect(appendUnique([m(1), m(2)], [m(2), m(3), m(3)]).map((x) => x.id)).toEqual([1, 2, 3]);
  });

  it('memotong di batas maksimum', () => {
    expect(appendUnique([m(1), m(2)], [m(3), m(4), m(5)], 4).map((x) => x.id)).toEqual([1, 2, 3, 4]);
  });

  it('tidak memutasi array asli', () => {
    const prev = [m(1)];
    appendUnique(prev, [m(2)]);
    expect(prev).toHaveLength(1);
  });
});

describe('canLoadMore', () => {
  it('true bila halaman masih ada dan belum mencapai batas', () => {
    expect(canLoadMore(1, 5, 20, 100)).toBe(true);
  });
  it('false di halaman terakhir', () => {
    expect(canLoadMore(5, 5, 100, 1000)).toBe(false);
  });
  it('false bila sudah mencapai batas total', () => {
    expect(canLoadMore(2, 50, 100, 100)).toBe(false);
  });
});
