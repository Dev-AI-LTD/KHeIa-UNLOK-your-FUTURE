import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ImageBackground,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { getOfficialExamTests } from '@/services/official-tests.service';
import type { TestSourceType } from '@/types/tests';
import { supabase } from '@/services/supabase';
import { canUserStartTest } from '@/services/test.service';
import { FREE_TESTS_LIMIT } from '@/services/subscription.service';
import { isRevenueCatConfigured, presentPaywall } from '@/services/purchases.service';
import { refreshSubscriptionAfterPurchase } from '@/services/subscription.service';

const logoBg = require('../../assets/kheia beckground.png');
const YEARS = [2026, 2025, 2024, 2023, 2022];

export default function GenerateQuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjects } = useCatalogContext();
  const [sourceType, setSourceType] = useState<TestSourceType>('GENERATED');
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);

  const enSubjects = subjects.filter((s) => (s.exam_tags ?? []).includes('EN'));
  const bacSubjects = subjects.filter((s) => (s.exam_tags ?? []).includes('BAC'));

  const subjectsForSource = useMemo(() => {
    if (sourceType === 'OFFICIAL_EN') return enSubjects;
    if (sourceType === 'OFFICIAL_BAC') return bacSubjects;
    return [...enSubjects, ...bacSubjects];
  }, [sourceType, enSubjects, bacSubjects]);

  useEffect(() => {
    if (subjectId && !subjectsForSource.some((s) => s.id === subjectId)) {
      setSubjectId(undefined);
    }
  }, [sourceType, subjectId, subjectsForSource]);

  const handleGenerateTest = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      Alert.alert('Autentificare', 'Conectează-te pentru a începe un test.');
      router.push('/(auth)/login');
      return;
    }
    const allowed = await canUserStartTest(user.id);
    if (!allowed) {
      Alert.alert(
        'KHEYA Pro',
        `Planul gratuit include ${FREE_TESTS_LIMIT} test. Deblochează KHEYA Pro pentru teste nelimitate.`,
        [
          { text: 'Anulare', style: 'cancel' },
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

    if (sourceType === 'GENERATED') {
      if (!subjectId) {
        Alert.alert('Selectează materia', 'Alege o materie pentru test.');
        return;
      }
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) return;
      const examType = (subject.exam_tags ?? []).includes('BAC') ? 'bac' : 'en';
      router.push(`/test/${examType}-${subjectId}`);
      return;
    }

    if (sourceType === 'OFFICIAL_EN' || sourceType === 'OFFICIAL_BAC') {
      if (!subjectId) {
        Alert.alert('Selectează materia', 'Alege o materie pentru testul oficial.');
        return;
      }
      const examType = sourceType === 'OFFICIAL_EN' ? 'EN' : 'BAC';
      const candidates = getOfficialExamTests({ examType, year, subjectId });

      if (!candidates.length) {
        Alert.alert(
          'Nu există teste',
          'Nu există încă teste oficiale pentru această combinație. Încearcă alt an sau altă materie.'
        );
        return;
      }

      const official = candidates[Math.floor(Math.random() * candidates.length)];
      router.push(`/test/${official.id}`);
    }
  };

  return (
    <ImageBackground
      source={logoBg}
      style={styles.background}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={16}>
          <Text style={styles.backText}>← Înapoi</Text>
        </Pressable>

        <Text style={styles.title}>Generează test</Text>
        <Text style={styles.subtitle}>
          Alege sursa, materia și generează un test.
        </Text>

        <Text style={styles.label}>Sursă</Text>
        <View style={styles.chipsRow}>
          <Pressable
            onPress={() => setSourceType('GENERATED')}
            style={[styles.chip, sourceType === 'GENERATED' && styles.chipActive]}
          >
            <Text style={[styles.chipText, sourceType === 'GENERATED' && styles.chipTextActive]}>
              Test KHEYA
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSourceType('OFFICIAL_EN')}
            style={[styles.chip, sourceType === 'OFFICIAL_EN' && styles.chipActive]}
          >
            <Text style={[styles.chipText, sourceType === 'OFFICIAL_EN' && styles.chipTextActive]}>
              Oficial EN
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSourceType('OFFICIAL_BAC')}
            style={[styles.chip, sourceType === 'OFFICIAL_BAC' && styles.chipActive]}
          >
            <Text style={[styles.chipText, sourceType === 'OFFICIAL_BAC' && styles.chipTextActive]}>
              Oficial BAC
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Materie</Text>
        <View style={styles.chipsRow}>
          {subjectsForSource.map((s) => (
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
        </View>

        {(sourceType === 'OFFICIAL_EN' || sourceType === 'OFFICIAL_BAC') && (
          <>
            <Text style={styles.label}>An (opțional)</Text>
            <View style={styles.chipsRow}>
              <Pressable
                onPress={() => setYear(undefined)}
                style={[styles.chip, year === undefined && styles.chipActive]}
              >
                <Text style={[styles.chipText, year === undefined && styles.chipTextActive]}>
                  Oricare
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
            </View>
          </>
        )}

        <Pressable
          onPress={handleGenerateTest}
          style={({ pressed }) => [styles.generateBtn, pressed && styles.generateBtnPressed]}
        >
          <GlassCard dark intensity={18} style={styles.generateBtnInner}>
            <Text style={styles.generateBtnText}>Generează test</Text>
          </GlassCard>
        </Pressable>

        <Pressable
          onPress={() => router.push({ pathname: '/select-chapter', params: { for: 'quiz' } })}
          style={({ pressed }) => [styles.quizLink, pressed && styles.quizLinkPressed]}
        >
          <Text style={styles.quizLinkText}>Sau: Quiz la capitol →</Text>
        </Pressable>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  backgroundImage: { opacity: 0.85 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
  },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.contentBottom },
  backRow: { marginBottom: spacing.md },
  backText: { fontSize: typography.size.md, fontWeight: '600', color: colors.dark.secondary },
  title: { fontSize: typography.size.xl, fontWeight: '700', color: '#ffffff', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.lg },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.dark.muted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
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
  generateBtn: { marginTop: spacing.xl },
  generateBtnPressed: { opacity: 0.9 },
  generateBtnInner: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  generateBtnText: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: '#60a5fa',
  },
  quizLink: { marginTop: spacing.lg, alignItems: 'center' },
  quizLinkPressed: { opacity: 0.8 },
  quizLinkText: {
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    fontWeight: '600',
  },
});
