import { useId, useState } from 'react';
import { useT } from '../i18n';
import { useSeason } from '../hooks/useSeason';
import { imageUrl } from '../services/tmdb';
import type { TvSeason } from '../types/tmdb';
import { formatDate, formatRuntime } from '../utils/format';
import { defaultSeason } from '../utils/seasons';
import { episodeCredits, hasEpisodeCredits, type Person } from '../utils/episodes';
import { navigate, personPath } from '../hooks/useRoute';

function People({ label, people }: { label: string; people: Person[] }) {
  const t = useT();
  if (people.length === 0) return null;
  return (
    <p className="ss-credit">
      <span className="dim">{label}: </span>
      {people.map((p, i) => (
        <span key={p.id}>
          {i > 0 && ', '}
          <button type="button" className="kw-btn" onClick={() => navigate(personPath(p.id))} aria-label={t('detail.openPerson', { name: p.name })}>
            {p.name}
          </button>
        </span>
      ))}
    </p>
  );
}

/** Daftar musim dan episode serial TV; episode dimuat saat musim dipilih. `id` = id ber-offset. */
export default function SeasonsPanel({ id, seasons }: { id: number; seasons: TvSeason[] }) {
  const t = useT();
  const selectId = useId();
  const [number, setNumber] = useState(() => defaultSeason(seasons));
  const state = useSeason(id, number);
  if (seasons.length === 0) return null;
  const current = seasons.find((s) => s.season_number === number);

  return (
    <section className="ss" aria-labelledby="st-ss-h">
      <h3 id="st-ss-h" className="tag">
        {t('more.seasons')}
      </h3>
      <label htmlFor={selectId} className="dim tr-label">
        {t('more.seasonsCount', { count: seasons.length })}
      </label>
      <select id={selectId} className="tr-select" value={number} onChange={(e) => setNumber(Number(e.target.value))}>
        {seasons.map((s) => (
          <option key={s.id} value={s.season_number}>
            {s.name} ({t('more.episodeCount', { count: s.episode_count })})
          </option>
        ))}
      </select>
      {current?.overview && <p className="dim ss-overview">{current.overview}</p>}

      <div aria-live="polite">
        {state.status === 'loading' && <p className="dim">{t('more.loadingEpisodes')}</p>}
        {state.status === 'error' && <p className="dim">{state.message}</p>}
        {state.status === 'success' &&
          (state.season.episodes.length === 0 ? (
            <p className="dim">{t('more.noEpisodes')}</p>
          ) : (
            <ol className="ss-list">
              {state.season.episodes.map((e) => {
                const still = imageUrl(e.still_path ?? null, 'backdrop', 'w300');
                const credits = episodeCredits(e);
                const meta = [formatDate(e.air_date ?? undefined), e.runtime ? formatRuntime(e.runtime) : ''].filter(Boolean).join(' · ');
                return (
                  <li key={e.id} className="ss-ep">
                    {still ? <img src={still} alt="" loading="lazy" width={160} height={90} /> : <span className="ss-ph" aria-hidden="true" />}
                    <div className="ss-body">
                      <p className="ss-name">
                        <span className="dim">{e.episode_number}.</span> {e.name}
                      </p>
                      {meta && <p className="dim ss-meta">{meta}</p>}
                      {(e.overview || hasEpisodeCredits(credits)) && (
                        <details>
                          <summary>{t('more.episodeDetails')}</summary>
                          {e.overview && <p>{e.overview}</p>}
                          <People label={t('crew.director')} people={credits.directors} />
                          <People label={t('crew.writing')} people={credits.writers} />
                          <People label={t('more.guestStars')} people={credits.guests} />
                        </details>
                      )}
                    </div>
                    {e.vote_average > 0 && (
                      <span className="ss-rate">
                        <span aria-hidden="true">★</span> {e.vote_average.toFixed(1)}
                        <span className="sr-only">{t('common.outOf10')}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          ))}
      </div>
    </section>
  );
}
