import { describe, expect, it } from 'vitest';
import type { MovieDetail } from '../types/tmdb';
import { buildGallery } from './gallery';

const img = (p: string, v: number) => ({ file_path: p, width: 1920, height: 1080, vote_average: v, iso_639_1: null });

describe('buildGallery', () => {
  it('kosong bila tidak ada data', () => {
    expect(buildGallery(null).all).toEqual([]);
    expect(buildGallery({} as MovieDetail).all).toEqual([]);
  });

  it('mengurutkan backdrop dari nilai tertinggi, lalu poster; poster utama dibuang', () => {
    const d = {
      poster_path: '/main.jpg',
      images: {
        backdrops: [img('/b1.jpg', 1), img('/b2.jpg', 5)],
        posters: [img('/main.jpg', 9), img('/p1.jpg', 3)],
      },
    } as unknown as MovieDetail;
    const g = buildGallery(d);
    expect(g.all.map((x) => x.path)).toEqual(['/b2.jpg', '/b1.jpg', '/p1.jpg']);
    expect(g.posterOffset).toBe(2);
    expect(g.all[2].kind).toBe('poster');
  });

  it('membatasi jumlah backdrop dan poster', () => {
    const many = (p: string) => Array.from({ length: 30 }, (_, i) => img(`/${p}${i}.jpg`, i));
    const g = buildGallery({ poster_path: null, images: { backdrops: many('b'), posters: many('p') } } as unknown as MovieDetail);
    expect(g.backdrops).toHaveLength(12);
    expect(g.posters).toHaveLength(6);
  });
});
