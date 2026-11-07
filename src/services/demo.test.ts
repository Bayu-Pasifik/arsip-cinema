import { describe, expect, it } from 'vitest';
import { demoMovies } from './demo';

describe('demoMovies', () => {
  it('selalu berlabel demo, tanpa poster, dengan id negatif unik (tidak bertabrakan dengan TMDB)', () => {
    const items = demoMovies();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((m) => m.demo === true && m.poster_path === null && m.id < 0)).toBe(true);
    expect(new Set(items.map((m) => m.id)).size).toBe(items.length);
  });
});
