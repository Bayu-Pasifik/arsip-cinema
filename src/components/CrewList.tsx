import { useT } from '../i18n';
import { navigate, personPath } from '../hooks/useRoute';
import type { CrewMember } from '../types/tmdb';
import { crewGroups } from '../utils/crew';

/** Kru utama (sutradara, penulis, produser, musik, sinematografi, editor); klik nama membuka profilnya. */
export default function CrewList({ crew }: { crew: CrewMember[] }) {
  const t = useT();
  const groups = crewGroups(crew);
  if (groups.length === 0) return null;
  return (
    <section className="crew" aria-labelledby="st-crew-h">
      <h3 id="st-crew-h" className="tag">
        {t('more.crew')}
      </h3>
      <dl className="crew-list">
        {groups.map((g) => (
          <div key={g.key} className="crew-row">
            <dt>{t(`crew.${g.key}`)}</dt>
            <dd>
              {g.people.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <button type="button" className="kw-btn" onClick={() => navigate(personPath(p.id))} aria-label={t('detail.openPerson', { name: p.name })}>
                    {p.name}
                  </button>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
