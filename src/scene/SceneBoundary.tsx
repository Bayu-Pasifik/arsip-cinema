import { Component, useEffect, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { reportWebGLFailure } from '../utils/webgl';

/** Menangkap error saat membuat/merender Canvas (mis. WebGL gagal dibuat) lalu beralih ke fallback 2D. */
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    reportWebGLFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Dipasang di dalam <Canvas>: bila konteks WebGL hilang, beralih ke fallback 2D. */
export function ContextWatch() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      reportWebGLFailure();
    };
    el.addEventListener('webglcontextlost', onLost);
    return () => el.removeEventListener('webglcontextlost', onLost);
  }, [gl]);
  return null;
}
