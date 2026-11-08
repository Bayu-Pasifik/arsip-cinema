import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useCompact } from '../hooks/useEnv';
import { useMovieDetail } from '../hooks/useMovieDetail';
import { imageUrl, pickTrailer, releaseYear } from '../services/tmdb';
import type { Movie } from '../types/tmdb';
import { buildGallery } from '../utils/gallery';
import { externalLinks } from '../utils/links';
import { certification, theatricalDateId } from '../utils/releases';
import { formatDate, formatMoney, formatRuntime, languageName, statusLabel } from '../utils/format';
import BackButton from './BackButton';
import CollectionButtons from './CollectionButtons';
import ImageLightbox from './ImageLightbox';
import StoryMore from './StoryMore';
import TrailerModal from './TrailerModal';
import type { StoryProgress } from '../scene/StoryScene';
import { SceneBoundary } from '../scene/SceneBoundary';
import { useWebGL } from '../utils/webgl';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const StoryScene = lazy(() => import('../scene/StoryScene'));

interface Props {
  movie: Movie;
  reduced: boolean;
  onClose: () => void;
  leaving?: boolean;
  onLeft?: () => void;
  /** buka detail film lain (mis. dari baris rekomendasi) */
  onOpenMovie: (id: number) => void;
}

const CHAPTERS = [
  { at: 0, label: 'Pembuka' },
  { at: 0.2, label: 'Sinopsis' },
  { at: 0.45, label: 'Penilaian' },
  { at: 0.7, label: 'Pemeran' },
  { at: 0.95, label: 'Penutup' },
];

/**
 * Halaman detail film berbasis scroll: panggung 3D menempel (sticky) sementara satu timeline GSAP
 * di-scrub oleh ScrollTrigger. Progres yang sama menggerakkan poster, cincin rating, backdrop, dan teks.
 */
