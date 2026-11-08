import { forwardRef, useEffect, useRef, useState } from 'react';
import { setLanguage, useLanguage } from '../services/language';
import { useLanguages } from '../hooks/useLanguages';
import { useT } from '../i18n';
import { useKeywordName } from '../hooks/useKeywordName';
import { useCompanyName } from '../hooks/useCompanyName';
import { usePersonName } from '../hooks/usePersonName';
import { useCertifications } from '../hooks/useCertifications';
import KeywordSearch from './KeywordSearch';
import { useCollectionName } from '../hooks/useCollectionName';
import { usePeopleSearch } from '../hooks/usePeopleSearch';
import { useCollectionSearch } from '../hooks/useCollectionSearch';
import { navigate, PEOPLE_PATH, personPath } from '../hooks/useRoute';
import { CATEGORIES, imageUrl } from '../services/tmdb';
import { setRegion, useRegion } from '../services/region';
import { useProviders, useWatchRegions } from '../hooks/useWatchProviders';
import { regionName } from '../utils/format';
import { regionLabel, sortRegions } from '../utils/regions';
import { useCountries } from '../hooks/useCountries';
import type { Category, Genre } from '../types/tmdb';
import { filterCount, hasFilters, NO_FILTERS, RATINGS, SORTS, type Filters, type SortKey } from '../utils/filters';

interface Props {
  category: Category;
  query: string;
  searching: boolean;
  searchActive: boolean;
  /** teks pencarian yang sudah di-debounce (kosong bila belum aktif) */
  searchTerm: string;
  filters: Filters;
  genres: Genre[];
  onFilters: (f: Filters) => void;
  onCategory: (c: Category) => void;
  onQuery: (q: string) => void;
  onHome: () => void;
  /** jumlah item pada daftar lokal, ditampilkan sebagai lencana di tab Favorit/Watchlist */
  counts: { favorites: number; watchlist: number };
}

const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: thisYear + 1 - 1929 }, (_, i) => thisYear + 1 - i);

