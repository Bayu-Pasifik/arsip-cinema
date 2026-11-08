import { useT } from '../i18n';
import { browsePath, navigate } from '../hooks/useRoute';
import { NO_FILTERS } from '../utils/filters';

interface Network {
  id: number;
  name: string;
}

/** Jaringan/penyiar serial TV; klik = jelajahi serial dari jaringan itu. */
export default function NetworkChips({ networks }: { networks: Network[] }) {
  const t = useT();
  if (networks.length === 0) return null;
  return (
    <section className="kw" aria-labelledby="st-net-h">
      <h3 id="st-net-h" className="tag">
        {t('more.networks')}
      </h3>
      <ul className="st-chips kw-list">
        {networks.slice(0, 8).map((n) => (
          <li key={n.id} className="st-chip">
            <button
              type="button"
              className="kw-btn"
              onClick={() => navigate(browsePath('tv_trending', '', { ...NO_FILTERS, network: n.id }))}
              aria-label={t('more.networkBrowse', { name: n.name })}
            >
              {n.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
