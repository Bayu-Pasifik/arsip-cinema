import { describe, expect, it } from 'vitest';
import { discoverParams, filterCount, filterParts, hasFilters, NO_FILTERS, parseFilters, sameFilters } from './filters';

const parse = (qs: string) => parseFilters(new URLSearchParams(qs));

describe('parseFilters', () => {
  it('membaca semua filter valid', () => {
    expect(parse('genre=28&year=1999&rating=7&sort=revenue.desc&keyword=9715&collection=10&provider=8&company=420&cast=6384&crew=525&cert=PG-13&lang=ko&runtime=long&decade=1990')).toEqual({
      genre: 28,
      year: 1999,
      rating: 7,
      sort: 'revenue.desc',
      keyword: 9715,
      collection: 10,
      provider: 8,
      company: 420,
      cast: 6384,
      crew: 525,
      cert: 'PG-13',
      lang: 'ko',
      runtime: 'long',
      decade: 1990,
    });
  });
  it('mengabaikan nilai tak valid', () => {
    expect(parse('genre=abc&year=5&rating=15&sort=drop table&keyword=-1')).toEqual(NO_FILTERS);
  });
});

describe('helpers', () => {
  it('hasFilters / filterCount', () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    const f = { ...NO_FILTERS, genre: 1, year: 2000 };
    expect(hasFilters(f)).toBe(true);
    expect(filterCount(f)).toBe(2);
  });
  it('filterParts berurutan tetap & sameFilters', () => {
    const f = { ...NO_FILTERS, year: 2001, genre: 18 };
    expect(filterParts(f)).toEqual(['genre=18', 'year=2001']);
    expect(sameFilters(f, { ...NO_FILTERS, genre: 18, year: 2001 })).toBe(true);
    expect(sameFilters(f, NO_FILTERS)).toBe(false);
  });
});

describe('discoverParams', () => {
  it('default: populer tanpa batas suara', () => {
    expect(discoverParams(NO_FILTERS, '2026-01-01')).toEqual({ sort_by: 'popularity.desc', include_adult: 'false' });
  });
  it('rating memasang batas suara minimum', () => {
    const p = discoverParams({ ...NO_FILTERS, rating: 7 }, '2026-01-01');
    expect(p['vote_average.gte']).toBe(7);
    expect(p['vote_count.gte']).toBe(50);
  });
  it('urutan rating tertinggi butuh banyak suara', () => {
    expect(discoverParams({ ...NO_FILTERS, sort: 'vote_average.desc' }, 'x')['vote_count.gte']).toBe(300);
  });
  it('urutan terbaru dibatasi sampai hari ini', () => {
    expect(discoverParams({ ...NO_FILTERS, sort: 'primary_release_date.desc' }, '2026-11-08')['primary_release_date.lte']).toBe('2026-11-08');
  });
  it('penyedia tontonan memakai negara', () => {
    const p = discoverParams({ ...NO_FILTERS, provider: 8 }, 'x', 'US');
    expect(p).toMatchObject({ with_watch_providers: 8, watch_region: 'US', with_watch_monetization_types: 'flatrate|free|ads' });
  });
  it('sertifikasi memakai negara dan aman untuk "+"', () => {
    const f = { ...NO_FILTERS, cert: '13+' };
    expect(discoverParams(f, 'x', 'SG')).toMatchObject({ certification_country: 'SG', certification: '13+' });
    expect(filterParts(f)).toEqual(['cert=13%2B']);
    expect(parseFilters(new URLSearchParams(filterParts(f)[0]))).toEqual(f);
    expect(parseFilters(new URLSearchParams('cert=<script>')).cert).toBeNull();
  });
  it('bahasa asli, durasi, dekade', () => {
    expect(discoverParams({ ...NO_FILTERS, lang: 'ja' }, 'x')).toMatchObject({ with_original_language: 'ja' });
    expect(discoverParams({ ...NO_FILTERS, runtime: 'short' }, 'x')).toMatchObject({ 'with_runtime.lte': 89 });
    expect(discoverParams({ ...NO_FILTERS, runtime: 'medium' }, 'x')).toMatchObject({ 'with_runtime.gte': 90, 'with_runtime.lte': 120 });
    expect(discoverParams({ ...NO_FILTERS, runtime: 'long' }, 'x')).toMatchObject({ 'with_runtime.gte': 121 });
    expect(discoverParams({ ...NO_FILTERS, decade: 1990 }, 'x')).toMatchObject({
      'primary_release_date.gte': '1990-01-01',
      'primary_release_date.lte': '1999-12-31',
    });
  });
  it('dekade berjalan tidak melewati hari ini saat urut terbaru', () => {
    const p = discoverParams({ ...NO_FILTERS, decade: 2020, sort: 'primary_release_date.desc' }, '2026-11-08');
    expect(p['primary_release_date.lte']).toBe('2026-11-08');
  });
  it('tahun menang atas dekade; dekade/lang/runtime tak valid ditolak', () => {
    const p = discoverParams({ ...NO_FILTERS, year: 1994, decade: 1990 }, 'x');
    expect(p['primary_release_date.gte']).toBeUndefined();
    const bad = parseFilters(new URLSearchParams('decade=1995&lang=XYZ&runtime=epic'));
    expect(bad).toEqual(NO_FILTERS);
  });
  it('genre, tahun, keyword diteruskan', () => {
    const p = discoverParams({ ...NO_FILTERS, genre: 35, year: 1994, keyword: 7 }, 'x');
    expect(p).toMatchObject({ with_genres: 35, primary_release_year: 1994, with_keywords: 7 });
    expect(discoverParams({ ...NO_FILTERS, company: 420 }, 'x')).toMatchObject({ with_companies: 420 });
    expect(discoverParams({ ...NO_FILTERS, cast: 6384 }, 'x')).toMatchObject({ with_cast: 6384 });
    expect(discoverParams({ ...NO_FILTERS, crew: 525 }, 'x')).toMatchObject({ with_crew: 525 });
  });
});
