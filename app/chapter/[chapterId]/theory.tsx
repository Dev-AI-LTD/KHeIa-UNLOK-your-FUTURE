import { useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getGeneratedChapters, getGeneratedTheory } from '@/lib/chapterStorage';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { buildTheorySections } from '@/services/chapterAudio.utils';
import { useChapterAudio } from '@/hooks/useChapterAudio';
import { isTtsAvailable } from '@/services/tts.client';

const chapterTheoryData = require('../../../assets/offline-data/chaptertheory.json') as Array<{
  chapter_id: string;
  section_contents: string[];
}>;

export default function ChapterTheoryScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chapters: chaptersData, chapterDetails: chapterDetailsData, loading } = useCatalogContext();
  const [generatedChapters, setGeneratedChapters] = useState<typeof chaptersData>([]);
  const [generatedTheory, setGeneratedTheoryState] = useState<string[] | null>(null);
  const { progress, isActive, isPaused, error, startListening, togglePause, stop } =
    useChapterAudio();
  useFocusEffect(
    useCallback(() => {
      getGeneratedChapters().then(setGeneratedChapters);
      if (chapterId) getGeneratedTheory(chapterId).then(setGeneratedTheoryState);
    }, [chapterId])
  );

  const chapter =
    chaptersData.find((c) => c.id === chapterId) ??
    generatedChapters.find((c) => c.id === chapterId);

  const details = chapterDetailsData.find((d) => d.chapter_id === chapterId);
  const theoryEntry = chapterTheoryData.find((t) => t.chapter_id === chapterId);
  const sectionContents =
    generatedTheory ?? theoryEntry?.section_contents ?? [];
  const sections = details?.sections ?? [];
  const keypoints = details?.keypoints ?? [];
  const hasFullChapter = sectionContents.length > 0;
  const listenableSections = buildTheorySections(sectionContents, sections);
  const canListen = listenableSections.length > 0;

  const handleListen = async () => {
    if (!chapterId || !canListen) return;
    if (!isTtsAvailable()) {
      Alert.alert(
        'Indisponibil',
        'Configurează Supabase sau EXPO_PUBLIC_NODE_BACKEND_URL pentru ascultare.',
      );
      return;
    }
    await startListening(chapterId, listenableSections);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={16}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Capitol negăsit</Text>
      </View>
    );
  }

  const playerBarBottom = insets.bottom + spacing.contentBottom;

  return (
    <View style={styles.screenWrap}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: isActive ? playerBarBottom + 88 : spacing.contentBottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/home');
          }
        }}
        style={styles.backRow}
        hitSlop={24}
      >
        <Text style={styles.backText}>← Înapoi</Text>
      </Pressable>

      <Text style={styles.screenTitle}>Teorie</Text>
      <Text style={styles.chapterTitle}>{chapter.title}</Text>

      <Pressable
        onPress={() => router.push(`/chapter/${chapterId}/generate-theory`)}
        style={({ pressed }) => [styles.generateTheoryBtn, pressed && styles.generateTheoryBtnPressed]}
      >
        <GlassCard dark intensity={14} style={styles.generateTheoryBtnInner}>
          <Text style={styles.generateTheoryBtnText}>+ Generează teorie</Text>
        </GlassCard>
      </Pressable>

      {canListen ? (
        <Pressable
          onPress={isActive ? togglePause : handleListen}
          disabled={progress?.loading}
          style={({ pressed }) => [styles.listenBtn, pressed && styles.generateTheoryBtnPressed]}
        >
          <GlassCard dark intensity={14} style={styles.listenBtnInner}>
            {progress?.loading ? (
              <ActivityIndicator size="small" color="#a78bfa" />
            ) : (
              <Text style={styles.listenBtnText}>
                {isActive ? (isPaused ? '▶ Continuă ascultarea' : '⏸ Pauză') : '🔊 Ascultă teoria'}
              </Text>
            )}
          </GlassCard>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.audioError}>{error}</Text> : null}

      {hasFullChapter ? (
        sections.length > 0 ? (
          sections.map((sectionTitle, i) => (
            <GlassCard key={i} dark intensity={14} style={styles.blockCard}>
              <Text style={styles.sectionHeading}>{sectionTitle}</Text>
              <Text style={styles.blockText}>
                {sectionContents[i] ?? 'Conținut în pregătire.'}
              </Text>
            </GlassCard>
          ))
        ) : (
          sectionContents.map((text, i) => (
            <GlassCard key={i} dark intensity={14} style={styles.blockCard}>
              <Text style={styles.blockText}>{text}</Text>
            </GlassCard>
          ))
        )
      ) : (
        <>
          {sections.length > 0 ? (
            sections.map((sectionTitle, i) => (
              <GlassCard key={i} dark intensity={14} style={styles.blockCard}>
                <Text style={styles.sectionHeading}>{sectionTitle}</Text>
                <Text style={styles.blockText}>
                  Materialul detaliat pentru această secțiune va fi adăugat în curând.
                  {keypoints.length > 0 ? ` Puncte cheie: ${keypoints.join(', ')}.` : ''}
                </Text>
              </GlassCard>
            ))
          ) : null}
          {keypoints.length > 0 && (
            <GlassCard dark intensity={14} style={styles.blockCard}>
              <Text style={styles.blockLabel}>Puncte cheie</Text>
              {keypoints.map((k, i) => (
                <View key={i} style={styles.keypointRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.keypointText}>{k}</Text>
                </View>
              ))}
            </GlassCard>
          )}
        </>
      )}

      <Pressable
        onPress={() => router.push(`/chapter/${chapterId}/quiz`)}
        style={({ pressed }) => [styles.quizButton, pressed && styles.doneButtonPressed]}
      >
        <GlassCard dark intensity={14} style={styles.quizButtonInner}>
          <Text style={styles.quizButtonText}>Quiz – Verifică cunoștințele</Text>
        </GlassCard>
      </Pressable>
    </ScrollView>

    {isActive ? (
      <View style={[styles.playerBar, { bottom: playerBarBottom }]}>
        <GlassCard dark intensity={18} style={styles.playerBarInner}>
          <Text style={styles.playerBarLabel}>
            {progress?.loading
              ? `Se pregătește secțiunea ${(progress.sectionIndex ?? 0) + 1}…`
              : `Secțiunea ${(progress?.sectionIndex ?? 0) + 1} din ${progress?.totalSections ?? '—'}`}
          </Text>
          <View style={styles.playerControls}>
            <Pressable onPress={togglePause} style={styles.playerControlBtn}>
              <Text style={styles.playerControlText}>{isPaused ? '▶' : '⏸'}</Text>
            </Pressable>
            <Pressable onPress={() => void stop()} style={styles.playerControlBtn}>
              <Text style={styles.playerControlText}>■</Text>
            </Pressable>
          </View>
        </GlassCard>
      </View>
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.contentBottom,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backRow: {
    marginBottom: spacing.sm,
  },
  backText: {
    fontSize: 28,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  screenTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  generateTheoryBtn: { marginBottom: spacing.md },
  generateTheoryBtnPressed: { opacity: 0.9 },
  generateTheoryBtnInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  generateTheoryBtnText: { fontSize: typography.size.md, fontWeight: '600', color: '#60a5fa' },
  listenBtn: { marginBottom: spacing.md },
  listenBtnInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(139, 92, 246, 0.28)',
    borderColor: 'rgba(167, 139, 250, 0.55)',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  listenBtnText: { fontSize: typography.size.md, fontWeight: '700', color: '#c4b5fd' },
  audioError: {
    color: '#f87171',
    fontSize: typography.size.sm,
    marginBottom: spacing.md,
  },
  playerBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  playerBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
  },
  playerBarLabel: {
    flex: 1,
    fontSize: typography.size.sm,
    color: '#e9d5ff',
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  playerControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  playerControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
  },
  playerControlText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  chapterTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.lg,
  },
  blockCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.md,
  },
  blockLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.sm,
  },
  blockText: {
    fontSize: typography.size.md,
    color: '#ffffff',
    lineHeight: 22,
  },
  keypointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  bullet: {
    color: 'rgba(255,255,255,0.8)',
    marginRight: spacing.sm,
    fontSize: typography.size.md,
  },
  keypointText: {
    flex: 1,
    fontSize: typography.size.md,
    color: '#ffffff',
  },
  quizButton: { marginTop: spacing.lg },
  quizButtonInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    alignItems: 'center',
  },
  quizButtonText: { fontSize: typography.size.md, fontWeight: '700', color: '#4ade80' },
  doneButtonPressed: {
    opacity: 0.9,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.dark.text,
  },
  paywallCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: 14,
  },
  paywallEmoji: { fontSize: 48, marginBottom: spacing.md },
  paywallTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  paywallMessage: {
    fontSize: typography.size.md,
    color: colors.dark.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  paywallButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.6)',
  },
  paywallButtonPressed: { opacity: 0.9 },
  paywallButtonText: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: '#4ade80',
  },
});
