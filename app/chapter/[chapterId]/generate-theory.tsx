import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, typography, ios } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getGeneratedChapters, setGeneratedTheory } from '@/lib/chapterStorage';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { generateTheory } from '@/services/generator.service';

export default function GenerateTheoryScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chapters: chaptersData } = useCatalogContext();
  const [generating, setGenerating] = useState(false);
  const [generatedChapters, setGeneratedChapters] = useState<typeof chaptersData>([]);

  useFocusEffect(
    useCallback(() => {
      getGeneratedChapters().then(setGeneratedChapters);
    }, [])
  );

  const chapter =
    chaptersData.find((c) => c.id === chapterId) ??
    generatedChapters.find((c) => c.id === chapterId);

  const handleGenerate = async () => {
    if (!chapterId) return;
    setGenerating(true);
    try {
      const { data, error } = await generateTheory(chapterId, chapter?.title);
      if (error) {
        const msg =
          error.message?.includes('non-2xx') || error.message?.includes('status code')
            ? 'Serviciul de generare nu este disponibil. Verifică conexiunea sau încearcă mai târziu.'
            : error.message ?? 'Nu s-a putut genera teoria.';
        Alert.alert('Eroare', msg);
        return;
      }
      const payload = data as { source?: string; content?: string } | null;
      if (payload?.source === 'error') {
        Alert.alert('Eroare', payload.content ?? 'Nu s-a putut genera teoria.');
        return;
      }
      const content = payload?.content?.trim();
      if (content) {
        await setGeneratedTheory(chapterId, [content]);
      }
      router.replace(`/chapter/${chapterId}/theory`);
    } catch (e) {
      Alert.alert('Eroare', e instanceof Error ? e.message : 'Eroare neașteptată.');
    } finally {
      setGenerating(false);
    }
  };

  if (!chapter) {
    return (
      <View style={[styles.container, styles.notFoundContent, { paddingTop: insets.top + spacing.screenPadding }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          style={styles.backRow}
          hitSlop={24}
        >
          <Text style={styles.backText}>← Înapoi</Text>
        </Pressable>
        <Text style={styles.title}>Capitol negăsit</Text>
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
        onPress={() => router.replace(`/chapter/${chapterId}/theory`)}
        style={styles.backRow}
        hitSlop={24}
      >
        <Text style={styles.backText}>← Înapoi</Text>
      </Pressable>

      <Text style={styles.screenTitle}>Generează teorie</Text>
      <Text style={styles.chapterTitle}>{chapter.title}</Text>

      <GlassCard dark intensity={14} style={styles.infoCard}>
        <Text style={styles.infoText}>
          KHEYA poate genera teoria pentru acest capitol. După generare, teoria va apărea în secțiunile
          capitolului (ex. Genuri, Specii).
        </Text>
      </GlassCard>

      <Pressable
        onPress={handleGenerate}
        disabled={generating}
        style={({ pressed }) => [styles.generateBtn, pressed && styles.generateBtnPressed]}
      >
        <GlassCard dark intensity={14} style={styles.generateBtnInner}>
          <Text style={styles.generateBtnText}>
            {generating ? 'Se generează...' : 'Generează teorie'}
          </Text>
        </GlassCard>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  notFoundContent: {
    paddingHorizontal: spacing.screenPadding,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.contentBottom,
  },
  backRow: {
    marginBottom: spacing.fieldGap,
    minHeight: ios.layout.minTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'left',
  },
  screenTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  chapterTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.sectionGap,
    textAlign: 'left',
  },
  infoCard: {
    padding: spacing.cardPadding,
    marginBottom: spacing.sectionGap,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: ios.radius.md,
  },
  infoText: {
    fontSize: typography.size.md,
    color: '#ffffff',
    lineHeight: 22,
    textAlign: 'left',
  },
  generateBtn: { marginBottom: spacing.fieldGap, minHeight: ios.layout.minTarget },
  generateBtnPressed: { opacity: 0.9 },
  generateBtnInner: {
    padding: spacing.cardPadding,
    minHeight: ios.layout.minTarget,
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: ios.radius.md,
  },
  generateBtnText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: '#60a5fa',
    textAlign: 'left',
  },
});
