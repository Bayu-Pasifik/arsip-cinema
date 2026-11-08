import type { MovieDetail } from '../types/tmdb';
import MovieRail from './MovieRail';

interface Props {
  detail: MovieDetail | null;
  onOpenMovie: (id: number) => void;
}

/** Bagian di bawah cerita scroll: konten tambahan dari TMDB (tiap blok hanya tampil bila datanya ada). */
export default function StoryMore({ detail, onOpenMovie }: Props) {
  if (!detail) return null;
  const recommendations = detail.recommendations?.results ?? [];
  if (recommendations.length === 0) return null;

  return (
    <div className="story-more">
      <MovieRail id="st-rec" title="Rekomendasi untuk Anda" movies={recommendations} onOpen={onOpenMovie} />
    </div>
  );
}
