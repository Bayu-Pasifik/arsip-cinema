import { useId, useState } from 'react';
import { useT } from '../i18n';
import type { BioOption } from '../utils/person';

/** Pilih bahasa lain untuk membaca biografi versi terjemahan TMDB. */
export default function BioTranslations({ options }: { options: BioOption[] }) {
  const t = useT();
  const [key, setKey] = useState('');
  const selectId = useId();
  if (options.length === 0) return null;
  const current = options.find((o) => o.key === key);
  return (
    <div className="pr-tr">
      <label htmlFor={selectId} className="dim tr-label">
        {t('person.bioTranslations', { count: options.length })}
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
        <div className="pr-bio" lang={current.lang} aria-live="polite">
          {current.biography.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}
