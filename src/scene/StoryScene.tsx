import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { backdropTextureUrl, textureUrl } from '../services/tmdb';
import { POSTER_H, POSTER_W } from './stage';
import { usePosterTexture } from './usePosterTexture';

/** Progres scroll (0–1) yang ditulis oleh ScrollTrigger dan dibaca tiap frame oleh adegan 3D. */
export interface StoryProgress {
  p: number;
}

interface Props {
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  progress: StoryProgress;
  compact: boolean;
}

const BG = '#dfe5ec';
const lerp = THREE.MathUtils.lerp;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
/** 0→1 saat p bergerak dari a ke b */
const seg = (p: number, a: number, b: number) => smooth((p - a) / (b - a));

interface KF {
  p: number;
  x: number;
  y: number;
  s: number;
  ry: number;
  rz: number;
}

/** Keyframe pose poster per bab: hero → sinopsis → fakta → pemeran → penutup. */
const KFS: KF[] = [
  { p: 0, x: 0, y: -0.1, s: 1.35, ry: 0.0, rz: 0 },
  { p: 0.2, x: 2.3, y: 0, s: 1.25, ry: -0.55, rz: 0.04 },
  { p: 0.44, x: 2.3, y: 0, s: 1.05, ry: -0.2, rz: 0 },
  { p: 0.66, x: 2.3, y: 0, s: 1.05, ry: -0.35, rz: -0.03 },
  { p: 0.7, x: -2.7, y: 0.2, s: 0.95, ry: 0.5, rz: 0.04 },
  { p: 0.9, x: -2.7, y: 0.2, s: 0.95, ry: 0.35, rz: 0.02 },
  { p: 1, x: 0, y: 0.75, s: 1.2, ry: 0, rz: 0 },
];

function pose(p: number, wide: boolean) {
  let i = 0;
  while (i < KFS.length - 2 && p > KFS[i + 1].p) i++;
  const a = KFS[i];
  const b = KFS[i + 1];
  const t = smooth((p - a.p) / (b.p - a.p));
  const out = {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    s: lerp(a.s, b.s, t),
    ry: lerp(a.ry, b.ry, t),
    rz: lerp(a.rz, b.rz, t),
  };
  if (!wide) {
    out.x *= 0.15;
    out.y += 1.15;
    out.s *= 0.72;
  }
  return out;
}

