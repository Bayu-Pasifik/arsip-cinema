import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useT } from '../i18n';
import { imageUrl } from '../services/tmdb';

export interface GalleryImage {
  path: string;
  kind: 'backdrop' | 'poster';
  width: number;
  height: number;
}

interface Props {
  title: string;
  images: GalleryImage[];
  start: number;
  reduced: boolean;
  onClose: () => void;
}

/**
 * Lightbox galeri gambar. ← → berganti gambar, Esc / tombol Tutup / klik latar menutup;
 * fokus dikurung di dalam dialog dan dikembalikan ke pemicu.
 */
export default function ImageLightbox({ title, images, start, reduced, onClose }: Props) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const [i, setI] = useState(Math.min(Math.max(start, 0), images.length - 1));
  const n = images.length;

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (reduced || !root.current) return onClose();
    gsap.to(root.current, { opacity: 0, duration: 0.2, onComplete: onClose });
  };
  const step = (d: number) => setI((cur) => (cur + d + n) % n);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    if (!reduced && root.current) gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    return () => prev?.focus?.({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'Tab' && root.current) {
        const f = root.current.querySelectorAll<HTMLElement>('button');
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
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const cur = images[i];
  const src = cur ? imageUrl(cur.path, cur.kind, cur.kind === 'backdrop' ? 'w1280' : 'w780') : null;
  if (!cur || !src) return null;

  return createPortal(
    <div
      className="lightbox"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`Galeri gambar ${title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <button type="button" className="btn lightbox-close" ref={closeBtn} onClick={close}>
        {t('common.close')} <span aria-hidden="true">✕</span>
      </button>
      <img
        key={cur.path}
        className="lightbox-img"
        src={src}
        alt={t('more.imageAlt', { kind: t(cur.kind === 'backdrop' ? 'more.kindBackdrop' : 'more.kindPoster'), title, n: i + 1, total: n })}
        width={cur.width}
        height={cur.height}
      />
      {n > 1 && (
        <div className="lightbox-nav">
          <button type="button" className="btn" onClick={() => step(-1)} aria-label={t('more.imagePrev')}>
            ←
          </button>
          <span aria-live="polite">
            {i + 1} / {n}
          </span>
          <button type="button" className="btn" onClick={() => step(1)} aria-label={t('more.imageNext')}>
            →
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
