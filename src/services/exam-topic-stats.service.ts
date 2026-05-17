import {
  EXAM_TOPIC_FREQUENCY,
  type ExamTopicStat,
} from '@/fixtures/exam-topic-frequency.fixture';

export type ExamTopicSuggestion = ExamTopicStat & {
  label: string;
};

function formatYears(years: number[]): string {
  if (years.length === 0) return '';
  const sorted = [...years].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) return String(min);
  return `${min}–${max}`;
}

export function getFrequentExamTopics(subjectId: string): ExamTopicSuggestion[] {
  return EXAM_TOPIC_FREQUENCY.filter((t) => t.subjectId === subjectId)
    .sort((a, b) => a.rank - b.rank)
    .map((t) => ({
      ...t,
      label: `${t.topicTitle} · ~${t.appearances} subiecte (${formatYears(t.years)})`,
    }));
}

export function getExamTypeForSubject(examTags: string[] | undefined): 'EN' | 'BAC' | null {
  if (!examTags?.length) return null;
  if (examTags.includes('EN')) return 'EN';
  if (examTags.includes('BAC')) return 'BAC';
  return null;
}