const TopBar = forwardRef<HTMLElement, Props>(function TopBar(
  { category, query, searching, searchActive, searchTerm, filters, genres, onFilters, onCategory, onQuery, onHome, counts },
  ref,
) {
  const language = useLanguage();
  const languages = useLanguages();
  const t = useT();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const keywordName = useKeywordName(filters.keyword);
  const region = useRegion();
  const regions = useWatchRegions();
  const countries = useCountries();
  const regionText = (code: string) => regionLabel(code, regionName(code), countries);
  const providers = useProviders(region);
  const certs = useCertifications(region);
  const collectionName = useCollectionName(filters.collection);
  const companyName = useCompanyName(filters.company);
  const castName = usePersonName(filters.cast);
  const people = usePeopleSearch(searchTerm);
  const collections = useCollectionSearch(searchTerm);
  const filtered = hasFilters(filters);
  const count = filterCount(filters);
  const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });

  // panel filter: Escape atau klik di luar menutup
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <header className="topbar" ref={ref}>
      <button type="button" className="brand" onClick={onHome} aria-label={t('top.brandLabel')}>
        arsip<span className="brand-dim">/sinema</span>
      </button>

      <nav className="cats" aria-label={t('top.categories')}>
        <ul>
          {CATEGORIES.map((c) => {
            const active = !searchActive && !filtered && c === category;
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
        <button type="button" className="pill" onClick={() => navigate(PEOPLE_PATH)}>
          {t('people.nav')}
        </button>
        <div className="filter-wrap" ref={panelRef}>
          <button
            type="button"
            className={`pill filter-btn${filtered ? ' is-active' : ''}`}
            aria-expanded={open}
            aria-controls="filter-panel"
            onClick={() => setOpen((o) => !o)}
          >
            {t('filter.button')}
            {count > 0 && (
              <span className="pill-count" aria-label={t('filter.activeCount', { count })}>
                {count}
              </span>
            )}
          </button>
          {open && (
            <div className="filter-panel" id="filter-panel" role="group" aria-label={t('filter.panel')}>
              {genres.length > 0 && (
                <label>
                  <span>{t('top.genre')}</span>
                  <select value={filters.genre ?? ''} onChange={(e) => set({ genre: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">{t('top.genreAll')}</option>
                    {genres.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <span>{t('filter.year')}</span>
                <select value={filters.year ?? ''} onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">{t('filter.yearAny')}</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('filter.rating')}</span>
                <select value={filters.rating ?? ''} onChange={(e) => set({ rating: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">{t('filter.ratingAny')}</option>
                  {RATINGS.map((r) => (
                    <option key={r} value={r}>
                      ★ {r}+
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('filter.sort')}</span>
                <select value={filters.sort ?? ''} onChange={(e) => set({ sort: (e.target.value || null) as SortKey | null })}>
                  <option value="">{t('sort.popularity.desc')}</option>
                  {SORTS.filter((s) => s !== 'popularity.desc').map((s) => (
                    <option key={s} value={s}>
                      {t(`sort.${s}`)}
                    </option>
                  ))}
                </select>
              </label>
              {(certs.length > 0 || filters.cert !== null) && (
                <label>
                  <span>{t('filter.cert', { country: regionText(region) })}</span>
                  <select value={filters.cert ?? ''} onChange={(e) => set({ cert: e.target.value || null })}>
                    <option value="">{t('filter.certAny')}</option>
                    {(filters.cert !== null && !certs.includes(filters.cert) ? [filters.cert, ...certs] : certs).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {providers.length > 0 && (
                <label>
                  <span>{t('filter.provider')}</span>
                  <select value={filters.provider ?? ''} onChange={(e) => set({ provider: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">{t('filter.providerAny')}</option>
                    {providers.map((p) => (
                      <option key={p.provider_id} value={p.provider_id}>
                        {p.provider_name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {regions.length > 0 && (
                <label>
                  <span>{t('filter.region')}</span>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    {sortRegions(regions.includes(region) ? regions : [region, ...regions], regionText, language).map((r) => (
                      <option key={r} value={r}>
                        {regionText(r)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <KeywordSearch onPick={(id) => set({ keyword: id })} />
              {filters.keyword !== null && (
                <p className="filter-kw">
                  <span lang="en">{t('filter.keyword', { name: keywordName ?? `#${filters.keyword}` })}</span>
                  <button type="button" className="filter-x" onClick={() => set({ keyword: null })} aria-label={t('filter.removeKeyword')}>
                    ×
                  </button>
                </p>
              )}
              {filters.cast !== null && (
                <p className="filter-kw">
                  <span>{t('filter.cast', { name: castName ?? `#${filters.cast}` })}</span>
                  <button type="button" className="filter-x" onClick={() => set({ cast: null })} aria-label={t('filter.removeCast')}>
                    ×
                  </button>
                </p>
              )}
              {filters.company !== null && (
                <p className="filter-kw">
                  <span>{t('filter.company', { name: companyName ?? `#${filters.company}` })}</span>
                  <button type="button" className="filter-x" onClick={() => set({ company: null })} aria-label={t('filter.removeCompany')}>
                    ×
                  </button>
                </p>
              )}
              {filters.collection !== null && (
                <p className="filter-kw">
                  <span>{t('filter.collection', { name: collectionName ?? `#${filters.collection}` })}</span>
                  <button type="button" className="filter-x" onClick={() => set({ collection: null })} aria-label={t('filter.removeCollection')}>
                    ×
                  </button>
                </p>
              )}
              {filtered && (
                <button type="button" className="btn btn-ghost filter-reset" onClick={() => onFilters(NO_FILTERS)}>
                  {t('filter.reset')}
                </button>
              )}
            </div>
          )}
        </div>

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
          {(people.length > 0 || collections.length > 0) && (
            <ul className="people" aria-label={t('top.people')}>
              {people.map((p) => {
                const src = imageUrl(p.profile_path, 'profile', 'w45');
                return (
                  <li key={p.id}>
                    <button type="button" className="people-item" onClick={() => navigate(personPath(p.id))}>
                      {src ? <img src={src} alt="" width={32} height={32} /> : <span className="people-ph" aria-hidden="true" />}
                      <span className="people-name">{p.name}</span>
                      {p.known_for_department && <span className="people-dept">{p.known_for_department}</span>}
                    </button>
                  </li>
                );
              })}
              {collections.map((c) => {
                const src = imageUrl(c.poster_path, 'poster', 'w92');
                return (
                  <li key={`col-${c.id}`}>
                    <button type="button" className="people-item" onClick={() => onFilters({ ...NO_FILTERS, collection: c.id })}>
                      {src ? <img src={src} alt="" width={32} height={32} /> : <span className="people-ph" aria-hidden="true" />}
                      <span className="people-name">{c.name}</span>
                      <span className="people-dept">{t('cat.collection')}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </form>

        <label className="lang">
          <span className="sr-only">{t('top.language')}</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languages.map((l) => (
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
