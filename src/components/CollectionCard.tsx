import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { useCollection } from '../hooks/useCollectionName';
import { fetchCollectionImages, hasApiKey, imageUrl } from '../services/tmdb';
import type { ImageInfo } from '../types/tmdb';
import { excerpt } from '../utils/format';

const cache = new Map<number, ImageInfo[]>();

/** Poster terbaik koleksi (maksimal 6) dari /collection/{id}/images. */
function usePosters(id: number): ImageInfo[] {
  const [posters, setPosters] = useState<ImageInfo[]>(cache.get(id) ?? []);
  useEffect(() => {
    const hit = cache.get(id);
    if (hit) {
      setPosters(hit);
      return;
    }
    setPosters([]);
    if (!hasApiKey) return;
    const c = new AbortController();
    fetchCollectionImages(id, c.signal)
      .then((imgs) => {
        const best = [...imgs.posters].sort((a, b) => b.vote_average - a.vote_average).slice(0, 6);
        cache.set(id, best);
        if (!c.signal.aborted) setPosters(best);
      })
      .catch(() => {
        /* galeri opsional */
      });
    return () => c.abort();
  }, [id]);
  return posters;
}

/** Kartu info koleksi di panel filter: poster, sinopsis ringkas, jumlah film, dan deretan poster. */
export default function CollectionCard({ id, onRemove }: { id: number; onRemove: () => void }) {
  const t = useT();
  const collection = useCollection(id);
  const posters = usePosters(id);
  const poster = imageUrl(collection?.poster_path ?? null, 'poster', 'w92');
  const overview = collection?.overview ? excerpt(collection.overview, 180).text : '';

  return (
    <div className="filter-co">
      <div className="filter-kw">
        <span>{t('filter.collection', { name: collection?.name ?? `#${id}` })}</span>
        <button type="button" className="filter-x" onClick={onRemove} aria-label={t('filter.removeCollection')}>
          ×
        </button>
      </div>
      {collection && (
        <div className="filter-co-info">
          {poster && <img src={poster} alt="" width={46} height={69} className="filter-co-poster" />}
          <p className="dim">
            {t('more.listCount', { count: collection.parts.length })}
            {overview && ` · ${overview}`}
          </p>
        </div>
      )}
      {posters.length > 1 && (
        <ul className="filter-posters">
          {posters.map((p) => {
            const thumb = imageUrl(p.file_path, 'poster', 'w92');
            const full = imageUrl(p.file_path, 'poster', 'original');
            if (!thumb || !full) return null;
            return (
              <li key={p.file_path}>
                <a href={full} target="_blank" rel="noopener noreferrer">
                  <img src={thumb} alt="" loading="lazy" width={46} height={69} />
                  <span className="sr-only">{t('common.newTab')}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
