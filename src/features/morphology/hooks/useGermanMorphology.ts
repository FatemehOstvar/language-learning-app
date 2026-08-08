import { useEffect, useState } from 'react';
import {
  lookupGermanMorphology,
  type GermanMorphologyResult,
} from '@/features/morphology/api/germanMorphology';

interface GermanMorphologyState {
  loading: boolean;
  result: GermanMorphologyResult | null;
  error: string | null;
}

export function useGermanMorphology({
  word,
  enabled,
}: {
  word: string;
  enabled: boolean;
}): GermanMorphologyState {
  const [state, setState] = useState<GermanMorphologyState>({
    loading: false,
    result: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !word) {
      setState({ loading: false, result: null, error: null });
      return;
    }

    const controller = new AbortController();
    setState({ loading: true, result: null, error: null });

    void lookupGermanMorphology({ word, signal: controller.signal })
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
              : 'German morphology lookup failed.',
        });
      });

    return () => controller.abort();
  }, [enabled, word]);

  return state;
}
