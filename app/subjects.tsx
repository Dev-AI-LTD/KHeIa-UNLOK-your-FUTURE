import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radius, sizes, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCatalogContext } from '@/components/common/CatalogProvider';

const EXAM_TITLES: Record<string, string> = {
  EN: 'Evaluare Națională',
  BAC: 'Bacalaureat',
};

function getSubjectIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('rom')) return '📚';
  if (lower.includes('mat')) return '🧮';
  if (lower.includes('istor')) return '🏺';
  if (lower.includes('fiz')) return '⚡';
  if (lower.includes('chim')) return '🧪';
  if (lower.includes('biol') || lower.includes('anatom')) return '🧬';
  if (lower.includes('informatic')) return '💻';
  if (lower.includes('geograf')) return '🗺️';
  if (lower.includes('logic')) return '🧩';
  if (lower.includes('psiholog')) return '🧠';
  if (lower.includes('econom')) return '💰';
  if (lower.includes('sociolog')) return '👥';
  if (lower.includes('filosof')) return '💭';
  return '📘';
}

function formatTags(subject: { level: string; exam_tags: string[] }): string {
  const tags = subject.exam_tags ?? [];
  const exam = tags.includes('BAC') ? 'BAC' : 'EN';
  const profiles = tags.filter((tag) => tag === 'real' || tag === 'uman');
  const profile = profiles.length > 0 ? profiles.join('/') : undefined;
  return [exam, profile, subject.level].filter(Boolean).join(' · ');
}

export default function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { exam } = useLocalSearchParams<{ exam: string }>();
  const { subjects, loading } = useCatalogContext();

  const examKey = (exam === 'EN' || exam === 'BAC' ? exam : 'EN') as 'EN' | 'BAC';
  const title = EXAM_TITLES[examKey] ?? 'Materii';
  const examSubjects = subjects.filter((s) => (s.exam_tags ?? []).includes(examKey));

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.screenPadding }]}>
      <Pressable
        onPress={() => router.back()}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Înapoi"
      >
        <Text style={styles.backText}>← Înapoi</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Alege o materie pentru a accesa lecțiile și quiz-urile.</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.contentBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.subjectGrid}>
          {examSubjects.map((subject) => (
            <Pressable
              key={subject.id}
              onPress={() => router.push(`/subject/${subject.id}`)}
              style={({ pressed }) => [styles.subjectCardWrap, pressed && styles.subjectCardPressed]}
            >
              <GlassCard dark intensity={18} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectIcon}>{getSubjectIcon(subject.name)}</Text>
                  <View style={styles.subjectText}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {subject.name}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {formatTags(subject)}
                    </Text>
                  </View>
                  <Text style={styles.subjectArrow}>→</Text>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </View>
        {examSubjects.length === 0 && (
          <Text style={styles.empty}>Nu există materii pentru acest examen.</Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.fieldGap,
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
    justifyContent: 'center',
  },
  backText: {
    ...iosText('headline'),
    color: colors.dark.primary,
    textAlign: 'left',
  },
  title: {
    ...iosText('title2'),
    color: colors.dark.text,
    marginHorizontal: spacing.screenPadding,
    textAlign: 'left',
  },
  subtitle: {
    ...iosText('body'),
    color: colors.dark.muted,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.xs,
    marginBottom: spacing.sectionGap,
    textAlign: 'left',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.fieldGap,
  },
  subjectCardWrap: {
    width: '48%',
    flexGrow: 0,
    minHeight: sizes.touchTarget,
  },
  subjectCardPressed: {
    opacity: 0.9,
  },
  subjectCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.cardPadding,
    borderRadius: radius.md,
    flex: 1,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    ...iosText('caption1'),
    marginRight: spacing.sm,
  },
  subjectText: {
    flex: 1,
  },
  cardTitle: {
    ...iosText('headline'),
    fontWeight: '700',
    color: colors.dark.text,
    textAlign: 'left',
  },
  cardMeta: {
    marginTop: spacing.xs,
    ...iosText('subhead'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
  subjectArrow: {
    ...iosText('title3'),
    color: colors.dark.muted,
  },
  empty: {
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'left',
    marginTop: spacing.sectionGap,
  },
});
