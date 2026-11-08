import type { PointerEvent, Ref } from 'react';

interface Props {
  onClick: () => void;
  /** teks muka depan (yang terbaca pembaca layar) */
  label?: string;
  /** teks muka bawah yang muncul saat tombol berputar */
  hint?: string;
  variant?: 'light' | 'dark';
  buttonRef?: Ref<HTMLButtonElement>;
  className?: string;
}

/**
 * Tombol kembali 3D: prisma yang berputar ke muka kedua saat disorot/fokus, miring mengikuti kursor,
 * dan "tenggelam" saat ditekan. Semua gerak dimatikan lewat prefers-reduced-motion (lihat styles.css).
 */
export default function BackButton({ onClick, label = 'Kembali', hint = 'Ke arsip', variant = 'light', buttonRef, className = '' }: Props) {
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * 16).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = (e: PointerEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.style.removeProperty('--ry');
    el.style.removeProperty('--rx');
    el.style.removeProperty('--gx');
  };

  return (
    <button
      type="button"
      ref={buttonRef}
      className={`back3d back3d-${variant} ${className}`.trim()}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className="back3d-box">
        <span className="back3d-face back3d-front">
          <span className="back3d-arrow" aria-hidden="true">
            ←
          </span>
          {label}
        </span>
        <span className="back3d-face back3d-under" aria-hidden="true">
          {hint}
          <span className="back3d-arrow" aria-hidden="true">
            ✕
          </span>
        </span>
      </span>
    </button>
  );
}
