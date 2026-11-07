import { useState } from 'react';
import { isIn, toggleCollection, useCollections } from '../services/collections';
import type { CollectionKey, Movie } from '../types/tmdb';

interface Props {
  movie: Movie;
  className?: string;
}

const META: Record<CollectionKey, { label: string; on: string; off: string; icon: [string, string] }> = {
  favorites: { label: 'Favorit', on: 'Dihapus dari Favorit', off: 'Ditambahkan ke Favorit', icon: ['♡', '♥'] },
  watchlist: { label: 'Watchlist', on: 'Dihapus dari Watchlist', off: 'Ditambahkan ke Watchlist', icon: ['＋', '✓'] },
};

/** Tombol toggle Favorit & Watchlist untuk satu film (tersimpan lokal). Film demo tidak dapat disimpan. */
export default function CollectionButtons({ movie, className = '' }: Props) {
  const collections = useCollections();
  const [announce, setAnnounce] = useState('');

  if (movie.demo) return null;

  const onToggle = (key: CollectionKey) => {
    const nowIn = toggleCollection(key, movie);
    setAnnounce(`${movie.title}: ${nowIn ? META[key].off : META[key].on}`);
  };

  return (
    <div className={`collect ${className}`.trim()} role="group" aria-label={`Simpan ${movie.title}`}>
      {(Object.keys(META) as CollectionKey[]).map((key) => {
        const active = isIn(collections, key, movie.id);
        return (
          <button
            key={key}
            type="button"
            className={`btn btn-collect${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(key)}
          >
            <span aria-hidden="true">{META[key].icon[active ? 1 : 0]}</span> {META[key].label}
          </button>
        );
      })}
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
