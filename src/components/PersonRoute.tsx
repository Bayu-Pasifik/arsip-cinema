import { useEffect } from 'react';
import { useT } from '../i18n';
import { browsePath, navigate } from '../hooks/useRoute';
import { NO_FILTERS } from '../utils/filters';
import { useLanguage } from '../services/language';
import { usePersonDetail } from '../hooks/usePersonDetail';
import { imageUrl, releaseYear } from '../services/tmdb';
import { formatDate } from '../utils/format';
import { crewFilms, filmography } from '../utils/person';
import type { CreditMovie } from '../types/tmdb';
import BackButton from './BackButton';
import StatusMessage from './StatusMessage';

interface Props {
  id: number;
  onClose: () => void;
  onOpenMovie: (id: number) => void;
}

interface GridProps {
  films: CreditMovie[];
  label: string;
  role: 'character' | 'job';
  onOpenMovie: (id: number) => void;
}

function FilmGrid({ films, label, role, onOpenMovie }: GridProps) {
  const t = useT();
  if (films.length === 0) return null;
  return (
    <section className="pr-section" aria-label={label}>
      <h2 className="tag">{label}</h2>
      <ul className="pr-grid">
        {films.map((f) => {
          const src = imageUrl(f.poster_path, 'poster', 'w185');
          const sub = role === 'character' ? f.character : f.job;
          return (
            <li key={f.id}>
              <button type="button" className="pr-film" onClick={() => onOpenMovie(f.id)} aria-label={t('person.openMovie', { title: f.title })}>
                {src && <img src={src} alt="" loading="lazy" width={185} height={278} />}
                <span className="pr-film-title">{f.title}</span>
                <span className="pr-film-sub">
                  {releaseYear(f.release_date)}
                  {sub ? ` · ${sub}` : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Halaman profil aktor/kru untuk rute /person/:id: foto, biografi, dan filmografi yang membuka detail film. */
export default function PersonRoute({ id, onClose, onOpenMovie }: Props) {
  const t = useT();
  const language = useLanguage();
  const state = usePersonDetail(id);
  const name = state.status === 'success' ? state.person.name : null;

  useEffect(() => {
    if (name) document.title = `${name} — ${t('person.titleSuffix')}`;
  }, [name, t]);

  if (state.status !== 'success') {
    return (
      <div className="route-status">
        {state.status === 'loading' ? (
          <StatusMessage kind="loading" title={t('person.loading')} />
        ) : (
          <StatusMessage kind="error" title={t('person.notFound')}>
            <p>{state.message}</p>
            <BackButton variant="dark" label={t('common.backToArchive')} hint={t('common.backToHome')} onClick={onClose} />
          </StatusMessage>
        )}
      </div>
    );
  }

  const p = state.person;
  const photo = imageUrl(p.profile_path, 'profile', 'h632');
  const acted = filmography(p.movie_credits?.cast);
  const directed = crewFilms(p.movie_credits?.crew, ['Director']);
  const facts: [string, string][] = [];
  if (p.known_for_department) facts.push([t('person.department'), p.known_for_department]);
  if (p.birthday) facts.push([t('person.born'), formatDate(p.birthday)]);
  if (p.deathday) facts.push([t('person.died'), formatDate(p.deathday)]);
  if (p.place_of_birth) facts.push([t('person.from'), p.place_of_birth]);
  const imdb = p.external_ids?.imdb_id;

  return (
    <div className="person" lang={language.split('-')[0]}>
      <div className="person-inner">
        <BackButton onClick={onClose} label={t('common.back')} hint={t('common.backHint')} />
        <header className="pr-head">
          {photo ? (
            <img className="pr-photo" src={photo} alt={t('detail.photoAlt', { name: p.name })} width={300} height={450} />
          ) : (
            <span className="pr-photo pr-photo-ph" aria-hidden="true">
              {p.name.slice(0, 1)}
            </span>
          )}
          <div className="pr-info">
            <h1 className="pr-name">{p.name}</h1>
            {facts.length > 0 && (
              <dl className="st-meta">
                {facts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="pr-bio">
              {p.biography ? (
                <>
                  {p.biographyFallback && <p className="dim">{t('person.bioFallback')}</p>}
                  {p.biography.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </>
              ) : (
                <p className="dim">{t('person.noBio')}</p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary pr-all"
              onClick={() => navigate(browsePath('trending', '', { ...NO_FILTERS, cast: p.id }))}
            >
              {t('person.allFilms', { name: p.name })}
            </button>
            <p className="pr-links">
              {imdb && (
                <a href={`https://www.imdb.com/name/${imdb}`} target="_blank" rel="noopener noreferrer">
                  IMDb<span className="sr-only">{t('common.newTab')}</span>
                </a>
              )}
              <a href={`https://www.themoviedb.org/person/${p.id}`} target="_blank" rel="noopener noreferrer">
                TMDB<span className="sr-only">{t('common.newTab')}</span>
              </a>
            </p>
          </div>
        </header>
        <FilmGrid films={acted} label={t('person.acting')} role="character" onOpenMovie={onOpenMovie} />
        <FilmGrid films={directed} label={t('person.directing')} role="job" onOpenMovie={onOpenMovie} />
      </div>
    </div>
  );
}
