import { useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, sizes, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getGeneratedChapters } from '@/lib/chapterStorage';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { canAccessChapter, FREE_CHAPTERS_PER_SUBJECT } from '@/services/subscription.service';
import {
  hasProEntitlement,
  isRevenueCatConfigured,
  presentPaywall,
} from '@/services/purchases.service';
import { paymentsUnavailableMessage } from '@/lib/storeCopy';

export default function SubjectDetailScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjects, chapters: chaptersData, loading } = useCatalogContext();
  const { status, isPremium, refreshAfterPurchase } = useSubscription();
  const [generatedChapters, setGeneratedChapters] = useState<typeof chaptersData>([]);

  useFocusEffect(
    useCallback(() => {
      getGeneratedChapters().then(setGeneratedChapters);
    }, [])
  );

  const openPremiumPaywall = useCallback(async () => {
    if (!isRevenueCatConfigured()) {
      Alert.alert('KHEYA Pro', paymentsUnavailableMessage());
      return;
    }
    if (await hasProEntitlement()) {
      await refreshAfterPurchase();
      return;
    }
    const result = await presentPaywall();
    if (result === 'PURCHASED' || result === 'RESTORED') {
      await refreshAfterPurchase();
    }
  }, [refreshAfterPurchase]);

  const handleChapterPress = useCallback(
    async (chapterId: string, chapterOrder: number) => {
      if (!status) return;
      const allowed =
        isPremium || (await hasProEntitlement()) || canAccessChapter(subjectId ?? '', chapterOrder, status);
      if (allowed) {
        router.push(`/chapter/${chapterId}/theory`);
        return;
      }
      Alert.alert(
        'KHEYA Pro',
        `Planul gratuit include primele ${FREE_CHAPTERS_PER_SUBJECT} capitole per materie. Deblochează KHEYA Pro pentru acces complet.`,
        [
          { text: 'Anulare', style: 'cancel' },
          { text: 'Vezi abonamente', onPress: () => void openPremiumPaywall() },
        ],
      );
    },
    [status, isPremium, subjectId, router, openPremiumPaywall],
  );

  const subject = subjects.find((s) => s.id === subjectId);
  const allChapters = [
    ...chaptersData.filter((ch) => ch.subject_id === subjectId && ch.published),
    ...generatedChapters.filter((ch) => ch.subject_id === subjectId),
  ].sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  if (!subject) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.screenPadding, paddingHorizontal: spacing.screenPadding }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backText}>← Înapoi</Text>
        </Pressable>
        <Text style={styles.title}>Materie negăsită</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.screenPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
        style={styles.backRow}
        accessibilityRole="button"
        accessibilityLabel="Înapoi"
      >
        <Text style={styles.backText}>← Înapoi</Text>
      </Pressable>

      <Text style={styles.subjectName}>{subject.name}</Text>
      <Text style={styles.subjectMeta}>
        {[subject.level, (subject.exam_tags ?? []).join(', ')].filter(Boolean).join(' · ')}
      </Text>

      <Text style={styles.sectionTitle}>Capitole</Text>
      <Text style={styles.programNote}>Ordinea conform programei școlare din România</Text>
      {!isPremium && status ? (
        <Text style={styles.freeHint}>
          Plan gratuit: primele {FREE_CHAPTERS_PER_SUBJECT} capitole per materie sunt deblocate.
        </Text>
      ) : null}
      <Pressable
        onPress={() => router.push(`/subject/${subjectId}/generate-chapter`)}
        style={({ pressed }) => [styles.generateBtn, pressed && styles.generateBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Generează capitol nou"
      >
        <GlassCard dark intensity={14} style={styles.generateBtnInner}>
          <Text style={styles.generateBtnText}>+ Generează capitol</Text>
        </GlassCard>
      </Pressable>
      {allChapters.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Nu există încă capitole pentru această materie. Apasă „Generează capitol” pentru a adăuga primul.
          </Text>
        </View>
      ) : (
      <View style={styles.chapterList}>
        {allChapters.map((chapter, index) => {
          const chapterOrder = chapter.order > 0 ? chapter.order : index + 1;
          const locked =
            status != null && !isPremium && !canAccessChapter(subjectId ?? '', chapterOrder, status);
          return (
            <Pressable
              key={chapter.id}
              onPress={() => void handleChapterPress(chapter.id, chapterOrder)}
              style={({ pressed }) => [
                styles.chapterPressable,
                pressed && styles.chapterPressed,
                locked && styles.chapterLocked,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Capitol ${chapterOrder}: ${chapter.title}${locked ? ', blocat' : ''}`}
            >
              <GlassCard dark intensity={14} style={styles.chapterCard}>
                <View style={styles.chapterNumberBadge}>
                  <Text style={styles.chapterNumber}>{chapterOrder}</Text>
                </View>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                {locked ? (
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>Pro</Text>
                  </View>
                ) : (
                  <Text style={styles.chapterArrow}>→</Text>
                )}
              </GlassCard>
            </Pressable>
          );
        })}
      </View>
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
    paddingHorizontal: spacing.screenPadding,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.contentBottom,
  },
  backRow: {
    marginBottom: spacing.fieldGap,
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    ...iosText('headline'),
    color: colors.dark.secondary,
    textAlign: 'left',
  },
  subjectName: {
    ...iosText('title2'),
    color: colors.dark.text,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  subjectMeta: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.sectionGap,
    textAlign: 'left',
  },
  sectionTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  programNote: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  freeHint: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginBottom: spacing.fieldGap,
    textAlign: 'left',
  },
  generateBtn: { marginBottom: spacing.fieldGap, minHeight: sizes.touchTarget },
  generateBtnPressed: { opacity: 0.9 },
  generateBtnInner: {
    padding: spacing.cardPadding,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.md,
  },
  generateBtnText: {
    ...iosText('headline'),
    color: '#4ade80',
    textAlign: 'left',
  },
  chapterList: {
    gap: spacing.fieldGap,
  },
  chapterPressable: {
    minHeight: sizes.touchTarget,
  },
  chapterPressed: {
    opacity: 0.85,
  },
  chapterLocked: {
    opacity: 0.9,
  },
  lockedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  lockedBadgeText: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.muted,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    padding: spacing.cardPadding,
    minHeight: sizes.touchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  chapterNumberBadge: {
    width: spacing.xl + spacing.sm,
    height: spacing.xl + spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  chapterNumber: {
    ...iosText('subhead'),
    fontWeight: '700',
    color: colors.dark.text,
  },
  chapterTitle: {
    flex: 1,
    ...iosText('headline'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  chapterArrow: {
    ...iosText('title3'),
    color: colors.dark.muted,
    marginLeft: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
  title: {
    ...iosText('title2'),
    color: colors.dark.text,
  },
});
