import { describe, expect, it } from 'vitest';
import { tvId } from './media';
import { splitMulti, type MultiRaw } from './multi';

const r = (media_type: string, id: number, extra: Record<string, unknown> = {}): MultiRaw => ({ media_type, id, ...extra });

describe('splitMulti', () => {
  const results = [
    r('movie', 603, { title: 'The Matrix', release_date: '1999-03-30', vote_average: 8.2 }),
    r('tv', 1396, { name: 'Breaking Bad', first_air_date: '2008-01-20' }),
    r('person', 6384, { name: 'Keanu Reeves', known_for_department: 'Acting', profile_path: '/k.jpg' }),
    r('collection', 1),
  ];
  const out = splitMulti(results);

  it('memisah orang dan judul, mengabaikan jenis lain', () => {
    expect(out.people).toEqual([{ id: 6384, name: 'Keanu Reeves', profile_path: '/k.jpg', known_for_department: 'Acting' }]);
    expect(out.titles).toHaveLength(2);
  });
  it('film apa adanya, serial ber-offset dan bertanda tv', () => {
    expect(out.titles[0]).toMatchObject({ id: 603, title: 'The Matrix', release_date: '1999-03-30', vote_average: 8.2 });
    expect(out.titles[0].media).toBeUndefined();
    expect(out.titles[1]).toMatchObject({ id: tvId(1396), title: 'Breaking Bad', media: 'tv', release_date: '2008-01-20' });
  });
  it('menghormati batas jumlah', () => {
    const many = Array.from({ length: 12 }, (_, i) => r('person', i + 1, { name: `P${i}` }));
    expect(splitMulti(many, 3).people).toHaveLength(3);
    const titles = Array.from({ length: 12 }, (_, i) => r('movie', i + 1, { title: `M${i}` }));
    expect(splitMulti(titles, 5, 4).titles).toHaveLength(4);
    expect(splitMulti([])).toEqual({ people: [], titles: [] });
  });
});
