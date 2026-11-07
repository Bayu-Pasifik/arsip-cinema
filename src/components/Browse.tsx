import { forwardRef, useEffect, useRef } from 'react';
import { imageUrl, releaseYear } from '../services/tmdb';
import CollectionButtons from './CollectionButtons';
import type { Movie } from '../types/tmdb';

interface Props {
  movies: Movie[];
  index: number;
  reduced: boolean;
  label: string;
  hasMore: boolean;
  loadingMore: boolean;
  moreError: string | null;
  onLoadMore: () => void;
  onGo: (i: number) => void;
  onOpen: () => void;
}

/** Caption fokus + kontrol + rel thumbnail. Semua dapat dioperasikan dengan keyboard. */
const Browse = forwardRef<HTMLDivElement, Props>(function Browse(
  { movies, index, reduced, label, hasMore, loadingMore, moreError, onLoadMore, onGo, onOpen },
  ref,
) {
  const railRef = useRef<HTMLUListElement>(null);
  const movie = movies[index];

  // gulirkan thumbnail aktif ke tengah rel (tanpa menggulir halaman)
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !el) return;
    rail.scrollTo({
      left: el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [index, reduced, movies]);

  if (!movie) return <div ref={ref} />;

  return (
    <div className="browse" ref={ref}>
      <div className="caption">
        <p className="eyebrow">
          {label} · {String(index + 1).padStart(2, '0')} / {String(movies.length).padStart(2, '0')}
          {hasMore ? '+' : ''}
          {movie.demo && <span className="demo-tag">DEMO</span>}
        </p>
        <h2 className="caption-title" aria-live="polite">
          {movie.title}
        </h2>
        <p className="caption-meta">
          {movie.demo ? (
            'Placeholder lokal'
          ) : (
            <>
              {releaseYear(movie.release_date)} · <span aria-hidden="true">★</span> {movie.vote_average.toFixed(1)}
              <span className="sr-only"> dari 10</span>
            </>
          )}
        </p>
        <div className="caption-actions">
          <button type="button" className="btn btn-ghost" onClick={() => onGo(index - 1)} disabled={index === 0}>
            <span aria-hidden="true">←</span> Sebelumnya
          </button>
          <button type="button" className="btn btn-primary" onClick={onOpen}>
            Lihat detail
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onGo(index + 1)}
            disabled={index === movies.length - 1 && !hasMore}
          >
            Berikutnya <span aria-hidden="true">→</span>
          </button>
        </div>
        <CollectionButtons movie={movie} className="collect-caption" />
      </div>

      <nav aria-label="Daftar film">
        <ul className="rail" ref={railRef}>
          {movies.map((m, i) => {
            const src = imageUrl(m.poster_path, 'poster', 'w185');
            return (
              <li key={m.id}>
                <button
                  type="button"
                  className={`thumb${i === index ? ' is-active' : ''}`}
                  aria-current={i === index ? 'true' : undefined}
                  aria-label={m.title}
                  onClick={() => onGo(i)}
                >
                  {src ? (
                    <img src={src} alt={`Poster ${m.title}`} loading="lazy" width={185} height={278} />
                  ) : (
                    <span className="thumb-fallback" aria-hidden="true">
                      {m.title.slice(0, 2)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {(hasMore || moreError) && (
            <li>
              <button
                type="button"
                className="thumb thumb-more"
                onClick={onLoadMore}
                disabled={loadingMore}
                aria-label={moreError ? `Gagal memuat film berikutnya: ${moreError.replace(/.$/, '')}. Coba lagi` : 'Muat film berikutnya'}
              >
                <span aria-hidden="true">{loadingMore ? '…' : moreError ? '↻' : '+'}</span>
              </button>
            </li>
          )}
        </ul>
        <p className="sr-only" role="status" aria-live="polite">
          {loadingMore ? 'Memuat film berikutnya…' : ''}
        </p>
      </nav>
    </div>
  );
});

export default Browse;
