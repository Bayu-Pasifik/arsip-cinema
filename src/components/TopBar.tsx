import { forwardRef } from 'react';
import { CATEGORY_LABEL } from '../services/tmdb';
import type { Category } from '../types/tmdb';

interface Props {
  category: Category;
  query: string;
  searching: boolean;
  searchActive: boolean;
  onCategory: (c: Category) => void;
  onQuery: (q: string) => void;
  onHome: () => void;
  /** jumlah item pada daftar lokal, ditampilkan sebagai lencana di tab Favorit/Watchlist */
  counts: { favorites: number; watchlist: number };
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

const TopBar = forwardRef<HTMLElement, Props>(function TopBar(
  { category, query, searching, searchActive, onCategory, onQuery, onHome, counts },
  ref,
) {
  return (
    <header className="topbar" ref={ref}>
      <button type="button" className="brand" onClick={onHome} aria-label="Arsip Sinema — kembali ke pembuka">
        arsip<span className="brand-dim">/sinema</span>
      </button>

      <nav className="cats" aria-label="Kategori film">
        <ul>
          {CATEGORIES.map((c) => {
            const active = !searchActive && c === category;
            return (
              <li key={c}>
                <button
                  type="button"
                  className={`pill${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onCategory(c)}
                >
                  {CATEGORY_LABEL[c]}
                  {(c === 'favorites' || c === 'watchlist') && counts[c] > 0 && (
                    <span className="pill-count" aria-label={`${counts[c]} film`}>
                      {counts[c]}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q" className="sr-only">
          Cari film
        </label>
        <input
          id="q"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Cari judul film…"
          autoComplete="off"
          spellCheck={false}
        />
        <span className={`spinner${searching ? ' on' : ''}`} role="status" aria-label={searching ? 'Mencari' : undefined} />
      </form>
    </header>
  );
});

export default TopBar;
