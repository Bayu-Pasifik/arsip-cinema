import { imageUrl, releaseYear } from '../services/tmdb';
import type { Movie } from '../types/tmdb';
import Carousel from './Carousel';

interface Props {
  id: string;
  title: string;
  movies: Movie[];
  onOpen: (id: number) => void;
}

/** Carousel kartu film; klik membuka detail film tersebut. */
export default function MovieRail({ id, title, movies, onOpen }: Props) {
  if (movies.length === 0) return null;
  return (
    <section className="mv" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="tag">
        {title}
      </h3>
      <Carousel label={title}>
        {movies.slice(0, 14).map((m) => {
          const src = imageUrl(m.poster_path, 'poster', 'w185');
          const year = releaseYear(m.release_date);
          return (
            <li key={m.id} className="mv-item">
              <button type="button" className="mv-card" onClick={() => onOpen(m.id)}>
                {src ? (
                  <img src={src} alt="" loading="lazy" width={185} height={278} />
                ) : (
                  <span className="mv-ph" aria-hidden="true">
                    {m.title.slice(0, 1)}
                  </span>
                )}
                <span className="mv-title">{m.title}</span>
                <span className="mv-meta">
                  {year !== '—' ? `${year} · ` : ''}
                  <span aria-hidden="true">★</span> {m.vote_average.toFixed(1)}
                  <span className="sr-only"> dari 10</span>
                </span>
              </button>
            </li>
          );
        })}
      </Carousel>
    </section>
  );
}
