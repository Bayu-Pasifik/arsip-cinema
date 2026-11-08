import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Tmdb = typeof import('./tmdb');

async function load(key: string | undefined): Promise<Tmdb> {
  vi.resetModules();
  vi.stubEnv('VITE_TMDB_API_KEY', key ?? '');
  return import('./tmdb');
}

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('URL gambar', () => {
  it('imageUrl memakai ukuran resmi, ukuran tak dikenal jatuh ke default, path null → null', async () => {
    const t = await load('k');
    expect(t.imageUrl('/a.jpg', 'poster', 'w500')).toBe('https://image.tmdb.org/t/p/w500/a.jpg');
    expect(t.imageUrl('/a.jpg', 'poster', 'w999')).toBe('https://image.tmdb.org/t/p/w342/a.jpg');
    expect(t.imageUrl('/a.jpg', 'profile', 'w185')).toBe('https://image.tmdb.org/t/p/w185/a.jpg');
    expect(t.imageUrl('/l.png', 'logo', 'w92')).toBe('https://image.tmdb.org/t/p/w92/l.png');
    expect(t.imageUrl(null, 'backdrop', 'w780')).toBeNull();
  });

  it('textureUrl dan backdropTextureUrl lewat proxy same-origin', async () => {
    const t = await load('k');
    expect(t.textureUrl('/a.jpg', 'w342')).toBe('/tmdb-img/w342/a.jpg');
    expect(t.textureUrl('/a.jpg', 'w999')).toBe('/tmdb-img/w342/a.jpg');
    expect(t.textureUrl(null, 'w342')).toBeNull();
    expect(t.backdropTextureUrl('/b.jpg')).toBe('/tmdb-img/w780/b.jpg');
    expect(t.backdropTextureUrl(null)).toBeNull();
  });

  it('VITE_TMDB_IMG_BASE mengganti basis proxy dan membuang garis miring akhir', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_TMDB_API_KEY', 'k');
    vi.stubEnv('VITE_TMDB_IMG_BASE', 'https://img.contoh.com/tmdb/');
    const t = await import('./tmdb');
    expect(t.textureUrl('/a.jpg', 'w342')).toBe('https://img.contoh.com/tmdb/w342/a.jpg');
  });

  it('releaseYear', async () => {
    const t = await load('k');
    expect(t.releaseYear('2008-07-16')).toBe('2008');
    expect(t.releaseYear('')).toBe('—');
  });
});

