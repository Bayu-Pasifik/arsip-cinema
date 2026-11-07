import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { youtubeEmbedUrl } from '../services/tmdb';

interface Props {
  title: string;
  videoKey: string;
  reduced: boolean;
  onClose: () => void;
}

/**
 * Lightbox trailer YouTube. Iframe baru dibuat saat dibuka (tidak ada permintaan ke YouTube sebelum pengguna menekan tombol).
 * Esc / tombol Tutup / klik latar menutup; fokus dikurung di dalam dialog dan dikembalikan ke pemicu.
 */
export default function TrailerModal({ title, videoKey, reduced, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const src = youtubeEmbedUrl(videoKey);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (reduced || !root.current) return onClose();
    gsap.to(root.current, { opacity: 0, duration: 0.2, onComplete: onClose });
  };

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    if (!reduced && root.current) {
      gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo('.trailer-frame', { scale: 0.94, y: 20 }, { scale: 1, y: 0, duration: 0.45, ease: 'power3.out' });
    }
    return () => prev?.focus?.({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab' && root.current) {
        const f = root.current.querySelectorAll<HTMLElement>('button, iframe, a[href]');
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
  }, []);

  if (!src) return null;

  return createPortal(
    <div
      className="trailer"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer film ${title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <button type="button" className="btn trailer-close" ref={closeBtn} onClick={close}>
        Tutup <span aria-hidden="true">✕</span>
      </button>
      <div className="trailer-frame">
        <iframe
          src={src}
          title={`Trailer ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <a
        className="trailer-alt"
        href={`https://www.youtube.com/watch?v=${videoKey}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Buka di YouTube
      </a>
    </div>,
    document.body,
  );
}
