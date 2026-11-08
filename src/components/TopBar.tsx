import { forwardRef } from 'react';
import { LANGUAGES, setLanguage, useLanguage } from '../services/language';
import { useT } from '../i18n';
import { CATEGORIES } from '../services/tmdb';
import type { Category, Genre } from '../types/tmdb';

interface Props {
  category: Category;
  query: string;
  searching: boolean;
  searchActive: boolean;
  genre: number | null;
  genres: Genre[];
  onGenre: (g: number | null) => void;
  onCategory: (c: Category) => void;
  onQuery: (q: string) => void;
  onHome: () => void;
  /** jumlah item pada daftar lokal, ditampilkan sebagai lencana di tab Favorit/Watchlist */
  counts: { favorites: number; watchlist: number };
}

const TopBar = forwardRef<HTMLElement, Props>(function TopBar(
  { category, query, searching, searchActive, genre, genres, onGenre, onCategory, onQuery, onHome, counts },
  ref,
) {
  const language = useLanguage();
  const t = useT();
  return (
    <header className="topbar" ref={ref}>
      <button type="button" className="brand" onClick={onHome} aria-label={t('top.brandLabel')}>
        arsip<span className="brand-dim">/sinema</span>
      </button>

      <nav className="cats" aria-label={t('top.categories')}>
        <ul>
          {CATEGORIES.map((c) => {
            const active = !searchActive && genre === null && c === category;
            return (
              <li key={c}>
                <button
                  type="button"
                  className={`pill${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onCategory(c)}
                >
                  {t(`cat.${c}`)}
                  {(c === 'favorites' || c === 'watchlist') && counts[c] > 0 && (
                    <span className="pill-count" aria-label={t('top.countLabel', { count: counts[c] })}>
                      {counts[c]}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="tb-right">
        {genres.length > 0 && (
          <label className="lang genre">
            <span className="sr-only">{t('top.genre')}</span>
            <select value={genre ?? ''} onChange={(e) => onGenre(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t('top.genreAll')}</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="q" className="sr-only">
            {t('top.searchLabel')}
          </label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t('top.searchPlaceholder')}
            autoComplete="off"
            spellCheck={false}
          />
          <span className={`spinner${searching ? ' on' : ''}`} role="status" aria-label={searching ? t('top.searching') : undefined} />
        </form>

        <label className="lang">
          <span className="sr-only">{t('top.language')}</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
});

export default TopBar;
