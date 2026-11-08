import { useMemo } from 'react';
import type { MovieDetail } from '../types/tmdb';
import { buildGallery } from '../utils/gallery';
import { translationOptions } from '../utils/translations';
import ImageGallery from './ImageGallery';
import KeywordChips from './KeywordChips';
import MovieRail from './MovieRail';
import ReviewList from './ReviewList';
import TranslationsPanel from './TranslationsPanel';
import WatchProviders, { WATCH_REGION } from './WatchProviders';

interface Props {
  detail: MovieDetail | null;
  onOpenMovie: (id: number) => void;
  /** indeks pada daftar gabungan galeri (lihat buildGallery) */
  onOpenImage: (index: number) => void;
}

/** Bagian di bawah cerita scroll: konten tambahan dari TMDB (tiap blok hanya tampil bila datanya ada). */
export default function StoryMore({ detail, onOpenMovie, onOpenImage }: Props) {
  const gallery = useMemo(() => buildGallery(detail), [detail]);
  if (!detail) return null;
  const recommendations = detail.recommendations?.results ?? [];
  // "serupa" sering memuat film yang sudah ada di rekomendasi → buang duplikat
  const seen = new Set(recommendations.map((m) => m.id));
  const similar = (detail.similar?.results ?? []).filter((m) => !seen.has(m.id));

  const reviews = detail.reviews?.results ?? [];
  const providers = detail['watch/providers'];
  const keywords = detail.keywords?.keywords ?? [];
  const translations = translationOptions(detail.translations?.translations);

  const empty =
    !providers &&
    keywords.length === 0 &&
    translations.length === 0 &&
    recommendations.length === 0 &&
    similar.length === 0 &&
    gallery.all.length === 0 &&
    reviews.length === 0;
  if (empty) return null;

  return (
    <div className="story-more">
      {providers && <WatchProviders region={providers.results?.[WATCH_REGION]} />}
      <KeywordChips keywords={keywords} />
      <TranslationsPanel options={translations} />
      <ImageGallery id="st-gal" title="Galeri adegan" items={gallery.backdrops} offset={0} onOpen={onOpenImage} />
      <ImageGallery
        id="st-pos"
        title="Poster lainnya"
        items={gallery.posters}
        offset={gallery.posterOffset}
        onOpen={onOpenImage}
      />
      <ReviewList reviews={reviews} />
      <MovieRail id="st-rec" title="Rekomendasi untuk Anda" movies={recommendations} onOpen={onOpenMovie} />
      <MovieRail id="st-sim" title="Film serupa" movies={similar} onOpen={onOpenMovie} />
    </div>
  );
}
