import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Browse from './components/Browse';
import DetailPanel from './components/DetailPanel';
import Hero from './components/Hero';
import StatusMessage from './components/StatusMessage';
import TopBar from './components/TopBar';
import { useCompact, useDebounced, useReducedMotion } from './hooks/useEnv';
import { useMovieList } from './hooks/useMovieList';
import { createStage } from './scene/stage';
import { CATEGORY_LABEL } from './services/tmdb';
import type { Category, ListSource, Movie } from './types/tmdb';
import { clamp } from './utils/format';

gsap.registerPlugin(useGSAP);
// Pada perangkat lambat, animasi UI tetap selesai tepat waktu (tidak ikut "melambat" saat frame lag).
gsap.ticker.lagSmoothing(0);

const ArchiveScene = lazy(() => import('./scene/ArchiveScene'));

export default function App() {
  const reduced = useReducedMotion();
  const compact = useCompact();
  const stage = useMemo(createStage, []);

  const container = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const browseRef = useRef<HTMLDivElement>(null);

  const [entered, setEntered] = useState(false);
  const [category, setCategory] = useState<Category>('trending');
  const [query, setQuery] = useState('');
  const [demo, setDemo] = useState(false);
  const [reload, setReload] = useState(0);
  const [index, setIndex] = useState(0);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);

  const debounced = useDebounced(query, 400);
  const trimmed = debounced.trim();
  const searchActive = trimmed.length >= 2;

  const source: ListSource = demo
    ? { kind: 'demo' }
    : searchActive
      ? { kind: 'search', query: trimmed }
      : { kind: 'category', category };

  const list = useMovieList(source, reload);
  const movies = list.movies;
  const searching = !demo && (query.trim() !== trimmed || (searchActive && list.status === 'loading'));
  const label = demo ? 'Demo' : searchActive ? `Hasil “${trimmed}”` : CATEGORY_LABEL[category];

  // ---- GSAP: keadaan awal + animasi pembuka -------------------------------
  const { contextSafe } = useGSAP(
    () => {
      gsap.set([topRef.current, browseRef.current], { autoAlpha: 0 });
      if (reduced) return;
      gsap
        .timeline({ delay: 0.2 })
        .from('.line', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.12 })
        .from('.hero-fade', { y: 16, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 }, '-=0.6');
    },
    { scope: container },
  );

  const enter = contextSafe(() => {
    setEntered(true);
    gsap.killTweensOf(stage, 'enter');
    if (reduced) {
      stage.enter = 1;
      stage.invalidate();
      gsap.set(heroRef.current, { autoAlpha: 0 });
      gsap.set([topRef.current, browseRef.current], { autoAlpha: 1 });
      return;
    }
    gsap
      .timeline()
      .to(stage, { enter: 1, duration: 2, ease: 'power3.inOut', onUpdate: () => stage.invalidate() }, 0)
      .to(heroRef.current, { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power2.in' }, 0)
      .to(
        [topRef.current, browseRef.current],
        { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 },
        1.0,
      );
  });

  const leave = contextSafe(() => {
    setEntered(false);
    setDetailMovie(null);
    gsap.killTweensOf(stage, 'enter');
    if (reduced) {
      stage.enter = 0;
      stage.invalidate();
      gsap.set(heroRef.current, { autoAlpha: 1, y: 0 });
      gsap.set([topRef.current, browseRef.current], { autoAlpha: 0 });
      return;
    }
    gsap
      .timeline()
      .to([topRef.current, browseRef.current], { autoAlpha: 0, duration: 0.3 }, 0)
      .to(stage, { enter: 0, duration: 1.6, ease: 'power3.inOut', onUpdate: () => stage.invalidate() }, 0)
      .to(heroRef.current, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.8);
  });

  // ---- fokus poster ---------------------------------------------------------
  const goTo = useCallback(
    (i: number, n = movies.length) => {
      if (n === 0) return;
      const next = clamp(i, 0, n - 1);
      setIndex(next);
      gsap.killTweensOf(stage, 'focus');
      if (reduced) {
        stage.focus = next;
        stage.invalidate();
      } else {
        gsap.to(stage, { focus: next, duration: 0.9, ease: 'power3.out', onUpdate: () => stage.invalidate() });
      }
    },
    [movies.length, reduced, stage],
  );

  // daftar berganti → fokus kembali ke awal + poster "muncul" dengan stagger
  useEffect(() => {
    if (list.status !== 'success') return;
    setIndex(0);
    stage.focus = 0;
    gsap.killTweensOf(stage, 'spawn');
    if (reduced) {
      stage.spawn = 1;
      stage.invalidate();
      return;
    }
    stage.spawn = 0;
    const tween = gsap.to(stage, { spawn: 1, duration: 1.5, ease: 'power2.out', onUpdate: () => stage.invalidate() });
    return () => {
      tween.kill();
    };
  }, [movies, list.status, reduced, stage]);

  useEffect(() => {
    const tweens = stage;
    return () => {
      gsap.killTweensOf(tweens);
    };
  }, [stage]);

  // ---- input: keyboard, wheel, swipe ---------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!entered || detailMovie) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') goTo(index + 1);
      else if (e.key === 'ArrowLeft') goTo(index - 1);
      else if (e.key === 'Home') goTo(0);
      else if (e.key === 'End') goTo(movies.length - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entered, detailMovie, goTo, index, movies.length]);

  const lastWheel = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if (!entered || detailMovie) return;
    const now = performance.now();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 12 || now - lastWheel.current < 380) return;
    lastWheel.current = now;
    goTo(index + (d > 0 ? 1 : -1));
  };

  const swipeStart = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const x0 = swipeStart.current;
    swipeStart.current = null;
    if (x0 === null || !entered || detailMovie) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 60) goTo(index + (dx < 0 ? 1 : -1));
  };

  // klik poster: poster non-fokus → fokuskan; poster fokus → buka detail
  const onPick = useCallback(
    (i: number) => {
      if (!entered) return;
      if (i === index) setDetailMovie(movies[i] ?? null);
      else goTo(i);
    },
    [entered, goTo, index, movies],
  );

  const showSceneLoading = list.status === 'loading';

  return (
    <div className="app" ref={container}>
      <div
        className={`stage${showSceneLoading && movies.length > 0 ? ' is-loading' : ''}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <Suspense fallback={null}>
          {movies.length > 0 && (
            <ArchiveScene movies={movies} stage={stage} reduced={reduced} compact={compact} onPick={onPick} />
          )}
        </Suspense>
      </div>
      <div className="vignette" aria-hidden="true" />

      <TopBar
        ref={topRef}
        category={category}
        query={query}
        searching={searching}
        searchActive={searchActive}
        onCategory={(c) => {
          setQuery('');
          setCategory(c);
        }}
        onQuery={setQuery}
        onHome={leave}
      />

      <main>
        <Hero ref={heroRef} onEnter={enter} />

        <Browse
          ref={browseRef}
          movies={movies}
          index={index}
          reduced={reduced}
          label={label}
          onGo={goTo}
          onOpen={() => setDetailMovie(movies[index] ?? null)}
        />

        <div className="status-layer">
          {list.status === 'loading' && movies.length === 0 && (
            <StatusMessage kind="loading" title="Memuat arsip dari TMDB…" />
          )}
          {list.status === 'error' && list.kind === 'missing-key' && (
            <StatusMessage kind="no-key" title="Kunci TMDB belum dipasang">
              <p>
                Isi <code>VITE_TMDB_API_KEY</code> di berkas <code>.env</code> (lihat <code>.env.example</code>), lalu
                jalankan ulang <code>npm run dev</code>.
              </p>
              <button type="button" className="btn btn-ghost" onClick={() => setDemo(true)}>
                Lihat antarmuka dengan placeholder demo
              </button>
            </StatusMessage>
          )}
          {list.status === 'error' && list.kind !== 'missing-key' && (
            <StatusMessage kind="error" title="Gagal memuat film">
              <p>{list.message}</p>
              <button type="button" className="btn btn-primary" onClick={() => setReload((n) => n + 1)}>
                Coba lagi
              </button>
            </StatusMessage>
          )}
          {list.status === 'success' && movies.length === 0 && (
            <StatusMessage kind="empty" title={`Tidak ada hasil untuk “${trimmed}”`}>
              <p>Coba judul lain atau periksa ejaan.</p>
            </StatusMessage>
          )}
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {list.status === 'loading' ? 'Memuat film…' : ''}
        </p>
      </main>

      {demo && (
        <p className="demo-banner" role="note">
          MODE DEMO — placeholder lokal, bukan data TMDB.
        </p>
      )}

      {detailMovie && <DetailPanel movie={detailMovie} reduced={reduced} onClose={() => setDetailMovie(null)} />}
    </div>
  );
}
