import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { getGeneratedChapters } from '@/lib/chapterStorage';
import { getOfficialExamTests } from '@/services/official-tests.service';
import { getOnboardingExam } from '@/lib/onboardingStorage';
import type { ExamType } from '@/types/tests';

const YEARS = [2026, 2025, 2024, 2023, 2022];

export default function TestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjects, chapters: chaptersData, loading } = useCatalogContext();
  const [generatedChapters, setGeneratedChapters] = useState<typeof chaptersData>([]);
  const [mode, setMode] = useState<'GENERATED' | 'OFFICIAL'>('GENERATED');
  const [examType, setExamType] = useState<ExamType>('EN');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      getGeneratedChapters().then(setGeneratedChapters);
    }, [])
  );

  useEffect(() => {
    getOnboardingExam().then((exam) => {
      if (exam) setExamType(exam);
    });
  }, []);

  const published = [
    ...chaptersData.filter((c) => c.published),
    ...generatedChapters,
  ];
  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? '';

  const enSubjects = subjects.filter((s) => (s.exam_tags ?? []).includes('EN'));
  const bacSubjects = subjects.filter((s) => (s.exam_tags ?? []).includes('BAC'));

  const subjectsForExam = useMemo(
    () => (examType === 'EN' ? enSubjects : bacSubjects),
    [examType, enSubjects, bacSubjects]
  );

  const officialTests = useMemo(
    () => getOfficialExamTests({ examType, year, subjectId }),
    [examType, year, subjectId]
  );

  const handleTestPress = useCallback(
    (targetTestId: string) => {
      router.push(`/test/${targetTestId}`);
    },
    [router]
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Teste</Text>
      <Text style={styles.subtitle}>
        Quiz-uri pentru capitole și simulări EN/BAC conform programei.
      </Text>

      <GlassCard dark intensity={18} style={styles.sectionCard}>
        <View style={styles.segmented}>
          <Pressable
            onPress={() => setMode('GENERATED')}
            style={[styles.segment, mode === 'GENERATED' && styles.segmentActive]}
          >
            <Text
              style={[styles.segmentText, mode === 'GENERATED' && styles.segmentTextActive]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Teste KHEYA
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('OFFICIAL')}
            style={[styles.segment, mode === 'OFFICIAL' && styles.segmentActive]}
          >
            <Text
              style={[styles.segmentText, mode === 'OFFICIAL' && styles.segmentTextActive]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Teste oficiale EN/BAC
            </Text>
          </Pressable>
        </View>
      </GlassCard>

      {mode === 'GENERATED' && (
        <>
          <GlassCard dark intensity={18} style={styles.sectionCard}>
            <Pressable
              onPress={() => router.push('/generator/generate-quiz')}
              style={({ pressed }) => [styles.generateRow, pressed && styles.cardPressed]}
            >
              <View style={styles.generateCardTextWrap}>
                <Text style={styles.generateCardTitle} numberOfLines={1} ellipsizeMode="tail">
                  + Generează quiz și teste
                </Text>
                <Text style={styles.generateCardMeta} numberOfLines={1} ellipsizeMode="tail">
                  Quiz-uri capitole, teste EN și BAC
                </Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </Pressable>
          </GlassCard>

          <GlassCard dark intensity={18} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quiz-uri capitole</Text>
            <Text style={styles.sectionDesc}>Întrebări din fiecare capitol</Text>
            {published.length === 0 ? (
              <Text style={styles.emptyText}>
                Nu există încă capitole. Generează un quiz din butonul de mai sus sau alege o materie și deschide capitole.
              </Text>
            ) : (
              <View style={styles.list}>
                {published.map((ch) => (
                  <Pressable
                    key={ch.id}
                    onPress={() => router.push(`/chapter/${ch.id}/quiz`)}
                    style={({ pressed }) => [styles.itemRow, pressed && styles.cardPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Quiz capitol ${ch.title}`}
                  >
                    <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                      {ch.title}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1} ellipsizeMode="tail">
                      {getSubjectName(ch.subject_id)}
                    </Text>
                    <Text style={styles.cardArrow}>→</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </GlassCard>

          <GlassCard dark intensity={18} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Evaluare Națională</Text>
            <Text style={styles.sectionDesc}>Simulări conform programei și formei de examen</Text>
            <View style={styles.list}>
              {enSubjects.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => handleTestPress(`en-${s.id}`)}
                  style={({ pressed }) => [styles.itemRow, pressed && styles.cardPressed]}
                >
                  <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                    Test EN · {s.name}
                  </Text>
                  <Text style={styles.cardMeta}>Simulare completă</Text>
                  <Text style={styles.cardArrow}>→</Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>

          <GlassCard dark intensity={18} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bacalaureat</Text>
            <Text style={styles.sectionDesc}>Simulări conform programei și formei de examen</Text>
            <View style={styles.list}>
              {bacSubjects.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => handleTestPress(`bac-${s.id}`)}
                  style={({ pressed }) => [styles.itemRow, pressed && styles.cardPressed]}
                >
                  <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                    Test BAC · {s.name}
                  </Text>
                  <Text style={styles.cardMeta}>Simulare completă</Text>
                  <Text style={styles.cardArrow}>→</Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>
        </>
      )}

      {mode === 'OFFICIAL' && (
        <GlassCard dark intensity={18} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Examen</Text>
          <View style={styles.filterRow}>
            <Pressable
              onPress={() => setExamType('EN')}
              style={[styles.chip, examType === 'EN' && styles.chipActive]}
            >
              <Text style={[styles.chipText, examType === 'EN' && styles.chipTextActive]}>
                EN
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setExamType('BAC')}
              style={[styles.chip, examType === 'BAC' && styles.chipActive]}
            >
              <Text style={[styles.chipText, examType === 'BAC' && styles.chipTextActive]}>
                BAC
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>An</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            <Pressable
              onPress={() => setYear(undefined)}
              style={[styles.chip, year === undefined && styles.chipActive]}
            >
              <Text style={[styles.chipText, year === undefined && styles.chipTextActive]}>
                Toate
              </Text>
            </Pressable>
            {YEARS.map((y) => (
              <Pressable
                key={y}
                onPress={() => setYear(y)}
                style={[styles.chip, year === y && styles.chipActive]}
              >
                <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Materie</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            <Pressable
              onPress={() => setSubjectId(undefined)}
              style={[styles.chip, subjectId === undefined && styles.chipActive]}
            >
              <Text style={[styles.chipText, subjectId === undefined && styles.chipTextActive]}>
                Toate
              </Text>
            </Pressable>
            {subjectsForExam.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSubjectId(s.id)}
                style={[styles.chip, subjectId === s.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Teste oficiale</Text>
          {officialTests.length === 0 ? (
            <>
              <Text style={styles.emptyText}>
                Nu există teste oficiale pentru filtrele selectate. Încearcă „Toate” la An și Materie, sau alege EN/BAC cu Română sau Matematică.
              </Text>
              <Pressable
                onPress={() => setMode('GENERATED')}
                style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
              >
                <Text style={styles.emptyCtaText}>→ Mergi la Teste KHEYA (simulări)</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.list}>
              {officialTests.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => handleTestPress(t.id)}
                  style={({ pressed }) => [styles.itemRow, pressed && styles.cardPressed]}
                >
                  <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                    {t.title}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1} ellipsizeMode="tail">
                    {t.examType} · {t.year} · {getSubjectName(t.subjectId)}
                  </Text>
                  <Text style={styles.cardArrow}>→</Text>
                </Pressable>
              ))}
            </View>
          )}
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.contentBottom },
  title: { fontSize: typography.size.xl, fontWeight: '700', color: '#ffffff', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.lg },
  sectionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    width: '100%',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: spacing.tight,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  segmentActive: {
    backgroundColor: colors.dark.primary,
  },
  segmentText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.dark.muted,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#fff',
  },
  generateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  generateCardTextWrap: { flex: 1, minWidth: 0 },
  generateCardTitle: { fontSize: typography.size.md, fontWeight: '700', color: '#ffffff' },
  generateCardMeta: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  sectionTitle: { fontSize: typography.size.lg, fontWeight: '700', color: '#ffffff', marginTop: spacing.lg, marginBottom: spacing.xs },
  sectionDesc: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.75)', marginBottom: spacing.sm },
  list: { gap: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  cardPressed: { opacity: 0.9 },
  cardTitle: { flex: 1, fontSize: typography.size.md, fontWeight: '600', color: '#ffffff' },
  cardMeta: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.75)', marginRight: spacing.sm },
  cardArrow: { fontSize: typography.size.lg, color: 'rgba(255,255,255,0.7)' },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  chipsScroll: { marginBottom: spacing.md },
  chipsContent: { paddingRight: spacing.lg },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  chipText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.dark.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.dark.muted,
    lineHeight: 22,
  },
  emptyCta: { marginTop: spacing.lg, padding: spacing.md, alignItems: 'center' },
  emptyCtaPressed: { opacity: 0.9 },
  emptyCtaText: { fontSize: typography.size.md, fontWeight: '600', color: '#60a5fa' },
});