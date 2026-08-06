import type { MediaFile } from '@/shared/api/supabase';
import type { SrtCue } from '@/shared/utils/srtParser';

export interface PlayerLessonProps {
  media: MediaFile;
  focusMode: boolean;
}

export interface Sentence {
  index: number;
  text: string;
  endsWithPeriod: boolean;
  cues?: SrtCue[];
  startTime?: number;
  endTime?: number;
}

export interface PopupState {
  word: string;
  sentence: string;
  x: number;
  y: number;
}
