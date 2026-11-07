import { useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { textureUrl } from '../services/tmdb';
import type { Movie } from '../types/tmdb';
import { clamp } from '../utils/format';
import { POSTER_H, POSTER_W, type Stage } from './stage';
import { usePosterTexture } from './usePosterTexture';

interface Props {
  movie: Movie;
  index: number;
  stage: Stage;
  compact: boolean;
  onPick: (index: number) => void;
}

const lerp = THREE.MathUtils.lerp;

/**
 * Tumpukan kartu diagonal: poster fokus di depan, sisanya menumpuk ke belakang
 * (kanan-atas, makin jauh makin kecil). Poster yang sudah dilewati terbang ke kiri dan memudar.
 */
export function Poster({ movie, index, stage, compact, onPick }: Props) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const shadowMat = useRef<THREE.MeshBasicMaterial>(null);
  const frameMat = useRef<THREE.MeshBasicMaterial>(null);
  const hover = useRef({ target: 0, value: 0 });
  const size = useThree((s) => s.size);

  const tex = usePosterTexture(textureUrl(movie.poster_path, compact ? 'w185' : 'w342'), movie.title);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const d = index - stage.focus;
    const e = stage.enter;
    const wide = size.width / size.height > 1.15;

    const h = hover.current;
    h.value += (h.target - h.value) * Math.min(1, dt * 10);

    // tata letak dasar: pembuka = tumpukan di bawah judul; jelajah = tumpukan di kanan (lebar) / atas (potret)
    const baseX = lerp(-2.4, wide ? 1.5 : -0.6, e);
    const baseY = lerp(-3.1, wide ? 0 : 0.9, e);
    const baseScale = lerp(1.05, wide ? 1.3 : 1.2, e);

    const t = Math.max(0, d); // jarak ke belakang tumpukan
    const gone = Math.max(0, -d); // jarak yang sudah dilewati

    const local = clamp(stage.spawn * 1.7 - Math.abs(d) * 0.1, 0, 1);
    const eased = 1 - Math.pow(1 - local, 3);

    const x = baseX + t * 0.62 * baseScale * 0.7 - gone * 4.2;
    const y = baseY + t * 0.26 * baseScale * 0.7 + gone * 0.5 - (1 - eased) * 3 + h.value * 0.12;
    const z = -t * 1.05 - gone * 0.4 + h.value * 0.35;

    g.position.set(x, y, z);
    g.rotation.set(0, -0.3 + gone * 0.3, t * 0.035 - gone * 0.12);
    g.scale.setScalar(baseScale * Math.pow(0.97, t) * (0.9 + 0.1 * eased));
    g.visible = local > 0.001 && d > -1.8 && d < 9;

    const fade = (1 - clamp((t - 5.5) / 3, 0, 1)) * (1 - clamp(gone / 0.9, 0, 1));
    if (mat.current) {
      mat.current.opacity = eased * fade;
      // kartu yang jauh sedikit menyatu dengan latar (kesan kedalaman)
      mat.current.color.setScalar(1 - Math.min(0.14, t * 0.025));
    }
    if (shadowMat.current) shadowMat.current.opacity = 0.16 * eased * fade;
    if (frameMat.current) frameMat.current.opacity = eased * fade;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // drag/swipe, bukan klik
    onPick(index);
  };

  return (
    <group ref={group}>
      <mesh position={[0.14, -0.16, -0.06]}>
        <planeGeometry args={[POSTER_W + 0.12, POSTER_H + 0.12]} />
        <meshBasicMaterial ref={shadowMat} color="#12161c" transparent opacity={0.16} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[POSTER_W + 0.1, POSTER_H + 0.1]} />
        <meshBasicMaterial ref={frameMat} color="#ffffff" transparent toneMapped={false} />
      </mesh>
      <mesh
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover.current.target = 1;
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          hover.current.target = 0;
          document.body.style.cursor = '';
        }}
      >
        <planeGeometry args={[POSTER_W, POSTER_H]} />
        <meshBasicMaterial key={tex ? tex.uuid : 'none'} ref={mat} map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}
