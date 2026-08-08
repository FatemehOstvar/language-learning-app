import { useEffect, useState } from 'react';
import {
  lookupWordDefinition,
  type DictionaryLookupResult,
} from '@/features/vocabulary/api/dictionary';

interface DictionaryLookupState {
  loading: boolean;
  result: DictionaryLookupResult | null;
  error: string | null;
}

export function useDictionaryLookup({
  word,
  sourceLanguage,
  definitionLanguage,
}: {
  word: string;
  sourceLanguage: string;
  definitionLanguage: string;
}): DictionaryLookupState {
  const [state, setState] = useState<DictionaryLookupState>({
    loading: false,
    result: null,
    error: null,
  });

  useEffect(() => {
    if (!word) {
      setState({ loading: false, result: null, error: null });
      return;
    }

    const controller = new AbortController();

    setState({ loading: true, result: null, error: null });

    void lookupWordDefinition({
      word,
      sourceLanguage,
      definitionLanguage,
      signal: controller.signal,
    })
      .then((result) => {
        setState({ loading: false, result, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setState({
          loading: false,
          result: null,
          error:
            error instanceof Error
              ? error.message
              : 'Dictionary lookup failed.',
        });
      });

    return () => controller.abort();
  }, [definitionLanguage, sourceLanguage, word]);

  return state;
}
