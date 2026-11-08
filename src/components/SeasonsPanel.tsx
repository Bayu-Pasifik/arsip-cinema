import { useId, useState } from 'react';
import { useT } from '../i18n';
import { useEpisodeGroup, useEpisodeGroups } from '../hooks/useEpisodeGroups';
import { useSeason } from '../hooks/useSeason';
import { navigate, personPath } from '../hooks/useRoute';
import { imageUrl } from '../services/tmdb';
import type { Episode, ImageInfo, TvSeason } from '../types/tmdb';
import { formatDate, formatRuntime } from '../utils/format';
import { episodeCredits, hasEpisodeCredits, type Person } from '../utils/episodes';
import { defaultSeason } from '../utils/seasons';

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

/** Daftar episode; `withSeason` menambah penanda S{musim}E{episode} (untuk urutan alternatif yang melintasi musim). */
function EpisodeList({ episodes, withSeason = false }: { episodes: Episode[]; withSeason?: boolean }) {
  const t = useT();
  return (
    <ol className="ss-list">
      {episodes.map((e) => {
        const still = imageUrl(e.still_path ?? null, 'backdrop', 'w300');
        const credits = episodeCredits(e);
        const meta = [formatDate(e.air_date ?? undefined), e.runtime ? formatRuntime(e.runtime) : ''].filter(Boolean).join(' · ');
        return (
          <li key={`${e.id}-${e.season_number ?? ''}`} className="ss-ep">
            {still ? <img src={still} alt="" loading="lazy" width={160} height={90} /> : <span className="ss-ph" aria-hidden="true" />}
            <div className="ss-body">
              <p className="ss-name">
                <span className="dim">{withSeason && e.season_number !== undefined ? `S${e.season_number}E${e.episode_number}` : `${e.episode_number}.`}</span> {e.name}
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
  );
}

/** Pemeran musim (maksimal 10, bisa diklik) dan deretan poster musim; keduanya dari respons musim. */
function SeasonExtras({ cast, posters }: { cast: Person[]; posters: ImageInfo[] }) {
  const t = useT();
  const shown = [...posters].sort((a, b) => b.vote_average - a.vote_average).slice(0, 6);
  return (
    <>
      <People label={t('more.seasonCast')} people={cast} />
      {shown.length > 1 && (
        <ul className="filter-posters ss-posters">
          {shown.map((p) => {
            const thumb = imageUrl(p.file_path, 'poster', 'w92');
            const full = imageUrl(p.file_path, 'poster', 'original');
            if (!thumb || !full) return null;
            return (
              <li key={p.file_path}>
                <a href={full} target="_blank" rel="noopener noreferrer">
                  <img src={thumb} alt="" loading="lazy" width={46} height={69} />
                  <span className="sr-only">{t('common.newTab')}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Episode satu urutan alternatif (episode group), dikelompokkan menurut bagian di dalamnya. */
function GroupView({ groupId }: { groupId: string }) {
  const t = useT();
  const state = useEpisodeGroup(groupId);
  if (state.status === 'loading') return <p className="dim">{t('more.loadingEpisodes')}</p>;
  if (state.status === 'error') return <p className="dim">{state.message}</p>;
  const parts = state.group.groups.filter((g) => g.episodes.length > 0).sort((a, b) => a.order - b.order);
  if (parts.length === 0) return <p className="dim">{t('more.noEpisodes')}</p>;
  return (
    <>
      {state.group.description && <p className="dim ss-overview">{state.group.description}</p>}
      {parts.map((g) => (
        <div key={g.id} className="ss-part">
          <h4 className="wp-label">{g.name}</h4>
          <EpisodeList episodes={g.episodes} withSeason />
        </div>
      ))}
    </>
  );
}

/** Daftar musim dan episode serial TV; episode dimuat saat musim dipilih. `id` = id ber-offset. */
export default function SeasonsPanel({ id, seasons }: { id: number; seasons: TvSeason[] }) {
  const t = useT();
  const selectId = useId();
  const groupSelectId = useId();
  const [number, setNumber] = useState(() => defaultSeason(seasons));
  const [groupId, setGroupId] = useState('');
  const state = useSeason(id, number);
  const groups = useEpisodeGroups(id);
  if (seasons.length === 0) return null;
  const current = seasons.find((s) => s.season_number === number);

  return (
    <section className="ss" aria-labelledby="st-ss-h">
      <h3 id="st-ss-h" className="tag">
        {t('more.seasons')}
      </h3>

      {groups.length > 0 && (
        <div className="ss-order">
          <label htmlFor={groupSelectId} className="dim tr-label">
            {t('more.episodeOrder')}
          </label>
          <select id={groupSelectId} className="tr-select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">{t('more.orderBroadcast')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({t('more.episodeCount', { count: g.episode_count })})
              </option>
            ))}
          </select>
        </div>
      )}

      {groupId ? (
        <div aria-live="polite">
          <GroupView groupId={groupId} />
        </div>
      ) : (
        <>
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
          {state.status === 'success' && (
            <SeasonExtras cast={(state.season.credits?.cast ?? []).slice(0, 10).map((c) => ({ id: c.id, name: c.name }))} posters={state.season.images?.posters ?? []} />
          )}

          <div aria-live="polite">
            {state.status === 'loading' && <p className="dim">{t('more.loadingEpisodes')}</p>}
            {state.status === 'error' && <p className="dim">{state.message}</p>}
            {state.status === 'success' &&
              (state.season.episodes.length === 0 ? <p className="dim">{t('more.noEpisodes')}</p> : <EpisodeList episodes={state.season.episodes} />)}
          </div>
        </>
      )}
    </section>
  );
}
