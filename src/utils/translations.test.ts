import { describe, expect, it } from 'vitest';
import type { Translation } from '../types/tmdb';
import { translationOptions } from './translations';

const tr = (iso: string, country: string, data: Translation['data']): Translation => ({
  iso_639_1: iso,
  iso_3166_1: country,
  name: iso,
  english_name: iso,
  data,
});

describe('translationOptions', () => {
  it('kosong bila tidak ada data', () => {
    expect(translationOptions(undefined)).toEqual([]);
    expect(translationOptions([])).toEqual([]);
  });

  it('membuang bahasa Indonesia dan terjemahan tanpa sinopsis', () => {
    const opts = translationOptions([
      tr('id', 'ID', { overview: 'Halo' }),
      tr('fr', 'FR', { overview: '' }),
      tr('de', 'DE', { overview: 'Hallo', title: 'Die Matrix' }),
    ]);
    expect(opts).toHaveLength(1);
    expect(opts[0]).toMatchObject({ key: 'de-DE', lang: 'de-DE', title: 'Die Matrix', overview: 'Hallo' });
  });

  it('menampilkan wilayah hanya bila satu bahasa punya beberapa varian', () => {
    const opts = translationOptions([
      tr('ja', 'JP', { overview: 'a' }),
      tr('pt', 'BR', { overview: 'b' }),
      tr('pt', 'PT', { overview: 'c' }),
    ]);
    const ja = opts.find((o) => o.key === 'ja-JP')!;
    const ptBr = opts.find((o) => o.key === 'pt-BR')!;
    const ptPt = opts.find((o) => o.key === 'pt-PT')!;
    expect(ja.label).not.toContain('(');
    expect(ptBr.label).not.toBe(ptPt.label);
  });

  it('mengurutkan menurut nama bahasa', () => {
    const opts = translationOptions([tr('ja', 'JP', { overview: 'a' }), tr('de', 'DE', { overview: 'b' }), tr('fr', 'FR', { overview: 'c' })]);
    expect(opts.map((o) => o.key)).toEqual(['de-DE', 'fr-FR', 'ja-JP'].sort((a, b) => opts.find((o) => o.key === a)!.label.localeCompare(opts.find((o) => o.key === b)!.label, 'id')));
  });
});
