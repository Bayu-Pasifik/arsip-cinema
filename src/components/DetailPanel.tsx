import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMovieDetail } from '../hooks/useMovieDetail';
import { imageUrl, releaseYear } from '../services/tmdb';
import type { Movie } from '../types/tmdb';
import { formatRuntime } from '../utils/format';

interface Props {
  movie: Movie;
  reduced: boolean;
  onClose: () => void;
}

export default function DetailPanel({ movie, reduced, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const state = useMovieDetail(movie.id);
  const detail = state.status === 'success' ? state.detail : null;

  // fokus: simpan elemen pemicu, pindahkan ke tombol tutup, kembalikan saat selesai
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, []);

  useGSAP(
    () => {
      if (reduced) return;
      const tl = gsap.timeline();
      tl.from('.scrim', { opacity: 0, duration: 0.35 })
        .from(panel.current, { xPercent: 8, opacity: 0, duration: 0.55, ease: 'power3.out' }, 0)
        .from('.dp-anim', { y: 18, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' }, 0.15);
    },
    { scope: root, dependencies: [reduced] },
  );

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduced || !root.current) return onClose();
    gsap
      .timeline({ onComplete: onClose })
      .to(panel.current, { xPercent: 6, opacity: 0, duration: 0.3, ease: 'power2.in' })
      .to('.scrim', { opacity: 0, duration: 0.25 }, 0);
  }, [onClose, reduced]);

  // Esc menutup; Tab dikurung di dalam panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = panel.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const backdrop = imageUrl(movie.backdrop_path, 'backdrop', 'w780');
  const poster = imageUrl(movie.poster_path, 'poster', 'w342');
  const director = detail?.credits?.crew.find((c) => c.job === 'Director')?.name;
  const cast = detail?.credits?.cast.slice(0, 5) ?? [];

  return (
    <div className="detail-root" ref={root}>
      <div className="scrim" onClick={close} aria-hidden="true" />
      <aside className="detail" ref={panel} role="dialog" aria-modal="true" aria-labelledby="dp-title">
        {backdrop && (
          <div className="dp-backdrop" aria-hidden="true">
            <img src={backdrop} alt="" />
          </div>
        )}
        <button type="button" className="dp-close btn btn-ghost" ref={closeBtn} onClick={close}>
          Tutup <span aria-hidden="true">✕</span>
        </button>

        <div className="dp-body">
          <div className="dp-head dp-anim">
            {poster ? (
              <img className="dp-poster" src={poster} alt={`Poster film ${movie.title}`} width={342} height={513} />
            ) : (
              <div className="dp-poster dp-poster-empty" role="img" aria-label={`Tidak ada poster untuk ${movie.title}`}>
                Tanpa poster
              </div>
            )}
            <div>
              {movie.demo && <p className="demo-tag">DEMO · bukan data TMDB</p>}
              <h2 id="dp-title" className="dp-title">
                {movie.title}
              </h2>
              {detail?.tagline && <p className="dp-tagline">{detail.tagline}</p>}
              <p className="dp-meta">
                {!movie.demo && (
                  <>
                    <span>{releaseYear(movie.release_date)}</span>
                    {detail?.runtime ? <span>{formatRuntime(detail.runtime)}</span> : null}
                    <span>
                      <span aria-hidden="true">★</span> {movie.vote_average.toFixed(1)}
                      <span className="sr-only"> dari 10</span>
                      {movie.vote_count > 0 && <span className="dim"> ({movie.vote_count.toLocaleString('id-ID')})</span>}
                    </span>
                  </>
                )}
              </p>
              {detail && detail.genres.length > 0 && (
                <ul className="genres" aria-label="Genre">
                  {detail.genres.map((g) => (
                    <li key={g.id}>{g.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <section className="dp-anim" aria-labelledby="dp-ov">
            <h3 id="dp-ov" className="dp-h">
              Sinopsis
            </h3>
            <p className="dp-text">{movie.overview || 'Sinopsis belum tersedia di TMDB.'}</p>
          </section>

          <div className="dp-anim" aria-live="polite">
            {state.status === 'loading' && <p className="dim">Memuat detail tambahan…</p>}
            {state.status === 'error' && (
              <p className="dp-error" role="alert">
                Detail tambahan gagal dimuat: {state.message}
              </p>
            )}
            {(director || cast.length > 0) && (
              <dl className="credits">
                {director && (
                  <>
                    <dt>Sutradara</dt>
                    <dd>{director}</dd>
                  </>
                )}
                {cast.length > 0 && (
                  <>
                    <dt>Pemeran</dt>
                    <dd>{cast.map((c) => c.name).join(', ')}</dd>
                  </>
                )}
              </dl>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
