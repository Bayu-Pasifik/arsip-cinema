import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '../hooks/useEnv';
import type { MovieDetail } from '../types/tmdb';
import { buildGallery } from '../utils/gallery';
import { translationOptions } from '../utils/translations';
import ImageGallery from './ImageGallery';
import KeywordChips from './KeywordChips';
import MovieRail from './MovieRail';
import ReviewList from './ReviewList';
import TranslationsPanel from './TranslationsPanel';
import WatchProviders, { WATCH_REGION } from './WatchProviders';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface Props {
  detail: MovieDetail | null;
  onOpenMovie: (id: number) => void;
  /** indeks pada daftar gabungan galeri (lihat buildGallery) */
  onOpenImage: (index: number) => void;
}

/** Bagian di bawah cerita scroll: konten tambahan dari TMDB (tiap blok hanya tampil bila datanya ada). */
export default function StoryMore({ detail, onOpenMovie, onOpenImage }: Props) {
  const gallery = useMemo(() => buildGallery(detail), [detail]);
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Semua blok di bawah cerita muncul dengan animasi saat di-scroll (sekali per blok): judul naik + garis memanjang,
  // lalu isinya (thumbnail, kartu, chip, ulasan, penyedia) masuk bergantian.
  useGSAP(
    () => {
      const el = root.current;
      if (!el || reduced) return;
      const scroller = el.closest<HTMLElement>('.story') ?? undefined;
      const trigger = (t: Element) => ({ trigger: t, scroller, start: 'top 90%', once: true });

      const head = el.querySelector('.more-head');
      if (head) {
        gsap
          .timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: trigger(head) })
          .from(head.querySelector('span'), { yPercent: 110, duration: 0.9 }, 0)
          .fromTo(head, { '--sec-line': '0%' }, { '--sec-line': '100%', duration: 1.1, ease: 'power2.inOut' }, 0.15);
      }

      // [selektor isi, animasi awal, jeda antar item]
      const BODY: [string, gsap.TweenVars, number][] = [
        ['.gal-item', { x: 70, scale: 0.92, clipPath: 'inset(0% 100% 0% 0%)', duration: 0.9 }, 0.08],
        ['.mv-item', { x: 60, y: 24, scale: 0.94, duration: 0.8 }, 0.07],
        ['.st-chip', { y: 16, scale: 0.9, duration: 0.5 }, 0.03],
        ['.wp-group', { y: 30, duration: 0.8 }, 0.15],
        ['.rv', { y: 44, duration: 0.9 }, 0.16],
        ['.tr-label, .tr-select, .tr-body', { y: 24, duration: 0.7 }, 0.1],
      ];

      el.querySelectorAll<HTMLElement>(':scope > section').forEach((sec) => {
        const heading = sec.querySelector('.tag');
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: trigger(sec) });
        if (heading) {
          tl.from(heading, { y: 28, opacity: 0, duration: 0.7 }, 0);
          tl.fromTo(heading, { '--sec-line': '0%' }, { '--sec-line': '100%', duration: 1, ease: 'power2.inOut' }, 0.1);
        }
        let any = false;
        for (const [sel, vars, each] of BODY) {
          const targets = sec.querySelectorAll(sel);
          if (!targets.length) continue;
          any = true;
          tl.from(targets, { opacity: 0, ...vars, stagger: each, clearProps: 'opacity,transform,clipPath' }, 0.2);
        }
        // blok tanpa daftar (mis. catatan atribusi): isi di luar judul naik sekaligus
        if (!any) {
          const rest = Array.from(sec.children).filter((c) => c !== heading);
          if (rest.length) tl.from(rest, { opacity: 0, y: 24, duration: 0.7, stagger: 0.1, clearProps: 'opacity,transform' }, 0.2);
        }
      });
    },
    { scope: root, dependencies: [reduced, detail?.id], revertOnUpdate: true },
  );

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
    <div className="story-more" ref={root}>
      <div className="more-head">
        <h2 className="more-head-title">
          <span>Jelajahi lebih jauh</span>
        </h2>
      </div>
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
