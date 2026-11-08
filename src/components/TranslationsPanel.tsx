import { useId, useState } from 'react';
import { useT } from '../i18n';
import type { TranslationOption } from '../utils/translations';

/** Pilih bahasa lain untuk membaca judul, tagline, dan sinopsis versi terjemahan TMDB. */
export default function TranslationsPanel({ options }: { options: TranslationOption[] }) {
  const t = useT();
  const [key, setKey] = useState('');
  const selectId = useId();
  if (options.length === 0) return null;
  const current = options.find((o) => o.key === key);

  return (
    <section className="tr" aria-labelledby="st-tr-h">
      <h3 id="st-tr-h" className="tag">
        {t('more.translations')}
      </h3>
      <label htmlFor={selectId} className="dim tr-label">
        {t('more.translationsCount', { count: options.length })}
      </label>
      <select id={selectId} className="tr-select" value={key} onChange={(e) => setKey(e.target.value)}>
        <option value="">{t('more.pickLanguage')}</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      {current && (
        <div className="tr-body" lang={current.lang} aria-live="polite">
          {current.title && <p className="tr-title">{current.title}</p>}
          {current.tagline && <p className="tr-tagline">“{current.tagline}”</p>}
          <p>{current.overview}</p>
        </div>
      )}
    </section>
  );
}
