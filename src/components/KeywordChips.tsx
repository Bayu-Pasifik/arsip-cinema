import { useT } from '../i18n';
import { browsePath, navigate } from '../hooks/useRoute';
import type { Keyword } from '../types/tmdb';
import { NO_FILTERS } from '../utils/filters';

/** Kata kunci/tema film dari TMDB (bahasa Inggris), maksimal 20. Klik = jelajahi film dengan kata kunci itu. */
export default function KeywordChips({ keywords }: { keywords: Keyword[] }) {
  const t = useT();
  if (keywords.length === 0) return null;
  return (
    <section className="kw" aria-labelledby="st-kw-h">
      <h3 id="st-kw-h" className="tag">
        {t('more.keywords')}
      </h3>
      <ul className="st-chips kw-list" lang="en">
        {keywords.slice(0, 20).map((k) => (
          <li key={k.id} className="st-chip">
            <button
              type="button"
              className="kw-btn"
              onClick={() => navigate(browsePath('trending', '', { ...NO_FILTERS, keyword: k.id }))}
              aria-label={t('more.keywordBrowse', { name: k.name })}
            >
              {k.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
