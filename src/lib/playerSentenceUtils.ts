import type { SrtCue } from '@/lib/srtParser';
import type { Sentence } from '@/lib/playerTypes';

const ENDS_SENTENCE = /[.!?]$/;

export function buildTextSentences(content: string | null): Sentence[] {
  if (!content) return [];

  return content
    .split('\n')
    .map((text, index) => {
      const trimmedText = text.trim();

      return {
        index,
        text: trimmedText,
        endsWithPeriod: ENDS_SENTENCE.test(trimmedText),
      };
    })
    .filter((sentence) => sentence.text.length > 0);
}

export function buildSentencesFromCues(cues: SrtCue[]): Sentence[] {
  const sentences: Sentence[] = [];
  let pendingCues: SrtCue[] = [];

  const commit = () => {
    if (pendingCues.length === 0) return;

    const text = pendingCues
      .map((cue) => cue.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    sentences.push({
      index: sentences.length,
      text,
      cues: pendingCues,
      startTime: pendingCues[0].startTime,
      endTime: pendingCues[pendingCues.length - 1].endTime,
      endsWithPeriod: ENDS_SENTENCE.test(text),
    });

    pendingCues = [];
  };

  for (const cue of cues) {
    pendingCues.push(cue);

    const text = pendingCues.map((item) => item.text).join(' ').trim();
    if (ENDS_SENTENCE.test(text)) commit();
  }

  commit();
  return sentences;
}

export function findActiveSentenceIndex(
  sentences: Sentence[],
  currentTime: number,
): number {
  return sentences.findIndex(({ startTime = 0, endTime = 0 }) =>
    currentTime >= startTime && currentTime <= endTime,
  );
}
