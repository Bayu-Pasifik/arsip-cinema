import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useEnv';
import { imageUrl, releaseYear } from '../services/tmdb';
import type { Movie } from '../types/tmdb';

interface Props {
  id: string;
  title: string;
  movies: Movie[];
  onOpen: (id: number) => void;
}

/** Carousel kartu film dengan tombol sebelumnya/berikutnya (tanpa scrollbar); klik membuka detail film tersebut. */
export default function MovieRail({ id, title, movies, onOpen }: Props) {
  const list = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = list.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((cur) => (cur.start === start && cur.end === end ? cur : { start, end }));
  }, []);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure, movies.length]);

  const page = (dir: 1 | -1) => {
    const el = list.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduced ? 'auto' : 'smooth' });
  };

  if (movies.length === 0) return null;
  return (
    <section className="mv" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="tag">
        {title}
      </h3>
      <div className="mv-carousel">
        <button
          type="button"
          className="mv-nav mv-prev"
          aria-label={`${title}: sebelumnya`}
          disabled={edge.start}
          onClick={() => page(-1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <ul className="mv-list" ref={list}>
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
        </ul>
        <button
          type="button"
          className="mv-nav mv-next"
          aria-label={`${title}: berikutnya`}
          disabled={edge.end}
          onClick={() => page(1)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  );
}