export default function MovieStory({ movie, reduced, onClose, leaving, onLeft, onOpenMovie }: Props) {
  const compact = useCompact();
  const webgl = useWebGL();
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const closing = useRef(false);
  const progress = useMemo<StoryProgress>(() => ({ p: 0 }), []);
  const [active, setActive] = useState(0);
  const [past, setPast] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const modalOpenRef = useRef(false);
  modalOpenRef.current = trailerOpen || lightbox !== null;

  const state = useMovieDetail(movie.id);
  const detail = state.status === 'success' ? state.detail : null;

  const overview = detail?.overview || movie.overview || 'Sinopsis belum tersedia di TMDB.';
  const words = useMemo(() => overview.split(/\s+/).filter(Boolean), [overview]);
  const director = detail?.credits?.crew.find((c) => c.job === 'Director')?.name;
  const cast = useMemo(() => (detail?.credits?.cast ?? []).slice(0, 6), [detail]);
  const genres = detail?.genres ?? [];
  const trailer = useMemo(() => pickTrailer(detail?.videos?.results), [detail]);
  const rating = movie.vote_average;
  const runtime = formatRuntime(detail?.runtime ?? null);
  const posterSrc = imageUrl(movie.poster_path, 'poster', 'w342');
  const gallery = useMemo(() => buildGallery(detail), [detail]);

  // metadata tambahan dari TMDB (hanya tampil bila ada nilainya)
  const crewBy = (...jobs: string[]) =>
    [...new Set((detail?.credits?.crew ?? []).filter((c) => jobs.includes(c.job)).map((c) => c.name))].slice(0, 3).join(', ');
  const writers = crewBy('Screenplay', 'Writer', 'Story');
  const composer = crewBy('Original Music Composer');
  const cinematographer = crewBy('Director of Photography');
  const originalTitle = detail?.original_title && detail.original_title !== movie.title ? detail.original_title : '';
  const cert = certification(detail);
  const facts: [string, string][] = (
    [
      ['Status', statusLabel(detail?.status)],
      ['Rilis', formatDate(movie.release_date)],
      ['Tayang di bioskop Indonesia', formatDate(theatricalDateId(detail) ?? undefined)],
      ['Klasifikasi usia', cert ? `${cert.value} (${cert.region === 'ID' ? 'Indonesia' : 'AS'})` : ''],
      ['Bahasa asli', languageName(detail?.original_language)],
      ['Anggaran', formatMoney(detail?.budget)],
      ['Pendapatan', formatMoney(detail?.revenue)],
      ['Negara', (detail?.production_countries ?? []).map((c) => c.name).slice(0, 2).join(', ')],
      ['Studio', (detail?.production_companies ?? []).map((c) => c.name).slice(0, 2).join(', ')],
      ['Popularitas', detail?.popularity ? detail.popularity.toLocaleString('id-ID', { maximumFractionDigits: 0 }) : ''],
    ] as [string, string][]
  ).filter(([, v]) => v);
  const collection = detail?.belongs_to_collection?.name;
  const links = externalLinks(detail);

  // fokus: simpan pemicu, pindah ke tombol tutup, kembalikan saat selesai
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, []);

  // ---- GSAP + ScrollTrigger -------------------------------------------------
  useGSAP(
    () => {
      const scroller = root.current;
      const trk = track.current;
      if (!scroller || !trk) return;

      // transisi masuk: lingkaran membesar
      if (!reduced) {
        gsap.fromTo(
          scroller,
          { clipPath: 'circle(0% at 50% 62%)' },
          {
            clipPath: 'circle(150% at 50% 62%)',
            duration: 0.9,
            ease: 'power3.inOut',
            clearProps: 'clipPath',
            onComplete: () => ScrollTrigger.refresh(),
          },
        );
      }
      if (reduced) return; // mode gerak dikurangi: tata letak statis tanpa scrub

      const q = gsap.utils.selector(scroller);
      const ratingEl = scroller.querySelector<HTMLElement>('.st-rating-num');
      const counter = { v: 0 };
      if (ratingEl) ratingEl.textContent = '0.0';

      // judul hero muncul per baris saat halaman dibuka (berbasis waktu, bukan scrub)
      gsap.from(q('.st-line'), { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.12, delay: 0.5 });
      gsap.from(q('.st-hero-fade'), { y: 18, opacity: 0, duration: 0.8, stagger: 0.1, delay: 0.9 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: trk,
          scroller,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          onUpdate: (self) => {
            progress.p = self.progress;
            if (bar.current) bar.current.style.transform = `scaleY(${self.progress})`;
            const idx = CHAPTERS.reduce((a, c, i) => (self.progress >= c.at - 0.02 ? i : a), 0);
            setActive((cur) => (cur === idx ? cur : idx));
          },
        },
      });

      // cerita selesai & bagian "lainnya" mulai terlihat → sembunyikan titik bab dan bilah progres
      ScrollTrigger.create({
        trigger: trk,
        scroller,
        start: 'bottom 75%',
        onEnter: () => setPast(true),
        onLeaveBack: () => setPast(false),
      });

      const fadeIn = (sel: string, at: number, dur = 0.04) =>
        tl.fromTo(q(sel), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: dur }, at);
      const fadeOut = (sel: string, at: number, dur = 0.04) =>
        tl.to(q(sel), { opacity: 0, y: -50, duration: dur }, at);

      // bab 1 — hero keluar
      tl.to(q('.st-hero'), { opacity: 0, y: -80, duration: 0.06 }, 0.14);

      // bab 2 — sinopsis: kata menyala satu per satu
      fadeIn('.st-syn', 0.2);
      if (q('.st-syn .w').length) {
        tl.fromTo(
          q('.st-syn .w'),
          { opacity: 0.14 },
          { opacity: 1, duration: 0.01, stagger: { each: 0.16 / Math.max(words.length, 1) } },
          0.24,
        );
      }
      fadeOut('.st-syn', 0.42);

      // bab 3 — rating: angka menghitung naik selaras cincin 3D
      fadeIn('.st-facts', 0.45);
      tl.to(
        counter,
        {
          v: rating,
          duration: 0.12,
          onUpdate: () => {
            if (ratingEl) ratingEl.textContent = counter.v.toFixed(1);
          },
        },
        0.47,
      );
      if (q('.st-chip').length) tl.fromTo(q('.st-chip'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.02, stagger: 0.01 }, 0.52);
      fadeOut('.st-facts', 0.64);

      // bab 4 — pemeran: kartu masuk bergantian
      fadeIn('.st-cast', 0.68);
      if (q('.st-cast-card').length) {
        tl.fromTo(
          q('.st-cast-card'),
          { opacity: 0, x: 70 },
          { opacity: 1, x: 0, duration: 0.04, stagger: 0.025 },
          0.7,
        );
      }
      fadeOut('.st-cast', 0.9);

      // fallback tanpa WebGL: poster HTML mengikuti bab seperti poster 3D
      const flat = q('.st-flat-poster');
      if (flat.length) {
        const W = window.innerWidth;
        const wide = W > 900;
        gsap.set(flat, { xPercent: -50, yPercent: -50 });
        tl.to(flat, { x: wide ? W * 0.27 : 0, rotate: -4, duration: 0.06 }, 0.14);
        tl.to(flat, { x: wide ? -W * 0.27 : 0, rotate: 3, duration: 0.04 }, 0.66);
        tl.to(flat, { x: 0, y: -40, rotate: 0, scale: 1.12, duration: 0.06 }, 0.9);
      }

      // bab 5 — penutup
      fadeIn('.st-end', 0.94, 0.05);

      tl.set({}, {}, 1); // pastikan durasi total = 1

      return () => {
        if (ratingEl) ratingEl.textContent = rating.toFixed(1);
      };
    },
    { scope: root, dependencies: [reduced, webgl, words.length, cast.length, genres.length, rating], revertOnUpdate: true },
  );

  const scrollToChapter = (at: number) => {
    const el = root.current;
    const trk = track.current;
    if (!el || !trk) return;
    const max = trk.scrollHeight - el.clientHeight;
    el.scrollTo({ top: at * max, behavior: reduced ? 'auto' : 'smooth' });
  };

  const animateOut = useCallback(
    (done: () => void) => {
      if (closing.current) return;
      closing.current = true;
      if (reduced || !root.current) return done();
      // transisi keluar "tirai terangkat": satu gerakan mulus — halaman terangkat ke atas dengan tepi bawah melengkung,
      // menyingkap arsip di belakangnya. (Sengaja berbeda dari transisi masuk yang berupa lingkaran membesar.)
      const el = root.current;
      gsap.killTweensOf(el);
      gsap.set(el, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', willChange: 'clip-path, transform' });
      gsap
        .timeline({ defaults: { ease: 'power2.inOut', duration: 0.75 }, onComplete: done })
        .to(el, { clipPath: 'inset(0% 0% 100% 0% round 0px 0px 56px 56px)', yPercent: -7 }, 0)
        .to(el.querySelectorAll('.story-dots, .story-progress, .story-close'), { opacity: 0, duration: 0.3, ease: 'none' }, 0);
    },
    [reduced],
  );

  const close = useCallback(() => animateOut(onClose), [animateOut, onClose]);

  // Back/Forward browser sudah mengubah URL: mainkan animasi keluar, lalu minta induk melepas halaman ini
  useEffect(() => {
    if (leaving) animateOut(() => onLeft?.());
  }, [leaving, animateOut, onLeft]);

  // Esc menutup; Tab dikurung di dalam halaman detail
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpenRef.current) return; // dialog trailer/galeri menangani Esc/Tab sendiri
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !root.current) return;
      const f = root.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
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

  return (
    <div
      className={`story${reduced ? ' is-static' : ''}`}
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="st-title"
    >
      <BackButton className="story-close" buttonRef={closeBtn} onClick={close} />


      {!reduced && (
        <>
          <nav className={`story-dots${past ? ' is-hidden' : ''}`} aria-label="Bab halaman detail">
            {CHAPTERS.map((c, i) => (
              <button
                key={c.label}
                type="button"
                className={`story-dot${i === active ? ' is-active' : ''}`}
                aria-label={c.label}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => scrollToChapter(c.at)}
              >
                <span className="story-dot-label" aria-hidden="true">
                  {c.label}
                </span>
              </button>
            ))}
          </nav>
          <div className={`story-progress${past ? ' is-hidden' : ''}`} aria-hidden="true">
            <span ref={bar} />
          </div>
        </>
      )}

      <div className="story-track" ref={track}>
        <div className="story-stage">
          {/* Poster ada di canvas (aria-hidden) → sediakan padanan teks untuk teknologi bantu. */}
          {!reduced && webgl && (
            <div
              role="img"
              className="sr-only"
              aria-label={
                movie.poster_path
                  ? `Poster film ${movie.title}${movie.release_date ? ` (${releaseYear(movie.release_date)})` : ''}`
                  : `Film ${movie.title} tidak memiliki poster di TMDB`
              }
            />
          )}
          {!reduced && webgl && (
            <div className="story-canvas">
              <SceneBoundary>
                <Suspense fallback={null}>
                  <StoryScene
                    title={movie.title}
                    posterPath={movie.poster_path}
                    backdropPath={movie.backdrop_path}
                    rating={rating}
                    progress={progress}
                    compact={compact}
                  />
                </Suspense>
              </SceneBoundary>
            </div>
          )}
          {!reduced && !webgl && posterSrc && (
            <img className="st-flat-poster" src={posterSrc} alt={`Poster film ${movie.title}`} width={342} height={513} />
          )}

          {/* 1 — hero */}
          <section className="st-ch st-hero" aria-label="Judul">
            <p className="tag st-hero-fade">
              {movie.demo ? 'DEMO · bukan data TMDB' : `${releaseYear(movie.release_date)}${runtime ? ` · ${runtime}` : ''}${cert ? ` · ${cert.value}` : ''}`}
            </p>
            <h2 id="st-title" className="st-title">
              <span className="line-mask">
                <span className="st-line">{movie.title}</span>
              </span>
            </h2>
            {originalTitle && (
              <p className="st-orig st-hero-fade" lang={detail?.original_language}>
                {originalTitle}
              </p>
            )}
            {detail?.tagline && <p className="st-tagline st-hero-fade">“{detail.tagline}”</p>}
            {trailer && (
              <button type="button" className="btn btn-primary st-trailer" aria-haspopup="dialog" onClick={() => setTrailerOpen(true)}>
                <span aria-hidden="true">▶</span> Putar trailer
              </button>
            )}
            <CollectionButtons movie={movie} className="collect-story" />
            <p className="st-cue st-hero-fade" aria-hidden="true">
              Gulir ↓
            </p>
          </section>

          {/* 2 — sinopsis */}
          <section className="st-ch st-syn" aria-labelledby="st-syn-h">
            <h3 id="st-syn-h" className="tag">
              Sinopsis
            </h3>
            <p className="st-overview">
              {words.map((w, i) => (
                <span className="w" key={i}>
                  {w}{' '}
                </span>
              ))}
            </p>
            {detail?.overviewFallback && (
              <p className="dim st-note" lang="en">
                Sinopsis dalam bahasa Inggris — terjemahan Indonesia belum tersedia di TMDB.
              </p>
            )}
          </section>

          {/* 3 — rating & fakta */}
          <section className="st-ch st-facts" aria-labelledby="st-facts-h">
            <h3 id="st-facts-h" className="tag">
              Penilaian
            </h3>
            <p className="st-rating">
              <span className="st-rating-num">{rating.toFixed(1)}</span>
              <span className="st-rating-of"> / 10</span>
              <span className="sr-only"> rating pengguna TMDB</span>
            </p>
            {movie.vote_count > 0 && <p className="dim">dari {movie.vote_count.toLocaleString('id-ID')} suara</p>}
            <ul className="st-chips" aria-label="Genre dan fakta">
              {runtime && <li className="st-chip">{runtime}</li>}
              {releaseYear(movie.release_date) !== '—' && <li className="st-chip">{releaseYear(movie.release_date)}</li>}
              {genres.map((g) => (
                <li className="st-chip" key={g.id}>
                  {g.name}
                </li>
              ))}
            </ul>
            {facts.length > 0 && (
              <dl className="st-meta">
                {facts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {state.status === 'loading' && <p className="dim">Memuat detail tambahan…</p>}
            {state.status === 'error' && (
              <p className="dp-error" role="alert">
                Detail tambahan gagal dimuat: {state.message}
              </p>
            )}
          </section>

          {/* 4 — pemeran */}
          <section className="st-ch st-cast" aria-labelledby="st-cast-h">
            <h3 id="st-cast-h" className="tag">
              Pemeran{director ? ` · Sutradara ${director}` : ''}
            </h3>
            {(writers || composer || cinematographer) && (
              <p className="dim st-crew">
                {[
                  writers && `Penulis: ${writers}`,
                  composer && `Musik: ${composer}`,
                  cinematographer && `Sinematografi: ${cinematographer}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {cast.length === 0 ? (
              <p className="dim">{state.status === 'loading' ? 'Memuat pemeran…' : 'Data pemeran belum tersedia.'}</p>
            ) : (
              <ul className="st-cast-list">
                {cast.map((c) => {
                  const src = imageUrl(c.profile_path, 'profile', 'w185');
                  return (
                    <li className="st-cast-card" key={c.id}>
                      {src ? (
                        <img src={src} alt={`Foto ${c.name}`} loading="lazy" width={185} height={278} />
                      ) : (
                        <span className="st-cast-ph" aria-hidden="true">
                          {c.name.slice(0, 1)}
                        </span>
                      )}
                      <span className="st-cast-name">{c.name}</span>
                      <span className="st-cast-role">{c.character}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* 5 — penutup */}
          <section className="st-ch st-end" aria-label="Penutup">
            <p className="st-end-title">{movie.title}</p>
            {collection && <p className="dim st-collection">Bagian dari {collection}</p>}
            {links.length > 0 && (
              <p className="st-links">
                {links.map((l) => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label} <span aria-hidden="true">↗</span>
                    <span className="sr-only"> (tab baru)</span>
                  </a>
                ))}
              </p>
            )}
            {trailer && (
              <button type="button" className="btn st-trailer-end" aria-haspopup="dialog" onClick={() => setTrailerOpen(true)}>
                <span aria-hidden="true">▶</span> Putar trailer
              </button>
            )}
            <BackButton variant="dark" label="Kembali ke arsip" hint="Tutup detail" onClick={close} />
          </section>

          {reduced && posterSrc && (
            <img className="st-static-poster" src={posterSrc} alt={`Poster film ${movie.title}`} width={342} height={513} />
          )}
        </div>
      </div>
      <StoryMore detail={detail} onOpenMovie={onOpenMovie} onOpenImage={setLightbox} />
      {lightbox !== null && gallery.all.length > 0 && (
        <ImageLightbox title={movie.title} images={gallery.all} start={lightbox} reduced={reduced} onClose={() => setLightbox(null)} />
      )}
      {trailerOpen && trailer && (
        <TrailerModal title={movie.title} videoKey={trailer.key} reduced={reduced} onClose={() => setTrailerOpen(false)} />
      )}
    </div>
  );
}
