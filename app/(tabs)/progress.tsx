import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import dayjs from 'dayjs';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useGamification } from '@/hooks/useGamification';
import {
  generateDailyMissions,
  type DailyMission as DailyMissionData,
} from '@/services/daily-missions.client';
import { getOnboardingExam } from '@/lib/onboardingStorage';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { CoinsDisplay } from '@/components/gamification/CoinsDisplay';
import { DailyMission } from '@/components/gamification/DailyMission';
import { RecentActivity } from '@/components/gamification/RecentActivity';

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    coins,
    level,
    xpProgress,
    streak,
    transactions,
    loading,
    userId,
    totalXP,
    refresh,
  } = useGamification();

  const [examContext, setExamContext] = useState<'EN' | 'BAC' | 'ANY'>('ANY');

  useFocusEffect(
    useCallback(() => {
      void refresh({ silent: true });
    }, [refresh])
  );

  useEffect(() => {
    getOnboardingExam().then((exam) => {
      if (exam) setExamContext(exam);
    });
  }, []);

  const missions = useMemo<DailyMissionData[]>(
    () => generateDailyMissions(streak, transactions, examContext),
    [streak, transactions, examContext]
  );

  const handleMissionPress = (mission: DailyMissionData) => {
    switch (mission.type) {
      case 'QUIZ_EN':
      case 'QUIZ_BAC':
      case 'ANY_QUIZ':
        router.push({ pathname: '/select-chapter', params: { for: 'quiz' } });
        break;
      case 'TEST_EN':
      case 'TEST_BAC':
      case 'ANY_TEST':
        router.push('/(tabs)/tests');
        break;
      default:
        break;
    }
  };

  const todaySummary = useMemo(() => {
    const today = dayjs();
    const todaysTx = transactions.filter((tx) =>
      dayjs(tx.created_at).isSame(today, 'day')
    );

    const coinsToday = todaysTx
      .filter((tx) => tx.type === 'earn')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const quizzesToday = todaysTx.filter((tx) => tx.source === 'quiz').length;
    const testsToday = todaysTx.filter((tx) => tx.source === 'test').length;

    return {
      coinsToday,
      quizzesToday,
      testsToday,
    };
  }, [transactions]);

  const dailyGoal = useMemo(() => {
    if (streak >= 10) {
      return 'Completează azi minim 2 teste pentru a-ți menține streak-ul puternic.';
    }
    if (streak >= 3) {
      return 'Rezolvă azi 1 test și 1 quiz ca să-ți crești streak-ul.';
    }
    return 'Fă azi cel puțin 1 quiz ca să începi un nou streak.';
  }, [streak]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  const initial = userId ? 'U' : '?';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Progres</Text>
      <Text style={styles.subtitle}>
        Revino zilnic pentru XP și streak.
      </Text>

      <GlassCard dark intensity={18} style={styles.glassCard}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.level}>Nivel {level}</Text>
            <XPBar progress={xpProgress} />
            <Text style={styles.smallText}>
              Ai acumulat {totalXP} XP până acum.
            </Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard dark intensity={18} style={styles.glassCard}>
        <CoinsDisplay coins={coins} />
      </GlassCard>

      <GlassCard dark intensity={18} style={styles.glassCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Streak-ul tău</Text>
          <Text style={styles.streakLabel}>{streak} zile la rând</Text>
        </View>
        <View style={styles.streakRow}>
          <StreakCounter streak={streak} />
        </View>
        <Text style={styles.sectionText}>{dailyGoal}</Text>
      </GlassCard>

      <GlassCard dark intensity={18} style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Astăzi ai făcut</Text>
        <Text style={styles.sectionText}>
          {todaySummary.coinsToday} monede câștigate, {todaySummary.quizzesToday} quiz-uri și {todaySummary.testsToday} teste.
        </Text>
      </GlassCard>

      <GlassCard dark intensity={18} style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Misiuni zilnice</Text>
        {missions.length === 0 ? (
          <Text style={styles.emptyText}>
            Nicio misiune activă momentan. Fă un quiz sau un test pentru a câștiga XP și monede.
          </Text>
        ) : (
          missions.map((m) => (
            <Pressable
              key={m.id}
              style={({ pressed }) => [styles.missionWrap, pressed && styles.missionPressed]}
              onPress={() => handleMissionPress(m)}
              accessibilityRole="button"
              accessibilityLabel={m.text}
            >
              <DailyMission text={m.text} />
            </Pressable>
          ))
        )}
      </GlassCard>

      <GlassCard dark intensity={18} style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Ultimele activități</Text>
        <RecentActivity transactions={transactions} />
      </GlassCard>

      <View style={styles.bottom} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: 'transparent',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: spacing.contentBottom,
  },
  glassCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    width: '100%',
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.dark.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.size.md,
    color: colors.dark.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    flex: 1,
    marginLeft: spacing.md,
  },
  level: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  coinsRow: {
    marginTop: spacing.md,
  },
  streakRow: {
    marginTop: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  streakLabel: {
    fontSize: typography.size.xs,
    color: colors.dark.muted,
  },
  smallText: {
    fontSize: typography.size.xs,
    color: colors.dark.muted,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  missionWrap: {
    marginBottom: spacing.sm,
  },
  missionPressed: {
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.dark.text,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: typography.size.md,
    color: colors.dark.text,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  bottom: {
    height: spacing.lg,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.dark.muted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
