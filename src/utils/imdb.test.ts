import { describe, expect, it } from 'vitest';
import { isImdbId } from './imdb';

describe('isImdbId', () => {
  it('mengenali ID film dan orang', () => {
    expect(isImdbId('tt0133093')).toBe(true);
    expect(isImdbId(' TT0133093 ')).toBe(true);
    expect(isImdbId('nm0000206')).toBe(true);
  });
  it('menolak teks biasa dan ID terlalu pendek', () => {
    expect(isImdbId('matrix')).toBe(false);
    expect(isImdbId('tt123')).toBe(false);
    expect(isImdbId('ttx0133093')).toBe(false);
  });
});
