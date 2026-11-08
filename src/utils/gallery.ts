import type { GalleryImage } from '../components/ImageLightbox';
import type { MovieDetail } from '../types/tmdb';

const MAX_BACKDROPS = 12;
const MAX_POSTERS = 6;

/**
 * Menyusun galeri dari `images` TMDB: adegan (backdrop) dulu, lalu poster alternatif.
 * `all` = urutan gabungan yang dipakai lightbox; `posterOffset` = indeks poster pertama di `all`.
 */
export function buildGallery(detail: MovieDetail | null) {
  const pick = (list: { file_path: string; width: number; height: number; vote_average: number }[] | undefined, kind: GalleryImage['kind'], max: number): GalleryImage[] =>
    [...(list ?? [])]
      .filter((i) => i.file_path)
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, max)
      .map((i) => ({ path: i.file_path, kind, width: i.width, height: i.height }));

  // poster utama sudah tampil di halaman → jangan diulang di galeri poster
  const backdrops = pick(detail?.images?.backdrops, 'backdrop', MAX_BACKDROPS);
  const posters = pick(detail?.images?.posters, 'poster', MAX_POSTERS + 1)
    .filter((p) => p.path !== detail?.poster_path)
    .slice(0, MAX_POSTERS);
  return { backdrops, posters, all: [...backdrops, ...posters], posterOffset: backdrops.length };
}
