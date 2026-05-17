import { useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getGeneratedChapters } from '@/lib/chapterStorage';
import { useCatalogContext } from '@/components/common/CatalogProvider';
export default function SubjectDetailScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjects, chapters: chaptersData, loading } = useCatalogContext();
  const [generatedChapters, setGeneratedChapters] = useState<typeof chaptersData>([]);

  useFocusEffect(
    useCallback(() => {
      getGeneratedChapters().then(setGeneratedChapters);
    }, [])
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
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
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
        {allChapters.map((chapter, index) => (
            <Pressable
              key={chapter.id}
              onPress={() => router.push(`/chapter/${chapter.id}/theory`)}
              style={({ pressed }) => [
                styles.chapterPressable,
                pressed && styles.chapterPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Capitol ${index + 1}: ${chapter.title}`}
            >
              <GlassCard dark intensity={14} style={styles.chapterCard}>
                <View style={styles.chapterNumberBadge}>
                  <Text style={styles.chapterNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterArrow}>→</Text>
              </GlassCard>
            </Pressable>
        ))}
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
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.contentBottom,
  },
  backRow: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: typography.size.md,
    color: colors.dark.secondary,
    fontWeight: '600',
  },
  subjectName: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  subjectMeta: {
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  programNote: {
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  generateBtn: { marginBottom: spacing.md },
  generateBtnPressed: { opacity: 0.9 },
  generateBtnInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  generateBtnText: { fontSize: typography.size.md, fontWeight: '600', color: '#4ade80' },
  chapterList: {
    gap: spacing.sm,
  },
  chapterPressable: {},
  chapterPressed: {
    opacity: 0.85,
  },
  chapterLocked: {
    opacity: 0.9,
  },
  lockedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  lockedBadgeText: {
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    fontWeight: '600',
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  chapterNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  chapterNumber: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.dark.text,
  },
  chapterTitle: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.dark.text,
  },
  chapterArrow: {
    fontSize: typography.size.lg,
    color: colors.dark.muted,
    marginLeft: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.dark.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
