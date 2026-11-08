import { useRef } from 'react';
import { useMovieDetail } from '../hooks/useMovieDetail';
import type { Movie } from '../types/tmdb';
import BackButton from './BackButton';
import MovieStory from './MovieStory';
import StatusMessage from './StatusMessage';

interface Props {
  id: number;
  movies: Movie[];
  reduced: boolean;
  onClose: () => void;
  /** URL sudah meninggalkan detail (Back browser): jalankan animasi keluar lalu panggil onLeft */
  leaving?: boolean;
  onLeft?: () => void;
  onOpenMovie: (id: number) => void;
}

/**
 * Menyediakan data film untuk rute /movie/:id. Bila film ada di daftar yang sedang dimuat, dipakai langsung;
 * bila tidak (tautan langsung / refresh), data diambil dari TMDB.
 */
export default function MovieRoute({ id, movies, reduced, onClose, leaving, onLeft, onOpenMovie }: Props) {
  // Ingat film terakhir yang ditemukan: bila film keluar dari daftar (mis. dihapus dari Favorit saat detail terbuka)
  // halaman detail tidak boleh dimuat ulang/berkedip.
  const cache = useRef<Movie | null>(null);
  const inList = movies.find((m) => m.id === id) ?? null;
  if (inList) cache.current = inList;
  const found = inList ?? (cache.current?.id === id ? cache.current : null);
  const state = useMovieDetail(found ? null : id);

  const story = (movie: Movie) => (
    <MovieStory
      key={movie.id}
      movie={movie}
      reduced={reduced}
      onClose={onClose}
      leaving={leaving}
      onLeft={onLeft}
      onOpenMovie={onOpenMovie}
    />
  );
  if (found) return story(found);
  if (state.status === 'success') return story(state.detail);
  if (leaving) return null;

  const loading = id > 0 && (state.status === 'idle' || state.status === 'loading');
  return (
    <div className="route-status">
      {loading ? (
        <StatusMessage kind="loading" title="Membuka film…" />
      ) : (
        <StatusMessage kind="error" title="Film tidak ditemukan">
          <p>{state.status === 'error' ? state.message : 'Film ini tidak tersedia. Mungkin tautannya sudah tidak berlaku.'}</p>
          <BackButton variant="dark" label="Kembali ke arsip" hint="Ke beranda" onClick={onClose} />
        </StatusMessage>
      )}
    </div>
  );
}
