import { translate } from '../i18n';
import type { Movie } from '../types/tmdb';

/**
 * DATA DEMO LOKAL — hanya penanda tempat (placeholder) agar antarmuka dapat dilihat
 * tanpa kunci TMDB. Bukan data film nyata dan selalu diberi label "DEMO" di UI.
 */
export function demoMovies(): Movie[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: -(i + 1),
    title: translate('demo.title', { n: String(i + 1).padStart(2, '0') }),
    overview: translate('demo.overview'),
    poster_path: null,
    backdrop_path: null,
    release_date: '',
    vote_average: 0,
    vote_count: 0,
    demo: true,
  }));
}
