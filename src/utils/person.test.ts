import { describe, expect, it } from 'vitest';
import { bioOptions, crewFilms, filmography } from './person';
import type { CreditMovie } from '../types/tmdb';

const m = (id: number, popularity: number, poster: string | null = 'p.jpg', job?: string): CreditMovie => ({
  id,
  title: `m${id}`,
  overview: '',
  poster_path: poster,
  backdrop_path: null,
  release_date: '2000-01-01',
  vote_average: 7,
  vote_count: 10,
  popularity,
  job,
});

describe('filmography', () => {
  it('mengurutkan menurut popularitas, membuang duplikat dan film tanpa poster', () => {
    const r = filmography([m(1, 5), m(2, 50), m(1, 99), m(3, 10, null)]);
    expect(r.map((x) => x.id)).toEqual([1, 2]);
  });
  it('menghormati batas jumlah', () => {
    expect(filmography([m(1, 1), m(2, 2), m(3, 3)], 2).map((x) => x.id)).toEqual([3, 2]);
  });
  it('aman untuk data kosong', () => {
    expect(filmography(undefined)).toEqual([]);
  });
});

describe('crewFilms', () => {
  it('hanya job yang diminta', () => {
    const r = crewFilms([m(1, 1, 'p', 'Director'), m(2, 9, 'p', 'Editor')], ['Director']);
    expect(r.map((x) => x.id)).toEqual([1]);
  });
});

describe('bioOptions', () => {
  const tr = (iso: string, region: string, bio: string, en = iso) => ({ iso_639_1: iso, iso_3166_1: region, name: en, english_name: en, data: { biography: bio } });
  it('membuang bahasa aktif dan biografi kosong, urut nama bahasa', () => {
    const r = bioOptions([tr('id', 'ID', 'halo'), tr('ja', 'JP', '', 'Japanese'), tr('fr', 'FR', 'salut', 'French'), tr('de', 'DE', 'hallo', 'German')], 'id-ID');
    expect(r).toHaveLength(2);
    expect(r.map((o) => o.lang).sort()).toEqual(['de-DE', 'fr-FR']);
    expect(r.map((o) => o.biography).sort()).toEqual(['hallo', 'salut']);
  });
  it('wilayah muncul di label hanya bila satu bahasa punya varian ganda', () => {
    const r = bioOptions([tr('pt', 'BR', 'oi', 'Portuguese'), tr('pt', 'PT', 'olá', 'Portuguese')], 'en-US');
    expect(r[0].label).not.toBe(r[1].label);
    expect(bioOptions([tr('pt', 'BR', 'oi', 'Portuguese')], 'en-US')[0].label).toBe('Portuguese');
  });
  it('aman untuk data kosong', () => {
    expect(bioOptions(undefined, 'id-ID')).toEqual([]);
  });
});
