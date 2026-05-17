import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/services/supabase';
import {
  fetchQuizWithOptions,
  markQuestionsAnswered,
  type QuizQuestion,
  type QuizOption,
} from '@/services/quiz.service';
import { getGeneratedChapters } from '@/lib/chapterStorage';

const QUESTION_COUNT = 10;

export default function ChapterQuizScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { chapters } = useCatalogContext();
  const [generatedChapters, setGeneratedChapters] = useState<typeof chapters>([]);
  const chapter =
    chapters.find((c) => c.id === chapterId) ??
    generatedChapters.find((c) => c.id === chapterId);
  const chapterTitle = chapter?.title;
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Array<{ correct: boolean }>>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      if (!chapterId) {
        setLoading(false);
        return;
      }

      const generated = await getGeneratedChapters();
      setGeneratedChapters(generated);
      const ch =
        chapters.find((c) => c.id === chapterId) ??
        generated.find((c) => c.id === chapterId);

      const q = await fetchQuizWithOptions(chapterId, user?.id ?? null, QUESTION_COUNT);
      setQuestions(q);
      setLoading(false);
    };
    run();
  }, [chapterId, chapters]);

  const currentQuestion = questions[currentIndex];
  const correctOption = currentQuestion?.options.find((o) => o.is_correct);
  const isAnswered = selectedOptionId !== null;

  const handleSelectOption = (option: QuizOption) => {
    if (isAnswered) return;
    setSelectedOptionId(option.id);
    const correct = option.is_correct;
    setAnswers((prev) => [...prev, { correct }]);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOptionId(null);
    } else {
      const allAnswers = answers;
      const correctCount = allAnswers.filter((a) => a.correct).length;
      if (userId && questions.length > 0) {
        await markQuestionsAnswered(
          userId,
          allAnswers.map((a, i) => ({
            practice_item_id: questions[i].id,
            is_correct: a.correct,
          }))
        );
      }
      const fromFreeQuiz = questions.length <= 5 ? 'true' : 'false';
      router.replace({
        pathname: `/chapter/${chapterId}/quiz-result`,
        params: {
          correctCount: String(correctCount),
          chapterTitle: chapterTitle ?? '',
          fromFreeQuiz,
        },
      });
    }
  };

  const getOptionStyle = (option: QuizOption) => {
    if (!isAnswered) return null;
    const isSelected = option.id === selectedOptionId;
    const isCorrect = option.is_correct;
    if (isCorrect) return styles.optionCorrect;
    if (isSelected && !isCorrect) return styles.optionWrong;
    return styles.optionNeutral;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  if (!chapterId || questions.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Quiz</Text>
        <Text style={styles.subtitle}>
          Nu există întrebări pentru acest capitol. Generează mai întâi conținutul.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={styles.back} hitSlop={16}>
        <Text style={styles.backText}>← Înapoi</Text>
      </Pressable>
      <Text style={styles.progress}>
        Întrebarea {currentIndex + 1} / {questions.length}
      </Text>
      <Text style={styles.title}>{currentQuestion.question}</Text>

      <View style={styles.options}>
        {currentQuestion.options.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => handleSelectOption(opt)}
            disabled={isAnswered}
            style={({ pressed }) => [
              styles.option,
              getOptionStyle(opt),
              pressed && !isAnswered && styles.optionPressed,
            ]}
          >
            <Text style={styles.optionText}>{opt.text}</Text>
          </Pressable>
        ))}
      </View>

      {isAnswered && correctOption && (
        <View style={styles.correctAnswerBox}>
          <Text style={styles.correctLabel}>Răspunsul corect:</Text>
          <Text style={styles.correctText}>{correctOption.text}</Text>
        </View>
      )}

      {isAnswered && (
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.nextButton, pressed && styles.nextPressed]}
        >
          <GlassCard dark intensity={14} style={styles.nextInner}>
            <Text style={styles.nextText}>
              {currentIndex < questions.length - 1 ? 'Următoarea →' : 'Vezi rezultatul'}
            </Text>
          </GlassCard>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.contentBottom,
  },
  back: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: typography.size.md,
    color: colors.dark.secondary,
    fontWeight: '600',
  },
  progress: {
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.dark.text,
    marginBottom: spacing.xl,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  optionPressed: {
    opacity: 0.9,
  },
  optionCorrect: {
    borderColor: colors.dark.success,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  optionWrong: {
    borderColor: colors.dark.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  optionNeutral: {
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  optionText: {
    fontSize: typography.size.md,
    color: colors.dark.text,
  },
  correctAnswerBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.dark.success,
  },
  correctLabel: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.dark.muted,
    marginBottom: spacing.xs,
  },
  correctText: {
    fontSize: typography.size.md,
    color: colors.dark.text,
  },
  nextButton: {
    marginTop: spacing.xl,
  },
  nextPressed: {
    opacity: 0.9,
  },
  nextInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    alignItems: 'center',
  },
  nextText: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: '#4ade80',
  },
});
