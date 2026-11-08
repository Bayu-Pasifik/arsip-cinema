import type { Keyword } from '../types/tmdb';

/** Kata kunci/tema film dari TMDB (bahasa Inggris), maksimal 20. */
export default function KeywordChips({ keywords }: { keywords: Keyword[] }) {
  if (keywords.length === 0) return null;
  return (
    <section className="kw" aria-labelledby="st-kw-h">
      <h3 id="st-kw-h" className="tag">
        Tema &amp; kata kunci
      </h3>
      <ul className="st-chips kw-list" lang="en">
        {keywords.slice(0, 20).map((k) => (
          <li key={k.id} className="st-chip">
            {k.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
