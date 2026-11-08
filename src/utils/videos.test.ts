import { describe, expect, it } from 'vitest';
import { videoGroups } from './videos';
import type { Video } from '../types/tmdb';

const v = (key: string, type: string, date = '2020-01-01T00:00:00.000Z', site = 'YouTube'): Video => ({
  id: key,
  key,
  name: key,
  site,
  type,
  official: true,
  iso_639_1: 'en',
  published_at: date,
});

describe('videoGroups', () => {
  it('mengelompokkan per jenis dengan urutan tetap dan membuang trailer utama', () => {
    const r = videoGroups([v('clipAAAAAA', 'Clip'), v('trailMAIN1', 'Trailer'), v('teaseAAAAA', 'Teaser'), v('trailTWO22', 'Trailer')], 'trailMAIN1');
    expect(r.map((g) => g.type)).toEqual(['Trailer', 'Teaser', 'Clip']);
    expect(r[0].videos.map((x) => x.key)).toEqual(['trailTWO22']);
  });
  it('terbaru dulu dan dibatasi per jenis', () => {
    const list = [v('aaaaaa1', 'Clip', '2020-01-01'), v('aaaaaa2', 'Clip', '2022-01-01'), v('aaaaaa3', 'Clip', '2021-01-01')];
    expect(videoGroups(list, null, 2)[0].videos.map((x) => x.key)).toEqual(['aaaaaa2', 'aaaaaa3']);
  });
  it('membuang selain YouTube, key tak sah, dan jenis tak dikenal', () => {
    expect(videoGroups([v('vimeo12345', 'Clip', undefined, 'Vimeo'), v('a b', 'Clip'), v('xxxxxxxxx', 'Weird')], null)).toEqual([]);
    expect(videoGroups(undefined, null)).toEqual([]);
  });
});
