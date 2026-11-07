import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { Movie } from '../types/tmdb';
import { Poster } from './Poster';
import type { Stage } from './stage';

const BG = '#dfe5ec';

function CameraRig({ reduced }: { reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  const smooth = useRef({ x: 0, y: 0 });

  useFrame(({ pointer, size }, dt) => {
    const k = reduced ? 0 : 1;
    smooth.current.x += (pointer.x - smooth.current.x) * Math.min(1, dt * 2.5);
    smooth.current.y += (pointer.y - smooth.current.y) * Math.min(1, dt * 2.5);

    // layar potret: mundurkan kamera agar tumpukan muat lebar
    const aspect = size.width / size.height;
    const z = aspect < 1 ? Math.max(9, 5.6 / (0.63 * aspect)) : 9;
    camera.position.set(smooth.current.x * 0.5 * k, smooth.current.y * 0.3 * k, z);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Bridge({ stage }: { stage: Stage }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    stage.invalidate = invalidate;
    return () => {
      stage.invalidate = () => {};
    };
  }, [stage, invalidate]);
  return null;
}

interface Props {
  movies: Movie[];
  stage: Stage;
  reduced: boolean;
  compact: boolean;
  onPick: (index: number) => void;
}

export default function ArchiveScene({ movies, stage, reduced, compact, onPick }: Props) {
  // hanya render poster yang mungkin terlihat (hemat tekstur) — indeks asli tetap dipertahankan
  const items = useMemo(() => movies.map((m, i) => ({ m, i })), [movies]);
  return (
    <Canvas
      aria-hidden="true"
      frameloop={reduced ? 'demand' : 'always'}
      dpr={compact ? 1 : [1, 1.75]}
      camera={{ fov: 35, near: 0.1, far: 60, position: [0, 0, 9] }}
      gl={{ antialias: !compact, powerPreference: 'high-performance' }}
      onPointerMissed={() => {
        document.body.style.cursor = '';
      }}
    >
      <color attach="background" args={[BG]} />
      <Bridge stage={stage} />
      <CameraRig reduced={reduced} />
      {items.map(({ m, i }) => (
        <Poster key={m.id} movie={m} index={i} stage={stage} compact={compact} onPick={onPick} />
      ))}
    </Canvas>
  );
}
