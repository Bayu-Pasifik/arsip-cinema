import { useT } from '../i18n';
import { browsePath, navigate } from '../hooks/useRoute';
import { NO_FILTERS } from '../utils/filters';

interface Company {
  id: number;
  name: string;
}

/** Studio/perusahaan produksi film; klik = jelajahi film dari studio itu. */
export default function CompanyChips({ companies }: { companies: Company[] }) {
  const t = useT();
  if (companies.length === 0) return null;
  return (
    <section className="kw" aria-labelledby="st-co-h">
      <h3 id="st-co-h" className="tag">
        {t('more.studios')}
      </h3>
      <ul className="st-chips kw-list">
        {companies.slice(0, 10).map((c) => (
          <li key={c.id} className="st-chip">
            <button
              type="button"
              className="kw-btn"
              onClick={() => navigate(browsePath('trending', '', { ...NO_FILTERS, company: c.id }))}
              aria-label={t('more.studioBrowse', { name: c.name })}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
