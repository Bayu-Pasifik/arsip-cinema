import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Browse from './components/Browse';
import MovieRoute from './components/MovieRoute';
import PeopleRoute from './components/PeopleRoute';
import PersonRoute from './components/PersonRoute';
import Hero from './components/Hero';
import StatusMessage from './components/StatusMessage';
import FlatStack from './components/FlatStack';
import TopBar from './components/TopBar';
import { SceneBoundary } from './scene/SceneBoundary';
import { useWebGL } from './utils/webgl';
import { useCompact, useDebounced, useReducedMotion } from './hooks/useEnv';
import { useMovieList } from './hooks/useMovieList';
import { useGenres } from './hooks/useGenres';
import { useImdbJump } from './hooks/useImdbJump';
import { useKeywordName } from './hooks/useKeywordName';
import { useCompanyName } from './hooks/useCompanyName';
import { useNetwork } from './hooks/useNetwork';
import { usePersonName } from './hooks/usePersonName';
import { useProviders } from './hooks/useWatchProviders';
import { useRegion } from './services/region';
import { useCollectionName } from './hooks/useCollectionName';
import { hasFilters, NO_FILTERS, sameFilters, type Filters } from './utils/filters';
import { languageName } from './utils/format';
import { isCollectionKey, useCollections } from './services/collections';
import { browsePath, cameFromApp, moviePath, navigate, personPath, useRoute } from './hooks/useRoute';
import { createStage } from './scene/stage';
import { isTvCategory } from './services/tmdb';
import { inMode, tvId } from './utils/media';
import { useT } from './i18n';
import type { Category, ListSource } from './types/tmdb';
import { clamp } from './utils/format';

gsap.registerPlugin(useGSAP);
// Pada perangkat lambat, animasi UI tetap selesai tepat waktu (tidak ikut "melambat" saat frame lag).
gsap.ticker.lagSmoothing(0);

const ArchiveScene = lazy(() => import('./scene/ArchiveScene'));

