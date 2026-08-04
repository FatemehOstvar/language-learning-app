import { supabase } from '@/lib/supabase';

export type WordStatus = 'unlearned' | 'leitner' | 'learned';

export interface LeitnerWord {
  id: string;
  word: string;
  sentence: string | null;
  status: WordStatus;
  box: number;
  next_review: string;
  last_reviewed: string | null;
  review_count: number;
  created_at: string;
}

// Leitner box intervals (in days) for boxes 1-5
export const BOX_INTERVALS = [1, 2, 4, 8, 16];

export function normalizeWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'-]/gu, '')
    .trim();
}

export async function fetchAllWords(): Promise<LeitnerWord[]> {
  const { data, error } = await supabase
    .from('leitner_words')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as LeitnerWord[];
}

export async function fetchWordsByStatus(status: WordStatus): Promise<LeitnerWord[]> {
  const { data, error } = await supabase
    .from('leitner_words')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as LeitnerWord[];
}

export async function fetchTodayReviewWords(): Promise<LeitnerWord[]> {
  const { data, error } = await supabase
    .from('leitner_words')
    .select('*')
    .eq('status', 'leitner')
    .lte('next_review', new Date().toISOString().split('T')[0])
    .order('next_review', { ascending: true });
  if (error) throw error;
  return data as LeitnerWord[];
}

export async function upsertWord(
  word: string,
  sentence: string,
  status: WordStatus,
): Promise<LeitnerWord | null> {
  const cleanWord = normalizeWord(word);
  if (!cleanWord) return null;

  // Check if the word already exists
  const { data: existing } = await supabase
    .from('leitner_words')
    .select('*')
    .eq('word', cleanWord)
    .maybeSingle();

  if (existing) {
    // Update existing word's status and sentence
    const update: Partial<LeitnerWord> = {
      status,
      sentence,
    };
    if (status === 'leitner') {
      update.box = 1;
      update.next_review = new Date().toISOString().split('T')[0];
    }
    const { data, error } = await supabase
      .from('leitner_words')
      .update(update)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as LeitnerWord;
  }

  const insert: Record<string, unknown> = {
    word: cleanWord,
    sentence,
    status,
  };
  if (status === 'leitner') {
    insert.box = 1;
    insert.next_review = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('leitner_words')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as LeitnerWord;
}

export async function reviewWord(
  wordId: string,
  remembered: boolean,
): Promise<LeitnerWord | null> {
  const { data: word, error: fetchError } = await supabase
    .from('leitner_words')
    .select('*')
    .eq('id', wordId)
    .single();
  if (fetchError) throw fetchError;
  if (!word) return null;

  const currentBox = word.box;
  let newBox: number;
  let newStatus: WordStatus = 'leitner';

  if (remembered) {
    newBox = Math.min(currentBox + 1, 5);
    if (newBox === 5) {
      // Graduated to learned after mastering the last box
      newStatus = 'learned';
    }
  } else {
    newBox = Math.max(currentBox - 1, 1);
    if (newBox === 1) {
      newStatus = 'leitner';
    }
  }

  const interval = BOX_INTERVALS[newBox - 1];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  const { data, error } = await supabase
    .from('leitner_words')
    .update({
      box: newBox,
      status: newStatus,
      next_review: nextReview.toISOString().split('T')[0],
      last_reviewed: new Date().toISOString().split('T')[0],
      review_count: word.review_count + 1,
    })
    .eq('id', wordId)
    .select()
    .single();
  if (error) throw error;
  return data as LeitnerWord;
}

export async function deleteWord(wordId: string): Promise<void> {
  const { error } = await supabase
    .from('leitner_words')
    .delete()
    .eq('id', wordId);
  if (error) throw error;
}

export async function fetchWordMap(): Promise<Map<string, LeitnerWord>> {
  const words = await fetchAllWords();
  const map = new Map<string, LeitnerWord>();
  for (const w of words) {
    map.set(w.word, w);
  }
  return map;
}

export async function markWordsAsLearned(
  words: { word: string; sentence: string }[],
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  for (const { word, sentence } of words) {
    const cleanWord = normalizeWord(word);
    if (!cleanWord) continue;

    const { data: existing } = await supabase
      .from('leitner_words')
      .select('id, status')
      .eq('word', cleanWord)
      .maybeSingle();

    if (existing) {
      if (existing.status !== 'learned') {
        await supabase
          .from('leitner_words')
          .update({ status: 'learned', sentence, box: 5, last_reviewed: today })
          .eq('id', existing.id);
      }
    } else {
      await supabase
        .from('leitner_words')
        .insert({ word: cleanWord, sentence, status: 'learned', box: 5, last_reviewed: today });
    }
  }
}