function PosterCard({ posterPath, title, progress, compact }: Pick<Props, 'posterPath' | 'title' | 'progress' | 'compact'>) {
  const group = useRef<THREE.Group>(null);
  const size = useThree((s) => s.size);
  const tex = usePosterTexture(textureUrl(posterPath, compact ? 'w185' : 'w500'), title);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const wide = size.width / size.height > 1.1;
    const p = progress.p;
    const k = pose(p, wide);
    // masuk: poster naik dari bawah saat halaman dibuka
    const intro = seg(p, 0, 0.04);
    g.position.set(k.x, k.y - (1 - intro) * 0.6 + Math.sin(performance.now() / 1600) * 0.04, 0);
    g.rotation.set(0, k.ry, k.rz);
    g.scale.setScalar(k.s);
  });

  return (
    <group ref={group}>
      <mesh position={[0.16, -0.18, -0.08]}>
        <planeGeometry args={[POSTER_W + 0.12, POSTER_H + 0.12]} />
        <meshBasicMaterial color="#12161c" transparent opacity={0.16} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[POSTER_W + 0.1, POSTER_H + 0.1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[POSTER_W, POSTER_H]} />
        <meshBasicMaterial key={tex ? tex.uuid : 'none'} map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Backdrop film sebagai "hantu" raksasa di belakang; bergeser dan membesar mengikuti scroll (parallax). */
function Backdrop({ path, progress }: { path: string | null; progress: StoryProgress }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = usePosterTexture(backdropTextureUrl(path), '');
  const size = useThree((st) => st.size);

  useFrame(() => {
    const m = mesh.current;
    if (!m || !mat.current) return;
    const p = progress.p;
    m.position.set(lerp(-1.2, 1.2, p), lerp(-0.4, 0.8, p), -7);
    // layar potret butuh plane lebih besar agar tepinya tak terlihat
    m.scale.setScalar(lerp(1.0, 1.35, p) * (size.width / size.height < 1 ? 2.4 : 1));
    // terang di hero & penutup, redup di tengah agar teks tetap terbaca
    const dim = 1 - 0.6 * seg(p, 0.1, 0.25) * (1 - seg(p, 0.9, 1));
    mat.current.opacity = 0.28 * dim * seg(p, 0, 0.03);
  });

  if (!path) return null;
  return (
    <mesh ref={mesh}>
      <planeGeometry args={[19.2, 10.8]} />
      <meshBasicMaterial key={tex ? tex.uuid : 'none'} ref={mat} map={tex} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/** Cincin titik-titik yang terisi sesuai rating (0–10) saat bab "fakta" berlangsung. */
function RatingRing({ rating, progress, compact }: { rating: number; progress: StoryProgress; compact: boolean }) {
  const DOTS = compact ? 48 : 72;
  const group = useRef<THREE.Group>(null);
  const track = useRef<THREE.InstancedMesh>(null);
  const fill = useRef<THREE.InstancedMesh>(null);
  const size = useThree((s) => s.size);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const g = group.current;
    if (!g || !track.current || !fill.current) return;
    const wide = size.width / size.height > 1.1;
    const p = progress.p;
    const k = pose(p, wide);
    const vis = seg(p, 0.42, 0.5) * (1 - seg(p, 0.64, 0.68));
    g.visible = vis > 0.001;
    if (!g.visible) return;
    g.position.set(k.x, k.y, 0.1);
    g.rotation.z = -p * 2;
    g.scale.setScalar(vis * (wide ? 1 : 0.72));

    const R = 2.05;
    const filled = Math.round(DOTS * (rating / 10) * seg(p, 0.46, 0.6));
    for (let i = 0; i < DOTS; i++) {
      const a = (i / DOTS) * Math.PI * 2 + Math.PI / 2;
      dummy.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      dummy.scale.setScalar(0.5);
      dummy.updateMatrix();
      track.current.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(i < filled ? 1.5 : 0.0001);
      dummy.updateMatrix();
      fill.current.setMatrixAt(i, dummy.matrix);
    }
    track.current.instanceMatrix.needsUpdate = true;
    fill.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group} visible={false}>
      <instancedMesh ref={track} args={[undefined, undefined, DOTS]}>
        <circleGeometry args={[0.04, 10]} />
        <meshBasicMaterial color="#8d99a8" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={fill} args={[undefined, undefined, DOTS]}>
        <circleGeometry args={[0.04, 10]} />
        <meshBasicMaterial color="#b8330a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** Lembar kertas melayang untuk kedalaman; kecepatan parallax berbeda per lembar. */
function Shards({ progress, count }: { progress: StoryProgress; count: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
          return x - Math.floor(x);
        };
        return { x: (r(1) - 0.5) * 16, y: (r(2) - 0.5) * 8, z: -1 - r(3) * 4, s: 0.3 + r(4) * 0.6, v: 0.6 + r(5) * 1.6, rot: r(6) * 3 };
      }),
    [count],
  );

  useFrame(() => {
    const p = progress.p;
    seeds.forEach((s, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.position.set(s.x - p * s.v * 1.5, s.y + p * s.v * 4 - 2, s.z);
      m.rotation.set(p * s.v * 1.2, s.rot + p * s.v * 2, p * s.v);
    });
  });

  return (
    <>
      {seeds.map((s, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} scale={s.s}>
          <planeGeometry args={[0.8, 1.1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function CameraRig({ progress }: { progress: StoryProgress }) {
  const camera = useThree((s) => s.camera);
  const sm = useRef({ x: 0, y: 0 });
  useFrame(({ pointer, size }, dt) => {
    sm.current.x += (pointer.x - sm.current.x) * Math.min(1, dt * 2.5);
    sm.current.y += (pointer.y - sm.current.y) * Math.min(1, dt * 2.5);
    const aspect = size.width / size.height;
    const z = aspect < 1 ? Math.max(9, 5.4 / (0.63 * aspect)) : 9;
    const p = progress.p;
    camera.position.set(sm.current.x * 0.5 + Math.sin(p * Math.PI) * 0.6, sm.current.y * 0.3, z - Math.sin(p * Math.PI * 2) * 0.5);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function StoryScene({ title, posterPath, backdropPath, rating, progress, compact }: Props) {
  return (
    <Canvas
      aria-hidden="true"
      dpr={compact ? 1 : [1, 1.75]}
      camera={{ fov: 35, near: 0.1, far: 60, position: [0, 0, 9] }}
      gl={{ antialias: !compact, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[BG]} />
      <CameraRig progress={progress} />
      <Backdrop path={backdropPath} progress={progress} />
      <Shards progress={progress} count={compact ? 6 : 14} />
      <PosterCard posterPath={posterPath} title={title} progress={progress} compact={compact} />
      <RatingRing rating={rating} progress={progress} compact={compact} />
    </Canvas>
  );
}
