import { useT } from '../i18n';
import { imageUrl } from '../services/tmdb';
import { regionName } from '../utils/format';
import type { WatchProvider, WatchRegion } from '../types/tmdb';

/** Negara yang ditampilkan (kode ISO 3166-1). */
export const WATCH_REGION = 'ID';

const GROUPS = ['flatrate', 'free', 'ads', 'rent', 'buy'] as const;

function Provider({ p }: { p: WatchProvider }) {
  const src = imageUrl(p.logo_path, 'logo', 'w92');
  return (
    <li className="wp-item">
      {src ? <img src={src} alt="" loading="lazy" width={46} height={46} /> : <span className="wp-ph" aria-hidden="true" />}
      <span className="wp-name">{p.provider_name}</span>
    </li>
  );
}

/**
 * "Tonton di mana": penyedia streaming/sewa/beli untuk Indonesia. Data penyedia berasal dari JustWatch (TMDB
 * mewajibkan atribusi). Tautan mengarah ke halaman penyedia di TMDB, bukan langsung ke layanan.
 */
export default function WatchProviders({ region }: { region: WatchRegion | undefined }) {
  const t = useT();
  const country = regionName(WATCH_REGION);
  const groups = GROUPS.map((key) => ({ key, list: region?.[key] ?? [] })).filter((g) => g.list.length > 0);
  return (
    <section className="wp" aria-labelledby="st-wp-h">
      <h3 id="st-wp-h" className="tag">
        {t('more.watch', { country })}
      </h3>
      {groups.length === 0 ? (
        <p className="dim wp-empty">{t('more.watchEmpty', { country })}</p>
      ) : (
        <div className="wp-groups">
          {groups.map((g) => (
            <div key={g.key} className="wp-group">
              <h4 className="wp-label">{t(`more.watch.${g.key}`)}</h4>
              <ul className="wp-list">
                {g.list.map((p) => (
                  <Provider key={p.provider_id} p={p} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p className="dim wp-credit">
        {t('more.watchCredit')}{' '}
        <a href={region?.link ?? 'https://www.justwatch.com'} target="_blank" rel="noopener noreferrer">
          JustWatch<span className="sr-only">{t('common.newTab')}</span>
        </a>
        .
      </p>
    </section>
  );
}
