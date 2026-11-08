import { useT } from '../i18n';
import type { AlternativeTitle } from '../types/tmdb';
import { regionName } from '../utils/format';
import { uniqueTitles } from '../utils/titles';

/** Judul alternatif film di berbagai negara (TMDB), maksimal 12 yang berbeda. */
export default function AlternativeTitles({ titles, current }: { titles: AlternativeTitle[]; current: string }) {
  const t = useT();
  const list = uniqueTitles(titles, current, 12);
  if (list.length === 0) return null;
  return (
    <section className="kw" aria-labelledby="st-alt-h">
      <h3 id="st-alt-h" className="tag">
        {t('more.altTitles')}
      </h3>
      <ul className="st-chips kw-list">
        {list.map((a) => (
          <li key={`${a.iso_3166_1}-${a.title}`} className="st-chip">
            {a.title}
            {a.iso_3166_1 && <span className="dim"> · {regionName(a.iso_3166_1)}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
