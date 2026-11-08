import { useT } from '../i18n';
import { useLanguage } from '../services/language';
import { useRegion } from '../services/region';
import type { MovieDetail } from '../types/tmdb';
import { formatDate, regionName } from '../utils/format';
import { releaseRows } from '../utils/rollout';

const TYPES = [1, 2, 3, 4, 5, 6] as const;

/** Tanggal rilis dan klasifikasi usia di setiap negara (film: release_dates; serial: content_ratings). Terlipat secara bawaan. */
export default function ReleaseInfo({ detail }: { detail: MovieDetail }) {
  const t = useT();
  const language = useLanguage();
  const region = useRegion();
  const rows = releaseRows(detail.release_dates?.results, region, regionName, language);
  if (rows.length === 0) return null;
  return (
    <section className="ri" aria-labelledby="st-ri-h">
      <h3 id="st-ri-h" className="tag">
        {t('more.releases')}
      </h3>
      <details>
        <summary>{t('more.releasesCount', { count: rows.length })}</summary>
        <ul className="ri-list">
          {rows.map((r) => (
            <li key={r.code} className="ri-row">
              <span className="ri-country">{regionName(r.code)}</span>
              <span className="ri-certs">
                {r.certs.map((c) => (
                  <span key={c} className="st-chip">
                    {c}
                  </span>
                ))}
              </span>
              <span className="dim ri-dates">
                {r.dates
                  .filter((d) => (TYPES as readonly number[]).includes(d.type))
                  .map((d) => `${t(`release.type.${d.type as (typeof TYPES)[number]}`)} ${formatDate(d.date)}`)
                  .join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
