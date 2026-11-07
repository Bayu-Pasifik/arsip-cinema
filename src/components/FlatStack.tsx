import { imageUrl } from '../services/tmdb';
import type { Movie } from '../types/tmdb';

interface Props {
  movies: Movie[];
  index: number;
  entered: boolean;
  onPick: (index: number) => void;
}

/**
 * Fallback 2D untuk perangkat tanpa WebGL: tumpukan kartu yang sama, dibuat dengan CSS transform.
 * Dekoratif (aria-hidden); navigasi keyboard/pembaca layar lewat caption dan rel thumbnail.
 */
export default function FlatStack({ movies, index, entered, onPick }: Props) {
  return (
    <div className={`flat-stack${entered ? '' : ' is-hero'}`} aria-hidden="true">
      {movies.map((m, i) => {
        const d = i - index;
        if (d < -1 || d > 8) return null;
        const t = Math.max(0, d);
        const gone = d < 0;
        const src = imageUrl(m.poster_path, 'poster', 'w342');
        const style = {
          transform: gone
            ? 'translate3d(-130%, 6%, 0) rotate(-8deg)'
            : `translate3d(${t * 9}%, ${-t * 3.5}%, ${-t}px) scale(${Math.pow(0.97, t)}) rotate(${t * 0.9}deg)`,
          opacity: gone ? 0 : Math.max(0, 1 - Math.max(0, t - 5) / 3),
          zIndex: 100 - i,
          pointerEvents: gone ? ('none' as const) : ('auto' as const),
        };
        return (
          <div className="flat-card" key={m.id} style={style} onClick={() => onPick(i)}>
            {src ? (
              <img src={src} alt="" width={342} height={513} draggable={false} />
            ) : (
              <span className="flat-ph">{m.title}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
