import { imageUrl } from '../services/tmdb';
import type { WatchProvider, WatchRegion } from '../types/tmdb';

/** Negara yang ditampilkan (kode ISO 3166-1). */
export const WATCH_REGION = 'ID';

const GROUPS: { key: 'flatrate' | 'free' | 'ads' | 'rent' | 'buy'; label: string }[] = [
  { key: 'flatrate', label: 'Streaming' },
  { key: 'free', label: 'Gratis' },
  { key: 'ads', label: 'Gratis dengan iklan' },
  { key: 'rent', label: 'Sewa' },
  { key: 'buy', label: 'Beli' },
];

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
  const groups = GROUPS.map((g) => ({ ...g, list: region?.[g.key] ?? [] })).filter((g) => g.list.length > 0);
  return (
    <section className="wp" aria-labelledby="st-wp-h">
      <h3 id="st-wp-h" className="tag">
        Tonton di mana (Indonesia)
      </h3>
      {groups.length === 0 ? (
        <p className="dim wp-empty">Belum ada data penyedia untuk Indonesia.</p>
      ) : (
        <div className="wp-groups">
          {groups.map((g) => (
            <div key={g.key} className="wp-group">
              <h4 className="wp-label">{g.label}</h4>
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
        Data penyedia oleh{' '}
        <a href={region?.link ?? 'https://www.justwatch.com'} target="_blank" rel="noopener noreferrer">
          JustWatch<span className="sr-only"> (tab baru)</span>
        </a>
        .
      </p>
    </section>
  );
}
