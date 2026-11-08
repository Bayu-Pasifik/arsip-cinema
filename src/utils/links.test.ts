import { describe, expect, it } from 'vitest';
import type { MovieDetail } from '../types/tmdb';
import { externalLinks } from './links';

const d = (over: Record<string, unknown>) => over as unknown as MovieDetail;

describe('externalLinks', () => {
  it('kosong bila tidak ada data', () => {
    expect(externalLinks(null)).toEqual([]);
    expect(externalLinks(d({}))).toEqual([]);
  });

  it('menyusun tautan dari imdb_id, homepage, dan external_ids', () => {
    const links = externalLinks(
      d({
        imdb_id: 'tt0133093',
        homepage: 'https://example.com/matrix',
        external_ids: { instagram_id: 'thematrixmovie', twitter_id: 'matrix', facebook_id: 'TheMatrixMovie', wikidata_id: 'Q83495' },
      }),
    );
    expect(links.map((l) => l.label)).toEqual(['IMDb', 'Situs resmi', 'Instagram', 'X', 'Facebook', 'Wikidata']);
    expect(links[0].url).toBe('https://www.imdb.com/title/tt0133093/');
    expect(links[2].url).toBe('https://www.instagram.com/thematrixmovie/');
  });

  it('memakai imdb dari external_ids bila imdb_id kosong', () => {
    expect(externalLinks(d({ external_ids: { imdb_id: 'tt1' } }))[0].url).toContain('/title/tt1/');
  });

  it('menolak ID tak aman dan homepage non-http', () => {
    const links = externalLinks(
      d({ homepage: 'javascript:alert(1)', external_ids: { instagram_id: '../evil?x=1', twitter_id: 'ok_id' } }),
    );
    expect(links.map((l) => l.label)).toEqual(['X']);
  });
});
