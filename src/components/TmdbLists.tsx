import { useT } from '../i18n';
import type { TmdbList } from '../types/tmdb';

/** Daftar publik TMDB yang memuat film ini (maksimal 8 terbesar); tautan membuka daftar di TMDB. */
export default function TmdbLists({ lists }: { lists: TmdbList[] }) {
  const t = useT();
  const top = [...lists].sort((a, b) => b.item_count - a.item_count).slice(0, 8);
  if (top.length === 0) return null;
  return (
    <section className="kw" aria-labelledby="st-lists-h">
      <h3 id="st-lists-h" className="tag">
        {t('more.lists')}
      </h3>
      <ul className="tl-list">
        {top.map((l) => (
          <li key={l.id}>
            <a href={`https://www.themoviedb.org/list/${l.id}`} target="_blank" rel="noopener noreferrer">
              {l.name}
              <span className="sr-only">{t('common.newTab')}</span>
            </a>
            <span className="dim"> · {t('more.listCount', { count: l.item_count })}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
