import { describe, expect, it } from 'vitest';
import { inMode, isTvId, normalizeTv, normalizeTvCredit, normalizeTvDetail, rawId, tvId, TV_ID_OFFSET } from './media';

describe('id TV', () => {
  it('bolak-balik dan tidak menyentuh id film/demo', () => {
    expect(isTvId(tvId(1396))).toBe(true);
    expect(rawId(tvId(1396))).toBe(1396);
    expect(isTvId(603)).toBe(false);
    expect(isTvId(-3)).toBe(false);
    expect(rawId(603)).toBe(603);
    expect(tvId(1)).toBe(TV_ID_OFFSET + 1);
  });
});

describe('normalizeTv', () => {
  it('memetakan nama/tanggal tayang ke bentuk film dengan id ber-offset', () => {
    const m = normalizeTv({ id: 1396, name: 'Breaking Bad', first_air_date: '2008-01-20', vote_average: 8.9, poster_path: '/p.jpg' });
    expect(m).toMatchObject({ id: tvId(1396), title: 'Breaking Bad', release_date: '2008-01-20', vote_average: 8.9, media: 'tv', backdrop_path: null });
  });
});

describe('normalizeTvDetail', () => {
  const raw = {
    id: 1396,
    name: 'Breaking Bad',
    first_air_date: '2008-01-20',
    episode_run_time: [47],
    created_by: [{ id: 66633, name: 'Vince Gilligan' }],
    genres: [{ id: 18, name: 'Drama' }],
    number_of_seasons: 5,
    number_of_episodes: 62,
    credits: { cast: [{ id: 1, name: 'A' }], crew: [{ id: 2, name: 'B', job: 'Producer' }] },
    keywords: { results: [{ id: 9, name: 'drugs' }] },
    recommendations: { page: 1, total_pages: 3, results: [{ id: 60059, name: 'Better Call Saul' }] },
    content_ratings: { results: [{ iso_3166_1: 'US', rating: 'TV-MA' }] },
    translations: { translations: [{ iso_639_1: 'id', iso_3166_1: 'ID', name: 'Indonesia', english_name: 'Indonesian', data: { name: 'Bad', overview: 'Halo' } }] },
  };
  const d = normalizeTvDetail(raw);

  it('ringkasan dasar', () => {
    expect(d.id).toBe(tvId(1396));
    expect(d.runtime).toBe(47);
    expect(d.number_of_seasons).toBe(5);
    expect(d.genres[0].name).toBe('Drama');
  });
  it('pencipta menjadi kru "Creator" di depan', () => {
    expect(d.credits?.crew[0]).toEqual({ id: 66633, name: 'Vince Gilligan', job: 'Creator' });
    expect(d.credits?.crew).toHaveLength(2);
  });
  it('keywords, rekomendasi ber-offset, rating usia, terjemahan', () => {
    expect(d.keywords?.keywords[0].name).toBe('drugs');
    expect(d.recommendations?.results[0]).toMatchObject({ id: tvId(60059), title: 'Better Call Saul', media: 'tv' });
    expect(d.recommendations?.total_pages).toBe(3);
    expect(d.release_dates?.results[0].release_dates[0].certification).toBe('TV-MA');
    expect(d.translations?.translations[0].data.title).toBe('Bad');
  });
  it('aggregate_credits: pemeran dengan jumlah episode, kru per jabatan', () => {
    const agg = normalizeTvDetail({
      ...raw,
      aggregate_credits: {
        cast: [{ id: 17419, name: 'Bryan Cranston', profile_path: '/b.jpg', total_episode_count: 62, roles: [{ character: 'Walter White', episode_count: 62 }, { character: 'Walt' }] }],
        crew: [{ id: 7, name: 'M', jobs: [{ job: 'Producer', episode_count: 10 }, { job: 'Writer', episode_count: 3 }] }],
      },
    });
    expect(agg.credits?.cast).toEqual([{ id: 17419, name: 'Bryan Cranston', profile_path: '/b.jpg', character: 'Walter White / Walt', episodes: 62 }]);
    expect(agg.credits?.crew.map((c) => c.job)).toEqual(['Creator', 'Producer', 'Writer']);
  });
  it('aman untuk respons minimal', () => {
    const min = normalizeTvDetail({ id: 1, name: 'X' });
    expect(min.runtime).toBeNull();
    expect(min.genres).toEqual([]);
    expect(min.credits).toBeUndefined();
  });
});

describe('normalizeTvCredit', () => {
  it('membawa karakter dan popularitas dengan id ber-offset', () => {
    expect(normalizeTvCredit({ id: 1396, name: 'Breaking Bad', character: 'Walter', popularity: 55 })).toMatchObject({
      id: tvId(1396),
      title: 'Breaking Bad',
      character: 'Walter',
      popularity: 55,
      media: 'tv',
    });
  });
});

describe('inMode', () => {
  it('memisahkan film dan serial', () => {
    expect(inMode({}, 'movie')).toBe(true);
    expect(inMode({}, 'tv')).toBe(false);
    expect(inMode({ media: 'tv' }, 'tv')).toBe(true);
    expect(inMode({ media: 'tv' }, 'movie')).toBe(false);
  });
});
