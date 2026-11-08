import { useState } from 'react';
import { useT } from '../i18n';
import { useDebounced } from '../hooks/useEnv';
import { useKeywordSearch } from '../hooks/useKeywordSearch';

/** Kotak cari kata kunci TMDB (bahasa Inggris) di panel filter; memilih saran = memasang filter keyword. */
export default function KeywordSearch({ onPick }: { onPick: (id: number) => void }) {
  const t = useT();
  const [text, setText] = useState('');
  const term = useDebounced(text.trim(), 300);
  const found = useKeywordSearch(term);
  return (
    <div className="kws">
      <label>
        <span>{t('filter.keywordSearch')}</span>
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('filter.keywordPlaceholder')}
          autoComplete="off"
          spellCheck={false}
          lang="en"
        />
      </label>
      {text.trim().length >= 2 && found.length > 0 && (
        <ul className="kws-list" lang="en">
          {found.slice(0, 6).map((k) => (
            <li key={k.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(k.id);
                  setText('');
                }}
              >
                {k.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
