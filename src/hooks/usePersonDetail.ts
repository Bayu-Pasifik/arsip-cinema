import { useEffect, useState } from 'react';
import { useLanguage } from '../services/language';
import { errorMessage, fetchPersonDetail } from '../services/tmdb';
import type { PersonDetail } from '../types/tmdb';

export type PersonState =
  | { status: 'loading' }
  | { status: 'success'; person: PersonDetail }
  | { status: 'error'; message: string };

export function usePersonDetail(id: number): PersonState {
  const [state, setState] = useState<PersonState>({ status: 'loading' });
  const language = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchPersonDetail(id, controller.signal)
      .then((person) => {
        if (!controller.signal.aborted) setState({ status: 'success', person });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
        setState({ status: 'error', message: errorMessage(err) });
      });
    return () => controller.abort();
  }, [id, language]);

  return state;
}
