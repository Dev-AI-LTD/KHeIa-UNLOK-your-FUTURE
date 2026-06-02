import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/services/supabase';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import {
  fetchExamTestQuestions,
  markQuestionsAnswered,
  type QuizQuestion,
  type QuizOption,
} from '@/services/quiz.service';
import { parseTestId, createTestRecord, isValidTestIdParam } from '@/services/test.service';
import { getOfficialTestById } from '@/services/official-tests.service';
import { buildTestShareMessage } from '@/services/deep-linking.service';
import { FREE_TESTS_LIMIT } from '@/services/subscription.service';
import { isRevenueCatConfigured, presentPaywall } from '@/services/purchases.service';
import { refreshSubscriptionAfterPurchase } from '@/services/subscription.service';
import { sanitizeExternalHttpsUrl } from '@/utils/safeUrls';

const QUESTION_COUNT = 20;

export default function TestSessionScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjects } = useCatalogContext();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Array<{ correct: boolean }>>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [dbTestId, setDbTestId] = useState<string | null>(null);

  const rawTestId = String(testId ?? '');
  const officialTest = getOfficialTestById(rawTestId);
  const parsed = officialTest
    ? {
        examType: (officialTest.examType === 'BAC' ? 'Bac' : 'EN') as 'EN' | 'Bac',
        subjectId: officialTest.subjectId,
      }
    : isValidTestIdParam(rawTestId)
      ? parseTestId(rawTestId)
      : null;

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      if (!parsed?.subjectId) {
        setLoading(false);
        return;
      }

      if (user?.id) {
        const { testId: tid, limitReached } = await createTestRecord({
          userId: user.id,
          examType: parsed.examType,
          subjectId: parsed.subjectId,
        });
        if (limitReached) {
          setLoading(false);
          Alert.alert(
            'KHEYA Pro',
            `Planul gratuit include ${FREE_TESTS_LIMIT} test. Deblochează KHEYA Pro pentru teste nelimitate.`,
            [
              { text: 'Înapoi', onPress: () => router.back() },
              {
                text: 'Vezi abonamente',
                onPress: () => {
                  void (async () => {
                    if (!isRevenueCatConfigured()) return;
                    const result = await presentPaywall();
                    if (result === 'PURCHASED' || result === 'RESTORED') {
                      await refreshSubscriptionAfterPurchase(user.id);
                    }
                  })();
                },
              },
            ],
          );
          return;
        }
        setDbTestId(tid ?? null);
      }

      const q = await fetchExamTestQuestions(parsed.subjectId, QUESTION_COUNT);
      setQuestions(q);

      setLoading(false);
    };
    run();
  }, [parsed?.subjectId, parsed?.examType, router]);

  const subject = subjects.find((s) => s.id === parsed?.subjectId);
  const currentQuestion = questions[currentIndex];
  const correctOption = currentQuestion?.options.find((o) => o.is_correct);
  const isAnswered = selectedOptionId !== null;

  const handleShareTest = async () => {
    const message = buildTestShareMessage(String(testId), subject?.name);
    await Share.share({ message, title: 'Share testul' });
  };

  const handleSelectOption = (option: QuizOption) => {
    if (isAnswered) return;
    setSelectedOptionId(option.id);
    setAnswers((prev) => [...prev, { correct: option.is_correct }]);
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
      if (dbTestId) {
        const { submitTestResult } = await import('@/services/test.service');
        await submitTestResult(dbTestId, Math.round((correctCount / questions.length) * 100));
      }
      router.replace({
        pathname: '/test/result/[testId]',
        params: {
          testId: dbTestId ?? String(testId),
          correctCount: String(correctCount),
          totalCount: String(questions.length),
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

  if (!parsed || !subject) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={16}>
          <Text style={styles.backText}>← Înapoi</Text>
        </Pressable>
        <Text style={styles.title}>Test negăsit</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    const hasSourceUrl = officialTest?.sourceUrl;
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={16}>
          <Text style={styles.backText}>← Înapoi</Text>
        </Pressable>
        <Text style={styles.title}>Test {parsed.examType} · {subject.name}</Text>
        <Text style={styles.subtitle}>
          {hasSourceUrl
            ? 'Nu există încă întrebări interactive pentru acest test. Poți folosi subiectul oficial în PDF.'
            : 'Nu există încă întrebări pentru acest test. Revino mai târziu.'}
        </Text>
        {hasSourceUrl && (
          <Pressable
            onPress={() => {
              const safe = sanitizeExternalHttpsUrl(officialTest.sourceUrl!, {
                allowedHosts: [
                  'www.edu.ro',
                  'subiecte.edu.ro',
                  'subiecte2024.edu.ro',
                ],
              });
              if (!safe) {
                Alert.alert('Link invalid', 'Link-ul către subiectul oficial nu este valid.');
                return;
              }
              void Linking.openURL(safe);
            }}
            style={({ pressed }) => [styles.pdfButton, pressed && styles.pdfButtonPressed]}
          >
            <GlassCard dark intensity={14} style={styles.pdfButtonInner}>
              <Text style={styles.pdfButtonText}>📄 Deschide subiectul oficial (PDF)</Text>
            </GlassCard>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={16}>
          <Text style={styles.backText}>← Înapoi</Text>
        </Pressable>
        <Pressable onPress={handleShareTest} style={styles.shareBtn} hitSlop={16}>
          <Text style={styles.shareBtnText}>Share</Text>
        </Pressable>
      </View>
      <Text style={styles.progress}>
        Întrebarea {currentIndex + 1} / {questions.length}
      </Text>
      <Text style={styles.examBadge}>
        {parsed.examType} · {subject.name}
      </Text>
      <Text style={styles.question}>{currentQuestion.question}</Text>

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
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.contentBottom },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  backRow: {},
  shareBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  shareBtnText: { fontSize: typography.size.sm, fontWeight: '600', color: colors.dark.secondary },
  backText: { fontSize: typography.size.md, fontWeight: '600', color: colors.dark.secondary },
  title: { fontSize: typography.size.xl, fontWeight: '700', color: colors.dark.text },
  subtitle: { marginTop: spacing.sm, fontSize: typography.size.md, color: colors.dark.muted },
  pdfButton: { marginTop: spacing.lg },
  pdfButtonPressed: { opacity: 0.9 },
  pdfButtonInner: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  pdfButtonText: { fontSize: typography.size.md, fontWeight: '600', color: '#60a5fa' },
  progress: { fontSize: typography.size.sm, color: colors.dark.muted, marginBottom: spacing.sm },
  examBadge: { fontSize: typography.size.sm, fontWeight: '600', color: colors.dark.primary, marginBottom: spacing.md },
  question: { fontSize: typography.size.lg, fontWeight: '700', color: colors.dark.text, marginBottom: spacing.xl },
  options: { gap: spacing.sm },
  option: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  optionPressed: { opacity: 0.9 },
  optionCorrect: { borderColor: colors.dark.success, backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  optionWrong: { borderColor: colors.dark.danger, backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  optionNeutral: { borderColor: 'rgba(148, 163, 184, 0.15)' },
  optionText: { fontSize: typography.size.md, color: colors.dark.text },
  correctAnswerBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.dark.success,
  },
  correctLabel: { fontSize: typography.size.sm, fontWeight: '600', color: colors.dark.muted, marginBottom: spacing.xs },
  correctText: { fontSize: typography.size.md, color: colors.dark.text },
  nextButton: { marginTop: spacing.xl },
  nextPressed: { opacity: 0.9 },
  nextInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    alignItems: 'center',
  },
  nextText: { fontSize: typography.size.md, fontWeight: '700', color: '#4ade80' },
});