export default function App() {
  const t = useT();
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
  const personId = route.name === 'person' ? route.id : null;
  const peopleOpen = route.name === 'people';
  const overlayOpen = detailId !== null || personId !== null || peopleOpen;

  const [category, setCategory] = useState<Category>(route.name === 'browse' ? route.category : 'trending');
  const [mode, setMode] = useState<'movie' | 'tv'>(isTvCategory(category) ? 'tv' : 'movie');
  const [query, setQuery] = useState(route.name === 'browse' ? route.q : '');
  const [filters, setFilters] = useState<Filters>(route.name === 'browse' ? route.filters : NO_FILTERS);
  const genres = useGenres(mode);
  const providers = useProviders(useRegion(), mode);
  const keywordName = useKeywordName(filters.keyword);
  const collectionName = useCollectionName(filters.collection);
  const companyName = useCompanyName(filters.company);
  const networkName = useNetwork(filters.network)?.name ?? null;
  const castName = usePersonName(filters.cast);
  const crewName = usePersonName(filters.crew);
  const filtered = hasFilters(filters);
  const [demo, setDemo] = useState(false);
  const [reload, setReload] = useState(0);
  const [index, setIndex] = useState(0);

  const debounced = useDebounced(query, 400);
  const trimmed = debounced.trim();
  const searchActive = trimmed.length >= 2;

  const source: ListSource = demo
    ? { kind: 'demo' }
    : searchActive
      ? { kind: 'search', query: trimmed, media: mode === 'tv' ? 'tv' : undefined }
      : filters.collection !== null
        ? { kind: 'collection', id: filters.collection }
        : filtered
          ? { kind: 'discover', filters, media: mode === 'tv' ? 'tv' : undefined }
          : { kind: 'category', category };

  // tempel ID IMDb (tt…/nm…) di kotak cari → langsung buka film/orangnya
  useImdbJump(trimmed, (hit) => {
    setQuery('');
    navigate(hit.kind === 'person' ? personPath(hit.id) : moviePath(hit.kind === 'tv' ? tvId(hit.id) : hit.id));
  });

  const collections = useCollections();
  const list = useMovieList(source, reload, collections);
  const inCollection = !demo && !searchActive && !filtered && isCollectionKey(category);

  // Daftar baru → indeks fokus kembali ke 0 SEKARANG (saat render, sebelum efek berjalan), supaya prefetch halaman
  // berikutnya tidak membaca indeks lama dari daftar sebelumnya.
  // Favorit/Watchlist ditampilkan menurut saklar Film / Serial TV: berganti jenis = daftar baru (fokus kembali ke awal)
  const generation = list.generation + (inCollection && mode === 'tv' ? 0.5 : 0);
  const [seenGeneration, setSeenGeneration] = useState(generation);
  if (seenGeneration !== generation) {
    setSeenGeneration(generation);
    setIndex(0);
  }
  const movies = useMemo(() => (inCollection ? list.movies.filter((m) => inMode(m, mode)) : list.movies), [inCollection, list.movies, mode]);
  const searching = !demo && (query.trim() !== trimmed || (searchActive && list.status === 'loading'));
  const urlQuery = searchActive ? trimmed : '';
  const label = demo ? t('cat.demo') : searchActive
      ? t('cat.results', { query: trimmed })
      : filters.collection !== null
        ? (collectionName ?? t('cat.collection'))
        : filtered
        ? [
            genres.find((g) => g.id === filters.genre)?.name,
            providers.find((p) => p.provider_id === filters.provider)?.provider_name,
            filters.year,
            filters.rating !== null ? `★ ${filters.rating}+` : null,
            filters.keyword !== null ? (keywordName ?? `#${filters.keyword}`) : null,
            filters.company !== null ? (companyName ?? `#${filters.company}`) : null,
            filters.network !== null ? (networkName ?? `#${filters.network}`) : null,
            filters.cast !== null ? (castName ?? `#${filters.cast}`) : null,
            filters.crew !== null ? (crewName ?? `#${filters.crew}`) : null,
            filters.cert,
            filters.lang ? languageName(filters.lang) : null,
            filters.runtime ? t(`runtime.${filters.runtime}`) : null,
            filters.decade ? `${filters.decade}–${filters.decade + 9}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || t('cat.filtered')
        : t(`cat.${category}`);

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
    if (route.category !== category) {
      setCategory(route.category);
      if (!isCollectionKey(route.category)) setMode(isTvCategory(route.category) ? 'tv' : 'movie');
    }
    if (route.q.trim() !== urlQuery) setQuery(route.q);
    if (!sameFilters(route.filters, filters)) setFilters(route.filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // state pencarian → URL (replace, agar riwayat tidak penuh oleh tiap ketikan)
  useEffect(() => {
    if (route.name !== 'browse') return;
    if (route.q.trim() !== urlQuery) navigate(browsePath(category, urlQuery, filters), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  useEffect(() => {
    document.title = route.name === 'movie' ? t('page.title.movie') : t('page.title.home');
  }, [route, t]);

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

  const closePerson = useCallback(() => {
    if (cameFromApp()) window.history.back();
    else navigate(browsePath(category, urlQuery, filters), { replace: true });
  }, [category, urlQuery, filters]);

  const closeDetail = useCallback(() => {
    uiClosed.current = true;
    if (cameFromApp()) window.history.back();
    else navigate(browsePath(category, urlQuery, filters), { replace: true });
  }, [category, urlQuery, filters]);

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
  }, [generation, listReady, reduced, stage]);

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
      if (!entered || overlayOpen) return;
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
  }, [entered, overlayOpen, goTo, index, movies.length]);

  const lastWheel = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if (!entered || overlayOpen) return;
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
    if (x0 === null || !entered || overlayOpen) return;
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
        searchTerm={searchActive ? trimmed : ''}
        mode={mode}
        onMode={(m) => {
          setMode(m);
          // di Favorit/Watchlist saklar hanya menyaring jenis isi daftar
          if (isCollectionKey(category) && !searchActive && !filtered) return;
          const c: Category = m === 'tv' ? 'tv_trending' : 'trending';
          setQuery('');
          setFilters(NO_FILTERS);
          setCategory(c);
          navigate(browsePath(c));
        }}
        filters={filters}
        genres={genres}
        onFilters={(f) => {
          setQuery('');
          setFilters(f);
          navigate(browsePath(category, '', f));
        }}
        onCategory={(c) => {
          setQuery('');
          setFilters(NO_FILTERS);
          setCategory(c);
          navigate(browsePath(c));
        }}
        onQuery={setQuery}
        counts={{
          favorites: collections.favorites.filter((m) => inMode(m, mode)).length,
          watchlist: collections.watchlist.filter((m) => inMode(m, mode)).length,
        }}
        onHome={() => navigate('/')}
      />

      <main>
        <Hero ref={heroRef} onEnter={() => navigate(browsePath(category, urlQuery, filters))} />

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
            <StatusMessage kind="loading" title={t('status.loading')} />
          )}
          {list.status === 'error' && list.kind === 'missing-key' && (
            <StatusMessage kind="no-key" title={t('status.noKey')}>
              <p>
                {t('status.noKeyBody1')} <code>VITE_TMDB_API_KEY</code> {t('status.noKeyBody2')} <code>.env</code> {t('status.noKeyBody3')}{' '}
                <code>.env.example</code>{t('status.noKeyBody4')} <code>npm run dev</code>.
              </p>
              <button type="button" className="btn btn-ghost" onClick={() => setDemo(true)}>
                {t('status.demoButton')}
              </button>
            </StatusMessage>
          )}
          {list.status === 'error' && list.kind !== 'missing-key' && (
            <StatusMessage kind="error" title={t('status.error')}>
              <p>{list.message}</p>
              <button type="button" className="btn btn-primary" onClick={() => setReload((n) => n + 1)}>
                {t('status.retry')}
              </button>
            </StatusMessage>
          )}
          {list.status === 'success' && movies.length === 0 && inCollection && (
            <StatusMessage kind="empty" title={category === 'favorites' ? t('status.emptyFavorites') : t('status.emptyWatchlist')}>
              <p>
                {category === 'favorites'
                  ? t('status.emptyFavoritesBody')
                  : t('status.emptyWatchlistBody')}
              </p>
              <button type="button" className="btn btn-primary" onClick={() => navigate(browsePath('trending'))}>
                {t('status.explore')}
              </button>
            </StatusMessage>
          )}
          {list.status === 'success' && movies.length === 0 && !inCollection && (
            <StatusMessage kind="empty" title={t('status.noResults', { query: trimmed })}>
              <p>{t('status.noResultsBody')}</p>
            </StatusMessage>
          )}
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {list.status === 'loading' ? t('status.loadingShort') : ''}
        </p>
      </main>

      {!webgl && (
        <p className="gl-notice" role="status">
          {t('status.mode2d')}
          <span className="sr-only">{t('status.mode2dSr')}</span>
        </p>
      )}

      {demo && (
        <p className="demo-banner" role="note">
          {t('status.demoBanner')}
        </p>
      )}

      {peopleOpen && <PeopleRoute onClose={closePerson} onOpenPerson={(id) => navigate(personPath(id))} />}

      {personId !== null && <PersonRoute key={personId} id={personId} onClose={closePerson} onOpenMovie={openMovie} />}

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
