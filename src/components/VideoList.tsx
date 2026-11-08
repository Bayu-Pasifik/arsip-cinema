import { useT } from '../i18n';
import type { Video } from '../types/tmdb';
import { formatDate } from '../utils/format';
import type { VideoGroup } from '../utils/videos';

/** Video tambahan (teaser, klip, behind the scenes). Tidak memuat apa pun dari YouTube sampai tombol ditekan. */
export default function VideoList({ groups, onPlay }: { groups: VideoGroup[]; onPlay: (v: Video) => void }) {
  const t = useT();
  if (groups.length === 0) return null;
  return (
    <section className="vl" aria-labelledby="st-vid-h">
      <h3 id="st-vid-h" className="tag">
        {t('more.videos')}
      </h3>
      {groups.map((g) => (
        <div key={g.type} className="vl-group">
          <h4 className="wp-label">{t(`video.${g.type}`)}</h4>
          <ul className="vl-list">
            {g.videos.map((v) => (
              <li key={v.id}>
                <button type="button" className="vl-item" aria-haspopup="dialog" onClick={() => onPlay(v)}>
                  <span className="vl-play" aria-hidden="true">
                    ▶
                  </span>
                  <span className="vl-name">{v.name}</span>
                  {v.published_at && <span className="dim vl-date">{formatDate(v.published_at.slice(0, 10))}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
