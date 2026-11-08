import { useState } from 'react';
import type { Review } from '../types/tmdb';
import { excerpt, formatDate } from '../utils/format';

const PREVIEW = 420;

function ReviewCard({ review }: { review: Review }) {
  const [open, setOpen] = useState(false);
  const { text, truncated } = excerpt(review.content, PREVIEW);
  const full = excerpt(review.content, Number.MAX_SAFE_INTEGER).text;
  const rating = review.author_details?.rating;
  const date = formatDate(review.created_at?.slice(0, 10));

  return (
    <li className="rv">
      <p className="rv-head">
        <strong>{review.author || 'Anonim'}</strong>
        {typeof rating === 'number' && (
          <span className="rv-rating">
            <span aria-hidden="true">★</span> {rating}
            <span className="sr-only"> dari 10</span>
          </span>
        )}
        {date && <span className="dim">{date}</span>}
      </p>
      <p className="rv-body" lang="en">
        {open ? full : text}
      </p>
      {truncated && (
        <button type="button" className="rv-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Ringkas' : 'Baca selengkapnya'}
        </button>
      )}
    </li>
  );
}

/** Ulasan pengguna TMDB (umumnya berbahasa Inggris), maksimal tiga, dengan "baca selengkapnya". */
export default function ReviewList({ reviews }: { reviews: Review[] }) {
  const shown = reviews.filter((r) => r.content?.trim()).slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <section className="rv-wrap" aria-labelledby="st-rv-h">
      <h3 id="st-rv-h" className="tag">
        Ulasan pengguna
      </h3>
      <p className="dim rv-note">Dari pengguna TMDB — umumnya berbahasa Inggris.</p>
      <ul className="rv-list">
        {shown.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </ul>
    </section>
  );
}
