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
}

/**
 * Menyediakan data film untuk rute /movie/:id. Bila film ada di daftar yang sedang dimuat, dipakai langsung;
 * bila tidak (tautan langsung / refresh), data diambil dari TMDB.
 */
export default function MovieRoute({ id, movies, reduced, onClose }: Props) {
  // Ingat film terakhir yang ditemukan: bila film keluar dari daftar (mis. dihapus dari Favorit saat detail terbuka)
  // halaman detail tidak boleh dimuat ulang/berkedip.
  const cache = useRef<Movie | null>(null);
  const inList = movies.find((m) => m.id === id) ?? null;
  if (inList) cache.current = inList;
  const found = inList ?? (cache.current?.id === id ? cache.current : null);
  const state = useMovieDetail(found ? null : id);

  if (found) return <MovieStory key={found.id} movie={found} reduced={reduced} onClose={onClose} />;
  if (state.status === 'success') {
    return <MovieStory key={state.detail.id} movie={state.detail} reduced={reduced} onClose={onClose} />;
  }

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
