import { describe, expect, it } from 'vitest';
import { browsePath, moviePath, parseRoute } from './useRoute';

import { NO_FILTERS } from '../utils/filters';

describe('parseRoute', () => {
  it('/ → home', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' });
  });

  it('/browse/:category dengan dan tanpa query', () => {
    expect(parseRoute('/browse/popular')).toEqual({ name: 'browse', category: 'popular', q: '', filters: NO_FILTERS });
    expect(parseRoute('/browse/top_rated?q=dune')).toEqual({ name: 'browse', category: 'top_rated', q: 'dune', filters: NO_FILTERS });
  });

  it('kategori trending_day valid', () => {
    expect(parseRoute('/browse/trending_day')).toMatchObject({ category: 'trending_day' });
  });

  it('kategori upcoming valid', () => {
    expect(parseRoute('/browse/upcoming')).toMatchObject({ category: 'upcoming' });
  });

  it('/people', () => {
    expect(parseRoute('/people')).toEqual({ name: 'people' });
  });

  it('/person/:id', () => {
    expect(parseRoute('/person/287')).toEqual({ name: 'person', id: 287 });
    expect(parseRoute('/person/abc')).toEqual({ name: 'home' });
  });

  it('daftar lokal favorites dan watchlist adalah kategori valid', () => {
    expect(parseRoute('/browse/favorites')).toEqual({ name: 'browse', category: 'favorites', q: '', filters: NO_FILTERS });
    expect(parseRoute('/browse/watchlist')).toMatchObject({ category: 'watchlist' });
  });

  it('kategori tidak dikenal atau kosong → trending', () => {
    expect(parseRoute('/browse/xyz')).toMatchObject({ category: 'trending' });
    expect(parseRoute('/browse')).toMatchObject({ category: 'trending' });
  });

  it('decode query berhuruf khusus', () => {
    expect(parseRoute('/browse/trending?q=the%20dark%20knight')).toMatchObject({ q: 'the dark knight', filters: NO_FILTERS });
  });

  it('/movie/:id valid, termasuk id negatif (demo)', () => {
    expect(parseRoute('/movie/155')).toEqual({ name: 'movie', id: 155 });
    expect(parseRoute('/movie/-3')).toEqual({ name: 'movie', id: -3 });
  });

  it('/movie dengan id tidak valid → home', () => {
    expect(parseRoute('/movie/abc')).toEqual({ name: 'home' });
    expect(parseRoute('/movie')).toEqual({ name: 'home' });
  });

  it('path tak dikenal → home', () => {
    expect(parseRoute('/entah/apa')).toEqual({ name: 'home' });
  });
});

describe('pembuat path', () => {
  it('browsePath menyertakan q hanya bila tidak kosong dan meng-encode', () => {
    expect(browsePath('popular')).toBe('/browse/popular');
    expect(browsePath('popular', '   ')).toBe('/browse/popular');
    expect(browsePath('trending', ' the dark ')).toBe('/browse/trending?q=the%20dark');
  });

  it('parameter filter: hanya nilai valid yang diterima, ikut di browsePath', () => {
    expect(parseRoute('/browse/trending?genre=28&year=1999')).toMatchObject({ filters: { genre: 28, year: 1999 } });
    expect(parseRoute('/browse/trending?genre=abc')).toMatchObject({ filters: NO_FILTERS });
    expect(browsePath('popular', '', { ...NO_FILTERS, genre: 35 })).toBe('/browse/popular?genre=35');
    expect(browsePath('popular', 'a b', { ...NO_FILTERS, genre: 35, rating: 7 })).toBe('/browse/popular?q=a%20b&genre=35&rating=7');
    const f = { ...NO_FILTERS, genre: 18, sort: 'revenue.desc' as const, keyword: 3 };
    expect(parseRoute(browsePath('top_rated', '', f))).toMatchObject({ category: 'top_rated', filters: f });
  });

  it('browsePath → parseRoute bolak-balik', () => {
    const route = parseRoute(browsePath('now_playing', 'dune & co'));
    expect(route).toEqual({ name: 'browse', category: 'now_playing', q: 'dune & co', filters: NO_FILTERS });
  });

  it('moviePath', () => {
    expect(moviePath(155)).toBe('/movie/155');
    expect(parseRoute(moviePath(42))).toEqual({ name: 'movie', id: 42 });
  });
});