describe('request TMDB', () => {
  it('tanpa kunci → error missing-key tanpa memanggil jaringan', async () => {
    const t = await load(undefined);
    expect(t.hasApiKey).toBe(false);
    await expect(t.fetchCategory('popular')).rejects.toMatchObject({ kind: 'missing-key' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('kunci v3 → api_key di query, language id-ID, kategori memetakan endpoint', async () => {
    const t = await load('abc123');
    fetchMock.mockReturnValue(json({ page: 1, results: [{ id: 1 }], total_pages: 1, total_results: 1 }));
    await t.fetchCategory('top_rated');
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe('/3/movie/top_rated');
    expect(url.searchParams.get('api_key')).toBe('abc123');
    expect(url.searchParams.get('language')).toBe('id-ID');
    expect(fetchMock.mock.calls[0][1].headers).toBeUndefined();
  });

  it('kunci v4 (eyJ…) → header Bearer dan tanpa api_key di URL', async () => {
    const t = await load('eyJhbGciOi.test.token');
    fetchMock.mockReturnValue(json({ page: 1, results: [], total_pages: 1, total_results: 0 }));
    await t.fetchCategory('trending');
    const [urlArg, init] = fetchMock.mock.calls[0];
    expect(new URL(String(urlArg)).searchParams.has('api_key')).toBe(false);
    expect(init.headers).toEqual({ Authorization: 'Bearer eyJhbGciOi.test.token' });
  });

  it('fetchCategory mengembalikan film, halaman, dan totalPages (dibatasi 500)', async () => {
    const t = await load('k');
    const results = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    fetchMock.mockReturnValue(json({ page: 3, results, total_pages: 9999, total_results: 199980 }));
    const r = await t.fetchCategory('popular', 3);
    expect(r.movies).toHaveLength(20);
    expect(r).toMatchObject({ page: 3, totalPages: 500 });
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('page')).toBe('3');
  });

  it('searchMovies meneruskan nomor halaman', async () => {
    const t = await load('k');
    fetchMock.mockReturnValue(json({ page: 2, results: [], total_pages: 2, total_results: 30 }));
    await t.searchMovies('dune', 2);
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('page')).toBe('2');
  });

  it('searchMovies mengirim query dan include_adult=false', async () => {
    const t = await load('k');
    fetchMock.mockReturnValue(json({ page: 1, results: [], total_pages: 0, total_results: 0 }));
    await t.searchMovies('the dark knight');
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe('/3/search/movie');
    expect(url.searchParams.get('query')).toBe('the dark knight');
    expect(url.searchParams.get('include_adult')).toBe('false');
  });

  it.each([
    [401, 'auth'],
    [404, 'not-found'],
    [429, 'rate-limit'],
    [500, 'http'],
  ])('status %i → kind %s', async (status, kind) => {
    const t = await load('k');
    fetchMock.mockReturnValue(json({}, status));
    await expect(t.fetchCategory('popular')).rejects.toMatchObject({ kind, status });
  });

  it('kegagalan jaringan → kind network', async () => {
    const t = await load('k');
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(t.fetchCategory('popular')).rejects.toMatchObject({ kind: 'network' });
  });

  it('AbortError diteruskan apa adanya (bukan dibungkus sebagai error jaringan)', async () => {
    const t = await load('k');
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    fetchMock.mockRejectedValue(abort);
    await expect(t.fetchCategory('popular')).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('errorMessage memakai pesan TmdbError, selain itu pesan umum', async () => {
    const t = await load('k');
    expect(t.errorMessage(new t.TmdbError('auth', 'ditolak'))).toBe('ditolak');
    expect(t.errorMessage(new Error('x'))).toBe('Terjadi kesalahan tak terduga.');
  });
});

describe('fetchMovieDetail', () => {
  it('sinopsis Indonesia ada → satu request saja, tanpa penanda fallback', async () => {
    const t = await load('k');
    fetchMock.mockReturnValue(json({ id: 1, overview: 'Halo', tagline: 'T' }));
    const d = await t.fetchMovieDetail(1);
    expect(d.overview).toBe('Halo');
    expect(d.overviewFallback).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('append_to_response')).toBe('credits,videos,recommendations,similar,images,reviews,watch/providers,release_dates,keywords,external_ids');
  });

  it('sinopsis kosong → ambil en-US sebagai cadangan dan beri penanda', async () => {
    const t = await load('k');
    fetchMock
      .mockReturnValueOnce(json({ id: 1, overview: '', tagline: '', genres: [] }))
      .mockReturnValueOnce(json({ id: 1, overview: 'Hello', tagline: 'Tag' }));
    const d = await t.fetchMovieDetail(1);
    expect(d).toMatchObject({ overview: 'Hello', overviewFallback: true, tagline: 'Tag' });
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('language')).toBe('en-US');
  });

  it('cadangan en-US gagal → tetap mengembalikan detail Indonesia tanpa melempar', async () => {
    const t = await load('k');
    fetchMock.mockReturnValueOnce(json({ id: 1, overview: '' })).mockReturnValueOnce(json({}, 500));
    const d = await t.fetchMovieDetail(1);
    expect(d.overview).toBe('');
    expect(d.overviewFallback).toBeUndefined();
  });

  it('ulasan id-ID kosong → ambil ulasan en-US sebagai cadangan', async () => {
    const t = await load('k');
    fetchMock
      .mockReturnValueOnce(json({ id: 1, overview: 'Halo', reviews: { results: [] } }))
      .mockReturnValueOnce(json({ results: [{ id: 'r1', author: 'A', content: 'Great', created_at: '2020-01-01' }] }));
    const d = await t.fetchMovieDetail(1);
    expect(d.reviews?.results).toHaveLength(1);
    const url = new URL(String(fetchMock.mock.calls[1][0]));
    expect(url.pathname).toBe('/3/movie/1/reviews');
    expect(url.searchParams.get('language')).toBe('en-US');
  });

  it('ulasan id-ID sudah ada → tidak ada request tambahan', async () => {
    const t = await load('k');
    fetchMock.mockReturnValue(json({ id: 1, overview: 'Halo', reviews: { results: [{ id: 'r1' }] } }));
    await t.fetchMovieDetail(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('trailer', () => {
  const v = (over: Record<string, unknown>) => ({
    id: Math.random().toString(),
    key: 'abcDEF123_-',
    name: 'T',
    site: 'YouTube',
    type: 'Trailer',
    official: true,
    iso_639_1: 'en',
    published_at: '2020-01-01T00:00:00.000Z',
    ...over,
  });

  it('tanpa video atau bukan trailer YouTube → null', async () => {
    const t = await load('k');
    expect(t.pickTrailer(undefined)).toBeNull();
    expect(t.pickTrailer([])).toBeNull();
    expect(t.pickTrailer([v({ site: 'Vimeo' }), v({ type: 'Teaser' })] as never)).toBeNull();
  });

  it('kunci tidak valid dibuang', async () => {
    const t = await load('k');
    expect(t.pickTrailer([v({ key: 'x"><script>' })] as never)).toBeNull();
  });

  it('prioritas: resmi → bahasa Indonesia → Inggris → terbaru', async () => {
    const t = await load('k');
    const unofficialId = v({ key: 'unofficialId', official: false, iso_639_1: 'id' });
    const officialEn = v({ key: 'officialEn01', official: true, iso_639_1: 'en' });
    const officialId = v({ key: 'officialId01', official: true, iso_639_1: 'id' });
    const newerEn = v({ key: 'newerEn00001', official: true, iso_639_1: 'en', published_at: '2024-01-01T00:00:00.000Z' });
    expect(t.pickTrailer([unofficialId, officialEn] as never)?.key).toBe('officialEn01');
    expect(t.pickTrailer([officialEn, officialId] as never)?.key).toBe('officialId01');
    expect(t.pickTrailer([officialEn, newerEn] as never)?.key).toBe('newerEn00001');
  });

  it('youtubeEmbedUrl memakai youtube-nocookie dan menolak kunci berbahaya', async () => {
    const t = await load('k');
    expect(t.youtubeEmbedUrl('abcDEF123_-')).toContain('https://www.youtube-nocookie.com/embed/abcDEF123_-');
    expect(t.youtubeEmbedUrl('a/../b')).toBeNull();
    expect(t.youtubeEmbedUrl('')).toBeNull();
  });
});
