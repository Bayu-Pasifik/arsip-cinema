import { describe, expect, it } from 'vitest';
import type { MovieDetail } from '../types/tmdb';
import { certification, theatricalDateId } from './releases';

const detail = (results: unknown) => ({ release_dates: { results } }) as unknown as MovieDetail;

describe('certification', () => {
  it('kosong bila tidak ada data', () => {
    expect(certification(null)).toBeNull();
    expect(certification({} as MovieDetail)).toBeNull();
  });
  it('memprioritaskan Indonesia, lalu AS, dan melewati sertifikasi kosong', () => {
    const d = detail([
      { iso_3166_1: 'US', release_dates: [{ certification: 'R', type: 3, release_date: '1999-03-31T00:00:00.000Z' }] },
      { iso_3166_1: 'ID', release_dates: [{ certification: '', type: 3, release_date: '1999-05-01T00:00:00.000Z' }, { certification: '17+', type: 4, release_date: '' }] },
    ]);
    expect(certification(d)).toEqual({ region: 'ID', value: '17+' });
    expect(certification(detail([{ iso_3166_1: 'US', release_dates: [{ certification: 'PG-13' }] }]))).toEqual({ region: 'US', value: 'PG-13' });
    expect(certification(detail([{ iso_3166_1: 'JP', release_dates: [{ certification: 'G' }] }]))).toBeNull();
  });
});

describe('theatricalDateId', () => {
  it('mengambil tanggal bioskop paling awal di Indonesia', () => {
    const d = detail([
      { iso_3166_1: 'ID', release_dates: [{ type: 3, release_date: '1999-06-10T00:00:00.000Z' }, { type: 3, release_date: '1999-05-01T00:00:00.000Z' }, { type: 4, release_date: '1998-01-01T00:00:00.000Z' }] },
    ]);
    expect(theatricalDateId(d)).toBe('1999-05-01');
    expect(theatricalDateId(detail([]))).toBeNull();
  });
});
