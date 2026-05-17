import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getGeneratedChapters, addGeneratedChapter, setGeneratedTheory } from '@/lib/chapterStorage';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { createChapter } from '@/services/generator.service';
import {
  getExamTypeForSubject,
  getFrequentExamTopics,
} from '@/services/exam-topic-stats.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TUTORIAL_TEXT =
  'Caută în programă un capitol existent sau scrie tema unui capitol nou. Poți genera orice capitol pentru Bacalaureat sau Evaluare Națională.';

export default function GenerateChapterScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjects, chapters } = useCatalogContext();
  const [topic, setTopic] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const subject = subjects.find((s) => s.id === subjectId);

  const programSuggestions = useMemo(
    () =>
      chapters
        .filter((c) => c.subject_id === subjectId)
        .sort((a, b) => a.order - b.order)
        .map((c) => c.title),
    [chapters, subjectId],
  );

  const examFrequentTopics = useMemo(
    () => (subjectId ? getFrequentExamTopics(subjectId) : []),
    [subjectId],
  );

  const examType = getExamTypeForSubject(subject?.exam_tags);

  const filteredExamTopics = useMemo(() => {
    const q = topic.trim().toLowerCase();
    const list = examFrequentTopics.map((t) => t.topicTitle);
    if (!q) return list;
    return list.filter((title) => title.toLowerCase().includes(q));
  }, [examFrequentTopics, topic]);

  const filteredProgramSuggestions = useMemo(() => {
    const q = topic.trim().toLowerCase();
    const examSet = new Set(examFrequentTopics.map((t) => t.topicTitle.toLowerCase()));
    const base = programSuggestions.filter((title) => !examSet.has(title.toLowerCase()));
    if (!q) return base;
    return base.filter((title) => title.toLowerCase().includes(q));
  }, [programSuggestions, examFrequentTopics, topic]);

  const onGenerate = async () => {
    if (!topic.trim() || !subjectId) return;
    setSaving(true);
    try {
      const { data, error } = await createChapter(topic.trim(), subjectId, 'liceu');
      if (error) {
        const msg =
          error.message?.includes('non-2xx') || error.message?.includes('status code')
            ? 'Serviciul de generare nu este disponibil. Verifică conexiunea sau încearcă mai târziu.'
            : error.message ?? 'Nu s-a putut genera capitolul.';
        Alert.alert('Eroare', msg);
        return;
      }
      const payload = data as { source?: string; content?: string } | null;
      if (payload?.source === 'error') {
        Alert.alert('Eroare', payload.content ?? 'Nu s-a putut genera capitolul.');
        return;
      }
      const existing = await getGeneratedChapters();
      const order = Math.max(0, ...existing.filter((c) => c.subject_id === subjectId).map((c) => c.order)) + 1;
      const id = `gen-${subjectId}-${Date.now()}`;
      await addGeneratedChapter({
        id,
        subject_id: subjectId,
        title: topic.trim(),
        order,
        published: true,
      });
      const content = (payload as { content?: string })?.content?.trim();
      if (content) {
        await setGeneratedTheory(id, [content]);
      }
      router.back();
    } catch (e) {
      Alert.alert('Eroare', e instanceof Error ? e.message : 'Eroare neașteptată.');
    } finally {
      setSaving(false);
    }
  };

  const canGenerate = topic.trim().length > 0 && !saving;

  if (!subject) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={16}>
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
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={16}>
        <Text style={styles.backText}>← Înapoi</Text>
      </Pressable>

      <Text style={styles.title}>Generează capitol</Text>
      <Text style={styles.subtitle}>
        {subject.name} – Capitolele generate vor apărea local în lista de capitole.
      </Text>

      <GlassCard dark intensity={14} style={styles.tutorialCard}>
        <Text style={styles.tutorialIcon}>💡</Text>
        <Text style={styles.tutorialText}>{TUTORIAL_TEXT}</Text>
      </GlassCard>

      <Text style={styles.label}>Caută capitole</Text>
      <GlassCard dark intensity={14} style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder={
            examFrequentTopics[0]
              ? `Ex: ${examFrequentTopics[0].topicTitle}`
              : programSuggestions[0]
                ? `Ex: ${programSuggestions[0]}`
                : 'Caută în programă sau scrie tema unui capitol nou...'
          }
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={topic}
          onChangeText={setTopic}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
      </GlassCard>

      {(examFrequentTopics.length > 0 || programSuggestions.length > 0) && (
        <View style={styles.suggestionsSection}>
          {examFrequentTopics.length > 0 && (
            <>
              <Text style={styles.suggestionsLabel}>
                {topic.trim()
                  ? filteredExamTopics.length > 0
                    ? `Frecvent la ${examType ?? 'examen'} (${filteredExamTopics.length})`
                    : 'Niciun subiect frecvent găsit — poți genera o temă nouă'
                  : `Cele mai frecvente la ${examType ?? 'examen'} (2020–2025)`}
              </Text>
              {filteredExamTopics.length > 0 ? (
                <View style={styles.suggestionsGrid}>
                  {filteredExamTopics.map((title) => {
                    const stat = examFrequentTopics.find((t) => t.topicTitle === title);
                    return (
                      <Pressable
                        key={`exam-${title}`}
                        onPress={() => setTopic(title)}
                        style={({ pressed }) => [
                          styles.suggestionChip,
                          styles.suggestionChipExam,
                          pressed && styles.suggestionChipPressed,
                          topic === title && styles.suggestionChipActive,
                        ]}
                      >
                        <Text style={styles.suggestionChipText} numberOfLines={2}>
                          {title}
                        </Text>
                        {stat && !topic.trim() ? (
                          <Text style={styles.suggestionChipMeta} numberOfLines={1}>
                            ~{stat.appearances} subiecte · {stat.years[0]}–
                            {stat.years[stat.years.length - 1]}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </>
          )}

          {filteredProgramSuggestions.length > 0 && (
            <>
              <Text style={[styles.suggestionsLabel, examFrequentTopics.length > 0 && styles.suggestionsLabelSpaced]}>
                {topic.trim()
                  ? `Din programa ${subject.name} (${filteredProgramSuggestions.length})`
                  : `Sugestii din programa ${subject.name}`}
              </Text>
              <View style={styles.suggestionsGrid}>
                {filteredProgramSuggestions.map((title) => (
                  <Pressable
                    key={`prog-${title}`}
                    onPress={() => setTopic(title)}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      pressed && styles.suggestionChipPressed,
                      topic === title && styles.suggestionChipActive,
                    ]}
                  >
                    <Text style={styles.suggestionChipText} numberOfLines={2}>
                      {title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {topic.trim() &&
            filteredExamTopics.length === 0 &&
            filteredProgramSuggestions.length === 0 && (
              <Text style={styles.suggestionsEmpty}>
                Niciun capitol găsit — poți genera unul nou cu tema de mai sus
              </Text>
            )}
        </View>
      )}

      <Pressable
        onPress={onGenerate}
        disabled={!canGenerate}
        style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
      >
        <GlassCard dark intensity={18} style={styles.generateBtnInner}>
          <Text style={styles.generateBtnText}>{saving ? 'Se generează...' : 'Generează capitol'}</Text>
        </GlassCard>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.contentBottom },
  backRow: { marginBottom: spacing.md },
  backText: { fontSize: typography.size.md, fontWeight: '600', color: colors.dark.secondary },
  title: { fontSize: typography.size.xl, fontWeight: '700', color: '#ffffff', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.lg },
  tutorialCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  tutorialIcon: { fontSize: 20, marginRight: spacing.sm },
  tutorialText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 20,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: spacing.sm,
  },
  searchCard: {
    padding: spacing.lg,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: 20,
    marginBottom: spacing.lg,
    minHeight: SCREEN_HEIGHT * 0.42,
  },
  searchInput: {
    flex: 1,
    minHeight: SCREEN_HEIGHT * 0.34,
    fontSize: typography.size.lg,
    color: '#ffffff',
    padding: 0,
    lineHeight: 26,
  },
  suggestionsSection: { marginBottom: spacing.lg },
  suggestionsLabel: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.sm,
  },
  suggestionsLabelSpaced: {
    marginTop: spacing.lg,
  },
  suggestionsEmpty: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    maxWidth: '100%',
  },
  suggestionChipExam: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.45)',
  },
  suggestionChipMeta: {
    marginTop: 4,
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.65)',
  },
  suggestionChipPressed: { opacity: 0.9 },
  suggestionChipActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  suggestionChipText: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.95)',
  },
  generateBtn: { marginTop: spacing.md },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    alignItems: 'center',
  },
  generateBtnText: { fontSize: typography.size.md, fontWeight: '700', color: '#4ade80' },
});
