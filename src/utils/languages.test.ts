import { describe, expect, it } from 'vitest';
import { isLanguageCode, mergeLanguages, nativeLabel } from './languages';

const curated = [
  { code: 'id-ID', label: 'Indonesia' },
  { code: 'ja-JP', label: '日本語' },
];

describe('isLanguageCode', () => {
  it('menerima id dan id-ID, menolak lainnya', () => {
    expect(isLanguageCode('sv')).toBe(true);
    expect(isLanguageCode('pt-BR')).toBe(true);
    expect(isLanguageCode('SV')).toBe(false);
    expect(isLanguageCode('english')).toBe(false);
    expect(isLanguageCode(null)).toBe(false);
  });
});

describe('mergeLanguages', () => {
  const remote = [
    { iso_639_1: 'sv', english_name: 'Swedish', name: 'svenska' },
    { iso_639_1: 'ja', english_name: 'Japanese', name: '日本語' },
    { iso_639_1: 'xx', english_name: 'No Language', name: 'No Language' },
    { iso_639_1: 'af', english_name: 'Afrikaans', name: 'Afrikaans' },
  ];
  it('menambahkan bahasa baru berurutan, melewati yang sudah ada dan "xx"', () => {
    const r = mergeLanguages(curated, remote);
    expect(r.map((l) => l.code)).toEqual(['id-ID', 'ja-JP', 'af', 'sv']);
  });
  it('label memuat nama asli dan nama Inggris bila berbeda', () => {
    const r = mergeLanguages(curated, remote);
    expect(r.find((l) => l.code === 'sv')?.label).toBe('svenska (Swedish)');
    expect(r.find((l) => l.code === 'af')?.label).toBe('Afrikaans');
  });
  it('primary_translations: hanya kode yang punya terjemahan, varian ikut, kurasi tidak digandakan', () => {
    const r = mergeLanguages(curated, remote, ['id-ID', 'ja-JP', 'pt-PT', 'sv-SE', 'xx-XX', 'bukan-kode', 'sv-SE']);
    expect(r.map((l) => l.code)).toEqual(['id-ID', 'ja-JP', ...r.slice(2).map((l) => l.code)]);
    expect(r.slice(2).map((l) => l.code).sort()).toEqual(['pt-PT', 'sv-SE']);
  });
  it('primary kosong jatuh ke daftar /configuration/languages', () => {
    expect(mergeLanguages(curated, remote, []).map((l) => l.code)).toEqual(['id-ID', 'ja-JP', 'af', 'sv']);
  });
  it('nativeLabel selalu mengembalikan teks', () => {
    expect(nativeLabel('sv-SE').length).toBeGreaterThan(0);
    expect(nativeLabel('???')).toBe('???');
  });
  it('tanpa data remote = daftar kurasi', () => {
    expect(mergeLanguages(curated, [])).toEqual(curated);
  });
});
