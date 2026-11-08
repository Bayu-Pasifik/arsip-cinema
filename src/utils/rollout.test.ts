import { describe, expect, it } from 'vitest';
import { releaseRows } from './rollout';

const rd = (certification: string, type: number, release_date: string) => ({ certification, type, release_date });
const label = (c: string) => c;

describe('releaseRows', () => {
  const results = [
    { iso_3166_1: 'FR', release_dates: [rd('12', 3, '1999-06-23T00:00:00.000Z')] },
    { iso_3166_1: 'US', release_dates: [rd('R', 3, '1999-03-31T00:00:00.000Z'), rd('R', 4, '1999-09-21T00:00:00.000Z'), rd('', 2, '1999-03-24T00:00:00.000Z')] },
    { iso_3166_1: 'ID', release_dates: [rd('13+', 3, '1999-05-01T00:00:00.000Z')] },
    { iso_3166_1: 'AU', release_dates: [rd('', 3, '')] },
    { iso_3166_1: 'DE', release_dates: [rd('16', 3, '1999-06-17T00:00:00.000Z')] },
  ];
  it('negara terpilih, lalu ID, US, lalu abjad; negara kosong dibuang', () => {
    expect(releaseRows(results, 'DE', label, 'en').map((r) => r.code)).toEqual(['DE', 'ID', 'US', 'FR']);
  });
  it('klasifikasi unik dan tanggal terurut, dipotong ke hari', () => {
    const us = releaseRows(results, 'US', label, 'en').find((r) => r.code === 'US');
    expect(us?.certs).toEqual(['R']);
    expect(us?.dates).toEqual([
      { type: 2, date: '1999-03-24' },
      { type: 3, date: '1999-03-31' },
      { type: 4, date: '1999-09-21' },
    ]);
  });
  it('serial: hanya klasifikasi tanpa tanggal tetap tampil', () => {
    const r = releaseRows([{ iso_3166_1: 'US', release_dates: [rd('TV-MA', 3, '')] }], 'ID', label, 'en');
    expect(r).toEqual([{ code: 'US', certs: ['TV-MA'], dates: [] }]);
  });
  it('aman untuk data kosong', () => {
    expect(releaseRows(undefined, 'ID', label, 'en')).toEqual([]);
  });
});
