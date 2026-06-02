import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { supabase } from '@/services/supabase';
import { onTestFinished } from '@/services/progress-events.service';
import { buildTestResultShareText } from '@/services/gamification.service';
import { isValidTestIdParam, parseTestId } from '@/services/test.service';
import { getOfficialTestById } from '@/services/official-tests.service';

export default function TestResultScreen() {
  const { testId, correctCount, totalCount } = useLocalSearchParams<{
    testId: string;
    correctCount?: string;
    totalCount?: string;
  }>();
  const router = useRouter();
  const { subjects } = useCatalogContext();

  const correct = Math.max(0, parseInt(correctCount ?? '0', 10));
  const total = Math.max(1, parseInt(totalCount ?? '1', 10));
  const score = Math.round((correct / total) * 100);
  const coins = Math.floor(20 + (score / 100) * 30);
  const xpGained = correct * 10;

  const rawTestId = String(testId ?? '');
  const officialTest = rawTestId ? getOfficialTestById(rawTestId) : null;
  const parsed = officialTest
    ? { subjectId: officialTest.subjectId }
    : rawTestId && isValidTestIdParam(rawTestId)
      ? parseTestId(rawTestId)
      : null;
  const subjectName = parsed?.subjectId
    ? subjects.find((s) => s.id === parsed.subjectId)?.name
    : undefined;

  const handleShare = async () => {
    const message = buildTestResultShareText(correct, total, subjectName);
    await Share.share({ message, title: 'Rezultatul meu pe KHEYA' });
  };

  useEffect(() => {
    if (!testId || !correctCount) return;

    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const correct = Math.max(0, parseInt(correctCount ?? '0', 10));
      const total = Math.max(1, parseInt(totalCount ?? '1', 10));

      await onTestFinished(user.id, testId, correct, total);
    };

    run();
  }, [testId, correctCount, totalCount]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rezultat test</Text>
      <Text style={styles.score}>
        {correct} / {total} răspunsuri corecte
      </Text>
      <Text style={styles.percent}>{score}%</Text>
      <Text style={styles.coins}>+{coins} monede</Text>
      <Text style={styles.xp}>+{xpGained} XP</Text>
      <Pressable
        onPress={handleShare}
        style={({ pressed }) => [styles.shareBtn, pressed && styles.buttonPressed]}
      >
        <GlassCard dark intensity={18} style={styles.shareBtnInner}>
          <Text style={styles.shareBtnText}>Share rezultatul</Text>
        </GlassCard>
      </Pressable>
      <Pressable
        onPress={() => router.replace('/(tabs)/tests')}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>← Înapoi la teste</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.dark.text,
  },
  score: {
    marginTop: spacing.md,
    fontSize: typography.size.lg,
    color: colors.dark.text,
  },
  percent: {
    marginTop: spacing.xs,
    fontSize: typography.size.xxl,
    fontWeight: '700',
    color: colors.dark.primary,
  },
  coins: {
    marginTop: spacing.sm,
    fontSize: typography.size.md,
    color: colors.dark.primary,
    fontWeight: '600',
  },
  xp: {
    marginTop: spacing.xs,
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    fontWeight: '600',
  },
  shareBtn: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  shareBtnInner: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: 'rgba(34, 211, 238, 0.4)',
  },
  shareBtnText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.dark.secondary,
  },
  button: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.9 },
  buttonText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.dark.secondary,
  },
});
