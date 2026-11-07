import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function placeholderTexture(label: string, note = 'TANPA POSTER'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 342;
  c.height = 513;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f7f9fb';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#b8330a';
  g.lineWidth = 3;
  g.strokeRect(16, 16, c.width - 32, c.height - 32);
  g.fillStyle = '#b8330a';
  g.font = '700 16px sans-serif';
  g.fillText(note, 32, 52);
  g.fillStyle = '#12161c';
  g.font = '40px serif';
  const words = label.split(' ');
  let line = '';
  let y = 200;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > c.width - 64 && line) {
      g.fillText(line, 32, y);
      line = w;
      y += 46;
    } else line = test;
  }
  g.fillText(line, 32, y);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Memuat tekstur poster TMDB; membersihkan (dispose) saat dilepas. */
export function usePosterTexture(url: string | null, title: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  useEffect(() => {
    let disposed = false;
    let current: THREE.Texture | null = null;

    if (!url) {
      current = placeholderTexture(title);
      setTex(current);
      invalidate();
    } else {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (t) => {
          if (disposed) {
            t.dispose();
            return;
          }
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = Math.min(4, maxAniso);
          current = t;
          setTex(t);
          invalidate();
        },
        undefined,
        () => {
          if (disposed) return;
          current = placeholderTexture(title, 'POSTER GAGAL DIMUAT');
          setTex(current);
          invalidate();
        },
      );
    }
    return () => {
      disposed = true;
      current?.dispose();
      setTex(null);
    };
  }, [url, title, invalidate, maxAniso]);

  return tex;
}
