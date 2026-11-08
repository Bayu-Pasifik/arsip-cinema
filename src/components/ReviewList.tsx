import { useState } from 'react';
import { useT } from '../i18n';
import type { Review } from '../types/tmdb';
import { excerpt, formatDate } from '../utils/format';

const PREVIEW = 420;

function ReviewCard({ review }: { review: Review }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { text, truncated } = excerpt(review.content, PREVIEW);
  const full = excerpt(review.content, Number.MAX_SAFE_INTEGER).text;
  const rating = review.author_details?.rating;
  const date = formatDate(review.created_at?.slice(0, 10));

  return (
    <li className="rv">
      <p className="rv-head">
        <strong>{review.author || t('more.anonymous')}</strong>
        {typeof rating === 'number' && (
          <span className="rv-rating">
            <span aria-hidden="true">★</span> {rating}
            <span className="sr-only">{t('common.outOf10')}</span>
          </span>
        )}
        {date && <span className="dim">{date}</span>}
      </p>
      <p className="rv-body" lang="en">
        {open ? full : text}
      </p>
      {truncated && (
        <button type="button" className="rv-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? t('more.collapse') : t('more.readMore')}
        </button>
      )}
    </li>
  );
}

/** Ulasan pengguna TMDB (umumnya berbahasa Inggris), maksimal tiga, dengan "baca selengkapnya". */
export default function ReviewList({ reviews }: { reviews: Review[] }) {
  const t = useT();
  const shown = reviews.filter((r) => r.content?.trim()).slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <section className="rv-wrap" aria-labelledby="st-rv-h">
      <h3 id="st-rv-h" className="tag">
        {t('more.reviews')}
      </h3>
      <p className="dim rv-note">{t('more.reviewsNote')}</p>
      <ul className="rv-list">
        {shown.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </ul>
    </section>
  );
}
