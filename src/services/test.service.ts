import { supabase } from './supabase';
import { canStartTest, getSubscriptionStatus } from './subscription.service';

const SAFE_TEST_ID_REGEX = /^[a-z0-9-]{3,80}$/;

/**
 * Defensive check for testId values coming from deep links / navigation params.
 * Allows only lowercase letters, digits and hyphens, with a sane length.
 */
export function isValidTestIdParam(testId: string): boolean {
  return SAFE_TEST_ID_REGEX.test((testId ?? '').trim());
}

/**
 * Parse testId (ex: en-subj-en-romana, bac-subj-bac-matematica-real) into exam type and subject id.
 */
export const parseTestId = (testId: string): { examType: 'EN' | 'Bac'; subjectId: string } | null => {
  const enMatch = testId?.match(/^en-(.+)$/);
  if (enMatch) return { examType: 'EN', subjectId: enMatch[1] };
  const bacMatch = testId?.match(/^bac-(.+)$/);
  if (bacMatch) return { examType: 'Bac', subjectId: bacMatch[1] };
  return null;
};

/** Verifică dacă userul poate începe un test nou (limita free: 1 test total). */
export async function canUserStartTest(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  return canStartTest(userId, status);
}

/**
 * Creates a test record when starting an exam.
 * Returns limitReached when free user already used their one test.
 */
export const createTestRecord = async (params: {
  userId: string;
  examType: 'EN' | 'Bac';
  subjectId: string;
}) => {
  const allowed = await canUserStartTest(params.userId);
  if (!allowed) {
    return {
      testId: null as string | null,
      error: new Error('FREE_TEST_LIMIT'),
      limitReached: true,
    };
  }

  const { data, error } = await supabase
    .from('tests')
    .insert({
      user_id: params.userId,
      type: params.examType,
      subject_set: [params.subjectId],
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  return { testId: data?.id as string | null, error, limitReached: false };
};

/**
 * Updates a test result.
 */
export const submitTestResult = async (testId: string, score: number) => {
  return supabase.from('tests').update({ score, finished_at: new Date().toISOString() }).eq('id', testId);
};

/**
 * Requests a generated test from Edge Function (legacy).
 */
export const generateTest = async (payload: {
  user_id: string;
  exam_type: 'EN' | 'Bac';
  level: string;
  subjects?: string[];
}) => {
  return supabase.functions.invoke('generate-test', { body: payload });
};
