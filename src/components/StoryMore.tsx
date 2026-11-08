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
  // "serupa" sering memuat film yang sudah ada di rekomendasi → buang duplikat
  const seen = new Set(recommendations.map((m) => m.id));
  const similar = (detail.similar?.results ?? []).filter((m) => !seen.has(m.id));

  if (recommendations.length === 0 && similar.length === 0) return null;

  return (
    <div className="story-more">
      <MovieRail id="st-rec" title="Rekomendasi untuk Anda" movies={recommendations} onOpen={onOpenMovie} />
      <MovieRail id="st-sim" title="Film serupa" movies={similar} onOpen={onOpenMovie} />
    </div>
  );
}
