import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, spacing, radius, sizes, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { useGamification } from '@/hooks/useGamification';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { CoinsDisplay } from '@/components/gamification/CoinsDisplay';
import { DailyMission } from '@/components/gamification/DailyMission';
import { RecentActivity } from '@/components/gamification/RecentActivity';
import { ExamCountdownDual } from '@/components/gamification/ExamCountdown';
import { generateDailyMissions } from '@/services/daily-missions.client';
import { getOnboardingExam } from '@/lib/onboardingStorage';

const kheiaIcon = require('../../assets/KHEIA ICON.png');

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'progress'>('welcome');
  const [examContext, setExamContext] = useState<'EN' | 'BAC' | 'ANY'>('ANY');
  const { subjects, loading } = useCatalogContext();
  const { coins, level, xpProgress, streak, transactions, loading: gamLoading, userId, refresh } =
    useGamification();

  useEffect(() => {
    getOnboardingExam().then((exam) => {
      if (exam) setExamContext(exam);
    });
  }, []);

  const missions = useMemo(
    () => generateDailyMissions(streak, transactions, examContext),
    [streak, transactions, examContext]
  );

  useFocusEffect(
    useCallback(() => {
      void refresh({ silent: true });
    }, [refresh])
  );


  const getSubjectsByExam = (exam: 'EN' | 'BAC') =>
    subjects.filter((subject) => (subject.exam_tags ?? []).includes(exam));

  const enCount = getSubjectsByExam('EN').length;
  const bacCount = getSubjectsByExam('BAC').length;

  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  const initial = userId ? 'U' : '?';

  return (
    <View style={styles.container}>
      <View style={[styles.topTabs, { marginTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => setActiveTab('welcome')}
          style={[styles.topTab, activeTab === 'welcome' && styles.topTabActive]}
        >
          <Text style={[styles.topTabText, activeTab === 'welcome' && styles.topTabTextActive]}>
            Welcome
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('progress')}
          style={[styles.topTab, activeTab === 'progress' && styles.topTabActive]}
        >
          <Text style={[styles.topTabText, activeTab === 'progress' && styles.topTabTextActive]}>
            Progres
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'welcome' ? (
          <>
            <View style={styles.hero}>
              <Image source={kheiaIcon} style={styles.heroIcon} resizeMode="contain" />
              <Text style={styles.heroTitle}>Unlock Your Future</Text>
              <Text style={styles.heroSubtitle}>Antrenorul tău pentru EN & Bac</Text>
              <Text style={styles.heroBody}>Alege o materie și începe antrenamentul.</Text>

              <View style={styles.countdownWrap}>
                <ExamCountdownDual />
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Materii disponibile</Text>
                <Pressable
                  style={({ pressed }) => [styles.examEntry, pressed && styles.examEntryPressed]}
                  onPress={() => router.push({ pathname: '/subjects', params: { exam: 'EN' } })}
                  accessibilityRole="button"
                  accessibilityLabel="Evaluare Națională"
                >
                  <Text style={styles.examEntryLabel}>Evaluare Națională</Text>
                  <Text style={styles.examEntryCount}>{enCount} materii</Text>
                  <Text style={styles.examEntryArrow}>→</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.examEntry, styles.examEntryLast, pressed && styles.examEntryPressed]}
                  onPress={() => router.push({ pathname: '/subjects', params: { exam: 'BAC' } })}
                  accessibilityRole="button"
                  accessibilityLabel="Bacalaureat"
                >
                  <Text style={styles.examEntryLabel}>Bacalaureat</Text>
                  <Text style={styles.examEntryCount}>{bacCount} materii</Text>
                  <Text style={styles.examEntryArrow}>→</Text>
                </Pressable>
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Progresul tău</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{level}</Text>
                    <Text style={styles.statLabel}>Nivel</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{coins}</Text>
                    <Text style={styles.statLabel}>Monede</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{streak}</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                </View>
                <View style={styles.xpBarWrap}>
                  <View style={styles.chartBarBg}>
                    <View
                      style={[
                        styles.chartBarFill,
                        { width: `${Math.min(100, xpProgress * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.xpBarLabel}>XP până la nivelul următor</Text>
                </View>
              </View>
            </View>

          </>
        ) : gamLoading ? (
          <View style={[styles.progressContent, styles.centered, { minHeight: 200 }]}>
            <ActivityIndicator size="large" color={colors.dark.primary} />
          </View>
        ) : (
          <View style={styles.progressContent}>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.level}>Nivel {level}</Text>
                <XPBar progress={xpProgress} />
              </View>
            </View>
            <View style={styles.coinsRow}>
              <CoinsDisplay coins={coins} />
            </View>
            <View style={styles.streakRow}>
              <StreakCounter streak={streak} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Misiuni zilnice</Text>
              {missions.map((m) => (
                <View key={m.id} style={styles.missionWrap}>
                  <DailyMission text={m.text} />
                </View>
              ))}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ultimele activități</Text>
              <RecentActivity transactions={transactions} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topTabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.fieldGap,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  topTab: {
    flex: 1,
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  topTabActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
  },
  topTabText: {
    ...iosText('headline'),
    color: colors.dark.muted,
  },
  topTabTextActive: {
    color: colors.dark.text,
  },
  scroll: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.fieldGap,
    paddingBottom: spacing.contentBottom,
  },
  progressContent: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: spacing.xlSpace + spacing.lg,
    height: spacing.xlSpace + spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...iosText('title3'),
    color: '#fff',
  },
  headerRight: {
    flex: 1,
    marginLeft: spacing.md,
  },
  level: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  coinsRow: {
    marginTop: spacing.md,
  },
  streakRow: {
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.sectionGap,
  },
  sectionTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  missionWrap: {
    marginBottom: spacing.xs,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...iosText('title1'),
    color: colors.dark.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    ...iosText('title3'),
    color: colors.dark.muted,
    textAlign: 'center',
  },
  heroBody: {
    marginTop: spacing.sm,
    ...iosText('body'),
    color: colors.dark.text,
    textAlign: 'center',
  },
  countdownWrap: {
    marginTop: spacing.lg,
    width: '100%',
  },
  chartCard: {
    marginTop: spacing.xl,
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  examEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  examEntryLast: {
    marginBottom: 0,
  },
  examEntryPressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  examEntryLabel: {
    flex: 1,
    ...iosText('headline'),
    color: colors.dark.text,
  },
  examEntryCount: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginRight: spacing.sm,
  },
  examEntryArrow: {
    ...iosText('title3'),
    color: colors.dark.muted,
  },
  chartTitle: {
    ...iosText('headline'),
    fontWeight: '700',
    color: colors.dark.text,
    marginBottom: spacing.md,
  },
  chartBarBg: {
    flex: 1,
    height: spacing.sm + spacing.xs,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    backgroundColor: colors.dark.primary,
    borderRadius: radius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...iosText('title2'),
    color: colors.dark.text,
  },
  statLabel: {
    ...iosText('caption1'),
    color: colors.dark.muted,
    marginTop: spacing.tight,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: spacing.xlSpace,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  xpBarWrap: {
    marginTop: spacing.sm,
  },
  xpBarLabel: {
    ...iosText('caption1'),
    color: colors.dark.muted,
    marginTop: spacing.xs,
  },
});
