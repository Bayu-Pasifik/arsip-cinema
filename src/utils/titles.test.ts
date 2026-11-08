import { describe, expect, it } from 'vitest';
import { uniqueTitles } from './titles';

const a = (title: string, iso = 'US') => ({ iso_3166_1: iso, title, type: '' });

describe('uniqueTitles', () => {
  it('membuang judul yang sama dengan judul utama dan duplikat (tanpa beda huruf)', () => {
    const r = uniqueTitles([a('Matrix'), a('The Matrix'), a('the matrix', 'FR'), a('Matriks', 'ID')], 'The Matrix', 10);
    expect(r.map((x) => x.title)).toEqual(['Matrix', 'Matriks']);
  });
  it('menghormati batas dan aman untuk data kosong', () => {
    expect(uniqueTitles([a('A'), a('B'), a('C')], 'x', 2)).toHaveLength(2);
    expect(uniqueTitles(undefined, 'x', 5)).toEqual([]);
  });
});
