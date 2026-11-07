/**
 * Status adegan yang dimutasi langsung oleh GSAP (bukan state React) agar
 * animasi 60fps tidak memicu render ulang komponen.
 */
export interface Stage {
  /** indeks fokus (float) — poster ke-n berada di depan kamera saat focus === n */
  focus: number;
  /** 0 = pembuka (kamera jauh), 1 = mode jelajah */
  enter: number;
  /** 0→1 animasi muncul poster setelah daftar film berganti */
  spawn: number;
  /** diisi oleh Canvas; memaksa render bila frameloop="demand" (reduced motion) */
  invalidate: () => void;
}

export const createStage = (): Stage => ({ focus: 0, enter: 0, spawn: 0, invalidate: () => {} });

export const ARC_STEP = 0.3;
export const ARC_RADIUS = 7;
export const POSTER_W = 1.6;
export const POSTER_H = 2.4;
