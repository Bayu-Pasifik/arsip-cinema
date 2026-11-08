import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Browse from './components/Browse';
import MovieRoute from './components/MovieRoute';
import Hero from './components/Hero';
import StatusMessage from './components/StatusMessage';
import FlatStack from './components/FlatStack';
import TopBar from './components/TopBar';
import { SceneBoundary } from './scene/SceneBoundary';
import { useWebGL } from './utils/webgl';
import { useCompact, useDebounced, useReducedMotion } from './hooks/useEnv';
import { useMovieList } from './hooks/useMovieList';
import { isCollectionKey, useCollections } from './services/collections';
import { browsePath, cameFromApp, moviePath, navigate, useRoute } from './hooks/useRoute';
import { createStage } from './scene/stage';
import { CATEGORY_LABEL } from './services/tmdb';
import type { Category, ListSource } from './types/tmdb';
import { clamp } from './utils/format';

gsap.registerPlugin(useGSAP);
// Pada perangkat lambat, animasi UI tetap selesai tepat waktu (tidak ikut "melambat" saat frame lag).
gsap.ticker.lagSmoothing(0);

const ArchiveScene = lazy(() => import('./scene/ArchiveScene'));

export default function App() {
  const reduced = useReducedMotion();
  const compact = useCompact();
  const webgl = useWebGL();
  const stage = useMemo(createStage, []);

  const container = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const browseRef = useRef<HTMLDivElement>(null);

  const route = useRoute();
  const entered = route.name !== 'home';
  const detailId = route.name === 'movie' ? route.id : null;

  const [category, setCategory] = useState<Category>(route.name === 'browse' ? route.category : 'trending');
  const [query, setQuery] = useState(route.name === 'browse' ? route.q : '');
  const [demo, setDemo] = useState(false);
  const [reload, setReload] = useState(0);
  const [index, setIndex] = useState(0);

  const debounced = useDebounced(query, 400);
  const trimmed = debounced.trim();
  const searchActive = trimmed.length >= 2;

  const source: ListSource = demo
    ? { kind: 'demo' }
    : searchActive
      ? { kind: 'search', query: trimmed }
      : { kind: 'category', category };

  const collections = useCollections();
  const list = useMovieList(source, reload, collections);
  const inCollection = !demo && !searchActive && isCollectionKey(category);

  // Daftar baru → indeks fokus kembali ke 0 SEKARANG (saat render, sebelum efek berjalan), supaya prefetch halaman
  // berikutnya tidak membaca indeks lama dari daftar sebelumnya.
  const [seenGeneration, setSeenGeneration] = useState(list.generation);
  if (seenGeneration !== list.generation) {
    setSeenGeneration(list.generation);
    setIndex(0);
  }
  const movies = list.movies;
  const searching = !demo && (query.trim() !== trimmed || (searchActive && list.status === 'loading'));
  const urlQuery = searchActive ? trimmed : '';
  const label = demo ? 'Demo' : searchActive ? `Hasil “${trimmed}”` : CATEGORY_LABEL[category];

  // ---- GSAP: keadaan awal + animasi pembuka -------------------------------
  const { contextSafe } = useGSAP(
    () => {
      gsap.set([topRef.current, browseRef.current], { autoAlpha: 0 });
      if (reduced || entered) return; // tautan langsung ke /browse atau /movie: lewati intro hero
      gsap
        .timeline({ delay: 0.2 })
        .from('.line', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.12 })
        .from('.hero-fade', { y: 16, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 }, '-=0.6');
    },
    { scope: container },
  );

  const playEnter = contextSafe((instant: boolean) => {
    gsap.killTweensOf(stage, 'enter');
    if (reduced || instant) {
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

  const playLeave = contextSafe(() => {
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

  // rute berubah (klik, tombol Back/Forward, tautan langsung) → jalankan animasi masuk/keluar
  // Tautan langsung ke /browse atau /movie: terapkan keadaan "masuk" tanpa animasi. (Dijalankan ulang oleh StrictMode
  // setelah konteks GSAP di-revert, karena itu terpisah dari efek perubahan di bawah.)
  useEffect(() => {
    if (entered) playEnter(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastEntered = useRef(entered);
  useEffect(() => {
    if (lastEntered.current === entered) return;
    lastEntered.current = entered;
    if (entered) playEnter(false);
    else playLeave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered]);

  // URL → state (popstate / tautan langsung)
  useEffect(() => {
    if (route.name !== 'browse') return;
    // hanya terapkan bila berbeda: mencegah input pencarian "melompat" saat URL di-replace oleh debounce
    if (route.category !== category) setCategory(route.category);
    if (route.q.trim() !== urlQuery) setQuery(route.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // state pencarian → URL (replace, agar riwayat tidak penuh oleh tiap ketikan)
  useEffect(() => {
    if (route.name !== 'browse') return;
    if (route.q.trim() !== urlQuery) navigate(browsePath(category, urlQuery), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  useEffect(() => {
    document.title = route.name === 'movie' ? 'Detail film — Arsip Sinema' : 'Arsip Sinema — Jelajah Film 3D';
  }, [route]);

  const openMovie = useCallback((id: number) => navigate(moviePath(id)), []);
  // Back/Forward browser: detail dilepas dari URL tanpa melalui tombol kita → pertahankan sebentar agar animasi keluar jalan.
  // Id terakhir yang dibuka (ref, diperbarui di efek): saat detailId jadi null, instance detail yang sama tetap dirender
  // pada frame yang sama sehingga tidak ada kedipan/remount sebelum animasi keluar.
  const lastDetail = useRef<number | null>(null);
  const uiClosed = useRef(false);
  const [exited, setExited] = useState<number | null>(null);
  const [session, setSession] = useState(0);
  const ghostId =
    detailId === null && lastDetail.current !== null && lastDetail.current !== exited && !uiClosed.current && !reduced
      ? lastDetail.current
      : null;
  const ghostShown = useRef(false);
  useEffect(() => {
    if (detailId !== null) {
      // Forward saat animasi keluar masih jalan: instance lama sedang memudar → buang, pasang detail baru
      if (ghostShown.current) setSession((s) => s + 1);
      lastDetail.current = detailId;
      uiClosed.current = false;
      setExited(null);
    }
  }, [detailId]);
  // dideklarasikan SETELAH efek di atas: efek itu harus membaca nilai render sebelumnya
  useEffect(() => {
    ghostShown.current = ghostId !== null;
  }, [ghostId]);
  const clearGhost = useCallback(() => setExited(lastDetail.current), []);

  const closeDetail = useCallback(() => {
    uiClosed.current = true;
    if (cameFromApp()) window.history.back();
    else navigate(browsePath(category, urlQuery), { replace: true });
  }, [category, urlQuery]);

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

  // Daftar lokal bisa menyusut saat film dihapus: jaga agar fokus tetap di dalam rentang.
  useEffect(() => {
    if (movies.length === 0) {
      if (index !== 0) setIndex(0);
    } else if (index > movies.length - 1) {
      goTo(movies.length - 1);
    }
  }, [movies.length, index, goTo]);

  // daftar BARU dimuat (generation berubah) → fokus kembali ke awal + poster "muncul" dengan stagger;
  // menambahkan halaman berikutnya tidak mengubah generation sehingga fokus tidak terlempar
  const listReady = list.status === 'success';
  useEffect(() => {
    if (!listReady) return;
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
  }, [list.generation, listReady, reduced, stage]);

  // prefetch halaman berikutnya saat fokus mendekati akhir daftar yang sudah dimuat
  const { hasMore, loadingMore, moreError, loadMore } = list;
  useEffect(() => {
    if (entered && hasMore && !loadingMore && !moreError && index >= movies.length - 5) loadMore();
  }, [entered, hasMore, loadingMore, moreError, index, movies.length, loadMore]);

  useEffect(() => {
    const tweens = stage;
    return () => {
      gsap.killTweensOf(tweens);
    };
  }, [stage]);

  // ---- input: keyboard, wheel, swipe ---------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!entered || detailId !== null) return;
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
  }, [entered, detailId, goTo, index, movies.length]);

  const lastWheel = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if (!entered || detailId !== null) return;
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
    if (x0 === null || !entered || detailId !== null) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 60) goTo(index + (dx < 0 ? 1 : -1));
  };

  // klik poster: poster non-fokus → fokuskan; poster fokus → buka detail
  const onPick = useCallback(
    (i: number) => {
      if (!entered) return;
      if (i === index) {
        if (movies[i]) openMovie(movies[i].id);
      } else goTo(i);
    },
    [entered, goTo, index, movies, openMovie],
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
        {webgl ? (
          <SceneBoundary>
            <Suspense fallback={null}>
              {movies.length > 0 && (
                <ArchiveScene movies={movies} stage={stage} reduced={reduced} compact={compact} onPick={onPick} />
              )}
            </Suspense>
          </SceneBoundary>
        ) : (
          movies.length > 0 && <FlatStack movies={movies} index={index} entered={entered} onPick={onPick} />
        )}
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
          navigate(browsePath(c));
        }}
        onQuery={setQuery}
        counts={{ favorites: collections.favorites.length, watchlist: collections.watchlist.length }}
        onHome={() => navigate('/')}
      />

      <main>
        <Hero ref={heroRef} onEnter={() => navigate(browsePath(category, urlQuery))} />

        <Browse
          ref={browseRef}
          movies={movies}
          index={index}
          reduced={reduced}
          label={label}
          hasMore={hasMore}
          loadingMore={loadingMore}
          moreError={moreError}
          onLoadMore={loadMore}
          onGo={goTo}
          onOpen={() => movies[index] && openMovie(movies[index].id)}
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
          {list.status === 'success' && movies.length === 0 && inCollection && (
            <StatusMessage kind="empty" title={category === 'favorites' ? 'Belum ada film favorit' : 'Watchlist masih kosong'}>
              <p>
                {category === 'favorites'
                  ? 'Tekan tombol ♡ Favorit pada film yang Anda suka, lalu kembali ke sini.'
                  : 'Tekan tombol ＋ Watchlist pada film yang ingin Anda tonton nanti.'}
              </p>
              <button type="button" className="btn btn-primary" onClick={() => navigate(browsePath('trending'))}>
                Jelajahi film
              </button>
            </StatusMessage>
          )}
          {list.status === 'success' && movies.length === 0 && !inCollection && (
            <StatusMessage kind="empty" title={`Tidak ada hasil untuk “${trimmed}”`}>
              <p>Coba judul lain atau periksa ejaan.</p>
            </StatusMessage>
          )}
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {list.status === 'loading' ? 'Memuat film…' : ''}
        </p>
      </main>

      {!webgl && (
        <p className="gl-notice" role="status">
          Mode 2D · WebGL tidak tersedia
          <span className="sr-only">
            . Adegan 3D diganti tampilan datar di perangkat atau browser ini; semua fitur tetap berfungsi.
          </span>
        </p>
      )}

      {demo && (
        <p className="demo-banner" role="note">
          MODE DEMO — placeholder lokal, bukan data TMDB.
        </p>
      )}

      {(detailId ?? ghostId) !== null && (
        <MovieRoute
          key={session}
          id={(detailId ?? ghostId) as number}
          movies={movies}
          reduced={reduced}
          onClose={closeDetail}
          onOpenMovie={openMovie}
          leaving={detailId === null}
          onLeft={clearGhost}
        />
      )}
    </div>
  );
}
