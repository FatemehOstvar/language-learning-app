import type { PointerEvent, RefObject } from 'react';
import type { LeitnerWord } from '@/features/vocabulary/api/leitner';
import { getWordClass } from '@/features/player/utils/wordTrackingUtils';
import type { Sentence } from '@/features/player/model/types';

interface SentenceTextProps {
  sentences: Sentence[];
  trackedWords: Map<string, LeitnerWord>;
  activeIndex?: number;
  copiedIndex?: number | null;
  activeRef?: RefObject<HTMLSpanElement>;
  onSentenceClick: (sentence: Sentence) => void;
  onWordClick: (
    event: PointerEvent<HTMLElement>,
    word: string,
    sentence: string,
  ) => void;
}

export function InteractiveTranscript({
  sentences,
  trackedWords,
  activeIndex,
  copiedIndex,
  activeRef,
  onSentenceClick,
  onWordClick,
}: SentenceTextProps) {
  const hasActiveSentence = activeIndex !== undefined;

  return (
    <div className="text-[15px] leading-loose">
      {sentences.map((sentence) => {
        const isActive = sentence.index === activeIndex;
        const isCopied = sentence.index === copiedIndex;

        const stateClass = isCopied
          ? 'bg-emerald-100 text-emerald-900'
          : isActive
            ? 'bg-emerald-100/80 text-slate-950'
            : hasActiveSentence
              ? 'text-slate-700 hover:bg-slate-100'
              : 'hover:bg-slate-100';

        return (
          <span
            key={sentence.index}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSentenceClick(sentence)}
            aria-current={isActive ? 'true' : undefined}
            className={`cursor-pointer rounded px-1 py-0.5 transition-colors duration-300 ${stateClass}`}
          >
            {sentence.text.split(/\s+/).map((word, wordIndex) => (
              <span
                key={`${sentence.index}-${wordIndex}`}
                onPointerDown={(event) =>
                  onWordClick(event, word, sentence.text)
                }
                onClick={(event) => event.stopPropagation()}
                className={`cursor-pointer rounded px-0.5 transition-colors hover:underline ${getWordClass(
                  word,
                  trackedWords,
                )}`}
              >
                {word}{' '}
              </span>
            ))}

            {sentence.endsWithPeriod ? <br /> : ' '}
          </span>
        );
      })}
    </div>
  );
}
