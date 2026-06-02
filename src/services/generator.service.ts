import { supabase } from './supabase';

/**
 * Creates a new chapter with AI generation.
 * Folosește Supabase Edge Function.
 */
export const createChapter = async (topic: string, subjectId: string, level: 'gimnaziu' | 'liceu') => {
  const { data, error } = await supabase.functions.invoke('generate-chapter-content', {
    body: { topic, subject_id: subjectId, level },
  });

  if (error) return { data: null, error };
  return { data, error: null };
};

/**
 * Generates chapter theory summary.
 * Folosește Supabase Edge Function.
 */
export const generateTheory = async (chapterId: string, topic?: string) => {
  const { data, error } = await supabase.functions.invoke('generate-chapter-summary', {
    body: { chapter_id: chapterId, ...(topic && { topic }) },
  });

  if (error) {
    const msg =
      error.message?.includes('Failed to send a request') || error.message?.includes('edge function')
        ? 'Serviciul de generare nu este disponibil. Verifică deploy-ul Edge Functions în Supabase.'
        : error.message;
    return { data: null, error: new Error(msg ?? 'Nu s-a putut genera teoria.') };
  }
  return { data, error: null };
};

/**
 * Generates a quiz for a chapter.
 * @param chapterId Chapter id.
 */
export const generateQuiz = async (chapterId: string) => {
  return supabase.functions.invoke('generate-chapter-content', {
    body: { chapter_id: chapterId, mode: 'quiz' },
  });
};
