import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { usePeopleList } from '../hooks/usePeopleList';
import { imageUrl, type PeopleKind } from '../services/tmdb';
import BackButton from './BackButton';
import StatusMessage from './StatusMessage';

interface Props {
  onClose: () => void;
  onOpenPerson: (id: number) => void;
}

const KINDS: PeopleKind[] = ['popular', 'trending'];

/** Halaman /people: aktor/kru populer dan trending minggu ini. */
export default function PeopleRoute({ onClose, onOpenPerson }: Props) {
  const t = useT();
  const [kind, setKind] = useState<PeopleKind>('popular');
  const list = usePeopleList(kind);

  useEffect(() => {
    document.title = `${t('people.title')} — ${t('person.titleSuffix')}`;
  }, [t]);

  return (
    <div className="person">
      <div className="person-inner">
        <BackButton onClick={onClose} label={t('common.back')} hint={t('common.backHint')} />
        <h1 className="pr-name pe-title">{t('people.title')}</h1>
        <div className="pe-tabs" role="group" aria-label={t('people.kind')}>
          {KINDS.map((k) => (
            <button key={k} type="button" className={`pill${k === kind ? ' is-active' : ''}`} aria-pressed={k === kind} onClick={() => setKind(k)}>
              {t(`people.${k}`)}
            </button>
          ))}
        </div>

        {list.people.length > 0 && (
          <ul className="pr-grid pe-grid">
            {list.people.map((p) => {
              const src = imageUrl(p.profile_path, 'profile', 'w185');
              return (
                <li key={p.id}>
                  <button type="button" className="pr-film" onClick={() => onOpenPerson(p.id)} aria-label={t('detail.openPerson', { name: p.name })}>
                    {src ? <img src={src} alt="" loading="lazy" width={185} height={278} /> : <span className="st-cast-ph" aria-hidden="true">{p.name.slice(0, 1)}</span>}
                    <span className="pr-film-title">{p.name}</span>
                    {p.known_for_department && <span className="pr-film-sub">{p.known_for_department}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {list.people.length === 0 && list.loading && <StatusMessage kind="loading" title={t('people.loading')} />}
        {list.error && <p className="dim">{list.error}</p>}
        {(list.hasMore || list.error) && list.people.length > 0 && (
          <div className="mv-more">
            <button type="button" className="btn btn-ghost" onClick={list.loadMore} disabled={list.loading}>
              {list.loading ? t('more.loadingMore') : list.error ? t('more.retry') : t('more.loadMore')}
            </button>
          </div>
        )}
        {list.people.length === 0 && list.error && (
          <button type="button" className="btn btn-primary" onClick={list.loadMore}>
            {t('status.retry')}
          </button>
        )}
      </div>
    </div>
  );
}
