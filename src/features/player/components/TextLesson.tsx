import { useCallback, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import WordPopup from '@/features/vocabulary/components/WordPopup';
import { MarkAllWordsLearnedButton } from '@/features/player/components/MarkAllWordsLearnedButton';
import { InteractiveTranscript } from '@/features/player/components/InteractiveTranscript';
import { useVocabulary } from '@/features/player/hooks/useVocabulary';
import { buildTextSentences } from '@/features/player/utils/transcriptUtils';
import type { PlayerLessonProps, Sentence } from '@/features/player/model/types';

export function TextLesson({ media, focusMode }: PlayerLessonProps) {
  const [copiedSentence, setCopiedSentence] = useState<number | null>(null);
  const sentences = useMemo(
    () => buildTextSentences(media.content),
    [media.content],
  );
  const vocabulary = useVocabulary(sentences, media.id);

  const copySentence = useCallback((sentence: Sentence) => {
    void navigator.clipboard.writeText(sentence.text);
    setCopiedSentence(sentence.index);
    window.setTimeout(() => setCopiedSentence(null), 1500);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {!focusMode && (
        <header className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {media.title}
            </h1>
            {media.source_filename && (
              <p className="mt-1 text-sm text-slate-400">
                {media.source_filename}
              </p>
            )}
          </div>
        </header>
      )}

      <InteractiveTranscript
        sentences={sentences}
        trackedWords={vocabulary.trackedWordMap}
        copiedIndex={copiedSentence}
        onSentenceClick={copySentence}
        onWordClick={vocabulary.openWordPopup}
      />

      <MarkAllWordsLearnedButton
        allMarked={vocabulary.allMarked}
        markingAll={vocabulary.markingAll}
        onClick={vocabulary.markAllLearned}
      />

      <div className="h-20" />

      {vocabulary.popup && (
        <WordPopup
          {...vocabulary.popup}
          onClose={vocabulary.closePopup}
          onSaved={vocabulary.handlePopupSaved}
        />
      )}
    </div>
  );
}
