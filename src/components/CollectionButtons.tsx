import { useState } from 'react';
import { useT } from '../i18n';
import { isIn, toggleCollection, useCollections } from '../services/collections';
import type { CollectionKey, Movie } from '../types/tmdb';

interface Props {
  movie: Movie;
  className?: string;
}

const ICONS: Record<CollectionKey, [string, string]> = { favorites: ['♡', '♥'], watchlist: ['＋', '✓'] };
const KEYS = Object.keys(ICONS) as CollectionKey[];

/** Tombol toggle Favorit & Watchlist untuk satu film (tersimpan lokal). Film demo tidak dapat disimpan. */
export default function CollectionButtons({ movie, className = '' }: Props) {
  const t = useT();
  const collections = useCollections();
  const [announce, setAnnounce] = useState('');

  if (movie.demo) return null;

  const onToggle = (key: CollectionKey) => {
    const nowIn = toggleCollection(key, movie);
    setAnnounce(`${movie.title}: ${t(nowIn ? `collect.${key}Off` : `collect.${key}On`)}`);
  };

  return (
    <div className={`collect ${className}`.trim()} role="group" aria-label={t('collect.save', { title: movie.title })}>
      {KEYS.map((key) => {
        const active = isIn(collections, key, movie.id);
        return (
          <button
            key={key}
            type="button"
            className={`btn btn-collect${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(key)}
          >
            <span aria-hidden="true">{ICONS[key][active ? 1 : 0]}</span> {t(`collect.${key}`)}
          </button>
        );
      })}
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
