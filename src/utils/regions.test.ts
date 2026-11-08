import { describe, expect, it } from 'vitest';
import { regionLabel, sortRegions } from './regions';

const names = new Map([['XK', 'Kosovo']]);

describe('regionLabel', () => {
  it('memakai nama Intl bila ada', () => {
    expect(regionLabel('ID', 'Indonesia', names)).toBe('Indonesia');
  });
  it('jatuh ke nama TMDB bila Intl hanya mengembalikan kode', () => {
    expect(regionLabel('XK', 'XK', names)).toBe('Kosovo');
  });
  it('jatuh ke kode bila tidak ada nama sama sekali', () => {
    expect(regionLabel('ZZ', 'ZZ', names)).toBe('ZZ');
  });
});

describe('sortRegions', () => {
  it('mengurutkan menurut label, tidak mengubah input', () => {
    const input = ['US', 'ID', 'AU'];
    const label = (c: string) => ({ US: 'Amerika Serikat', ID: 'Indonesia', AU: 'Australia' })[c] ?? c;
    expect(sortRegions(input, label, 'id')).toEqual(['US', 'AU', 'ID']);
    expect(input).toEqual(['US', 'ID', 'AU']);
  });
});
