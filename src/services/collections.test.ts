import { describe, expect, it } from 'vitest';
import type { Movie } from '../types/tmdb';
import { isCollectionKey, isIn, MAX_PER_LIST, sanitize, toggleIn, toSaved } from './collections';

const m = (id: number, extra: Partial<Movie> = {}): Movie => ({
  id,
  title: `Film ${id}`,
  overview: 'x',
  poster_path: '/p.jpg',
  backdrop_path: null,
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 10,
  ...extra,
});

describe('toSaved', () => {
  it('hanya menyimpan field yang dikenal (tanpa penanda demo atau data lain)', () => {
    const saved = toSaved({ ...m(1), demo: true, extra: 'x' } as Movie);
    expect(Object.keys(saved).sort()).toEqual(
      ['backdrop_path', 'id', 'overview', 'poster_path', 'release_date', 'title', 'vote_average', 'vote_count'],
    );
  });
});

describe('toggleIn', () => {
  it('menambah di depan lalu menghapus saat dialihkan lagi', () => {
    const a = toggleIn([m(1)], m(2));
    expect(a.map((x) => x.id)).toEqual([2, 1]);
    expect(toggleIn(a, m(2)).map((x) => x.id)).toEqual([1]);
  });

  it('tidak memutasi daftar asli', () => {
    const list = [m(1)];
    toggleIn(list, m(2));
    expect(list).toHaveLength(1);
  });

  it('dibatasi MAX_PER_LIST dengan membuang yang paling lama', () => {
    const full = Array.from({ length: MAX_PER_LIST }, (_, i) => m(i + 1));
    const next = toggleIn(full, m(9999));
    expect(next).toHaveLength(MAX_PER_LIST);
    expect(next[0].id).toBe(9999);
    expect(next.some((x) => x.id === MAX_PER_LIST)).toBe(false);
  });
});

describe('sanitize', () => {
  it('data bukan objek → daftar kosong', () => {
    expect(sanitize(null)).toEqual({ favorites: [], watchlist: [] });
    expect(sanitize('rusak')).toEqual({ favorites: [], watchlist: [] });
    expect(sanitize(42)).toEqual({ favorites: [], watchlist: [] });
  });

  it('membuang entri tidak valid, id negatif (demo), dan duplikat', () => {
    const raw = {
      favorites: [m(1), m(1), { id: 'x', title: 'a' }, null, m(-5), { id: 3 }, m(2)],
      watchlist: 'bukan array',
    };
    const out = sanitize(raw);
    expect(out.favorites.map((x) => x.id)).toEqual([1, 2]);
    expect(out.watchlist).toEqual([]);
  });

  it('bolak-balik JSON mempertahankan isi', () => {
    const data = { favorites: [m(1)], watchlist: [m(2), m(3)] };
    expect(sanitize(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });
});

describe('helper', () => {
  it('isCollectionKey', () => {
    expect(isCollectionKey('favorites')).toBe(true);
    expect(isCollectionKey('watchlist')).toBe(true);
    expect(isCollectionKey('trending')).toBe(false);
  });

  it('isIn', () => {
    const c = { favorites: [m(1)], watchlist: [] };
    expect(isIn(c, 'favorites', 1)).toBe(true);
    expect(isIn(c, 'watchlist', 1)).toBe(false);
  });
});
