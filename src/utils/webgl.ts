import { useSyncExternalStore } from 'react';

/**
 * Deteksi dukungan WebGL + kegagalan saat runtime (context hilang, error render).
 * Tambahkan `?webgl=off` pada URL untuk mensimulasikan perangkat tanpa WebGL (pengujian).
 */
function detect(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('webgl') === 'off') return false;
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const supported = detect();
let failed = false;
const listeners = new Set<() => void>();

export function reportWebGLFailure() {
  if (failed) return;
  failed = true;
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** true bila adegan 3D boleh dipakai; false → tampilkan fallback 2D. */
export const useWebGL = () => useSyncExternalStore(subscribe, () => supported && !failed, () => true);
