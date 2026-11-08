import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useEnv';
import { useT } from '../i18n';

interface Props {
  /** nama baris, dipakai pada label tombol (mis. "Galeri adegan") */
  label: string;
  /** kelas tambahan pada pembungkus (mis. untuk mengatur posisi tombol) */
  className?: string;
  children: ReactNode;
}

/** Baris geser mendatar tanpa scrollbar, dengan tombol sebelumnya/berikutnya di tepi (disembunyikan di layar sentuh). */
export default function Carousel({ label, className, children }: Props) {
  const t = useT();
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
    // gambar yang selesai dimuat / ukuran yang berubah mengubah lebar isi → hitung ulang status tombol
    el.addEventListener('load', measure, true);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // animasi masuk (transform) sempat melebarkan isi → hitung ulang setelah selesai dan saat disentuh
    const t = window.setTimeout(measure, 2500);
    const box = el.parentElement;
    box?.addEventListener('pointerenter', measure);
    box?.addEventListener('focusin', measure);
    return () => {
      window.clearTimeout(t);
      box?.removeEventListener('pointerenter', measure);
      box?.removeEventListener('focusin', measure);
      el.removeEventListener('scroll', measure);
      el.removeEventListener('load', measure, true);
      ro.disconnect();
    };
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = list.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div className={`mv-carousel${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="mv-nav mv-prev"
        aria-label={t('more.carouselPrev', { label })}
        disabled={edge.start}
        onClick={() => page(-1)}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <ul className="mv-list" ref={list}>
        {children}
      </ul>
      <button
        type="button"
        className="mv-nav mv-next"
        aria-label={t('more.carouselNext', { label })}
        disabled={edge.end}
        onClick={() => page(1)}
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
