import { useState, useCallback, useEffect } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, sizes, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getGeneratedChapters, getGeneratedTheory } from '@/lib/chapterStorage';
import { useCatalogContext } from '@/components/common/CatalogProvider';
import { buildTheorySections } from '@/services/chapterAudio.utils';
import { useChapterAudio } from '@/hooks/useChapterAudio';
import { isTtsAvailable } from '@/services/tts.client';
import { useSubscription } from '@/hooks/useSubscription';
import {
  canAccessChapter,
  FREE_CHAPTERS_PER_SUBJECT,
} from '@/services/subscription.service';
import {
  formatTtsRemaining,
  getTtsRemainingSecondsToday,
  FREE_TTS_DAILY_SECONDS,
} from '@/services/ttsQuota.service';
import {
  hasProEntitlement,
  isRevenueCatConfigured,
  presentPaywall,
} from '@/services/purchases.service';

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
  const { status, isPremium, refreshAfterPurchase } = useSubscription();
  const { progress, isActive, isPaused, error, startListening, stopOrPause, togglePause, stop } =
    useChapterAudio();
  const [ttsRemainingSec, setTtsRemainingSec] = useState(FREE_TTS_DAILY_SECONDS);

  const refreshTtsQuota = useCallback(async (premiumOverride?: boolean) => {
    const premium = premiumOverride ?? isPremium;
    const remaining = await getTtsRemainingSecondsToday(premium);
    setTtsRemainingSec(remaining);
  }, [isPremium]);

  useEffect(() => {
    void refreshTtsQuota();
  }, [refreshTtsQuota]);

  const syncPremiumIfOwned = useCallback(async () => {
    if (!(await hasProEntitlement())) return;
    const status = await refreshAfterPurchase();
    await refreshTtsQuota(status.isPremium);
  }, [refreshAfterPurchase, refreshTtsQuota]);

  useFocusEffect(
    useCallback(() => {
      void refreshTtsQuota();
      void syncPremiumIfOwned();
    }, [refreshTtsQuota, syncPremiumIfOwned]),
  );

  const openPremiumPaywall = useCallback(async () => {
    if (!isRevenueCatConfigured()) {
      Alert.alert(
        'KHEYA Pro',
        'Abonamentele se activează prin Google Play. Configurează RevenueCat în .env și reconstruiește app-ul.',
      );
      return;
    }
    if (await hasProEntitlement()) {
      await syncPremiumIfOwned();
      Alert.alert('KHEYA Pro', 'Abonamentul tău este deja activ. Poți asculta teoria fără limită.');
      return;
    }
    const result = await presentPaywall();
    if (result === 'PURCHASED' || result === 'RESTORED') {
      const status = await refreshAfterPurchase();
      await refreshTtsQuota(status.isPremium);
    }
  }, [refreshAfterPurchase, refreshTtsQuota, syncPremiumIfOwned]);
  useFocusEffect(
    useCallback(() => {
      getGeneratedChapters().then(setGeneratedChapters);
      if (chapterId) getGeneratedTheory(chapterId).then(setGeneratedTheoryState);
    }, [chapterId])
  );

  const chapter =
    chaptersData.find((c) => c.id === chapterId) ??
    generatedChapters.find((c) => c.id === chapterId);

  useEffect(() => {
    if (!chapter || !status) return;
    const chapterOrder = chapter.order ?? 1;
    void (async () => {
      const allowed =
        isPremium ||
        (await hasProEntitlement()) ||
        canAccessChapter(chapter.subject_id, chapterOrder, status);
      if (allowed) return;
      Alert.alert(
        'KHEYA Pro',
        `Planul gratuit include primele ${FREE_CHAPTERS_PER_SUBJECT} capitole per materie. Deblochează KHEYA Pro pentru acces complet.`,
        [
          { text: 'Înapoi', onPress: () => router.back() },
          { text: 'Vezi abonamente', onPress: () => void openPremiumPaywall() },
        ],
      );
    })();
  }, [chapter, status, isPremium, router, openPremiumPaywall]);

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
    const premiumActive = isPremium || (await hasProEntitlement());
    if (!premiumActive && ttsRemainingSec <= 0) {
      Alert.alert(
        'Limită zilnică atinsă',
        'Planul gratuit include 5 minute de ascultare teorie pe zi. Treci la KHEYA Pro pentru audio nelimitat.',
        [
          { text: 'Anulare', style: 'cancel' },
          { text: 'Vezi abonamente', onPress: () => void openPremiumPaywall() },
        ],
      );
      return;
    }
    await startListening(chapterId, listenableSections, {
      isPremium: premiumActive,
      onQuotaExceeded: () => void openPremiumPaywall(),
    });
    void refreshTtsQuota();
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
          onPress={isActive ? stopOrPause : handleListen}
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

      {canListen && !isPremium ? (
        <Text style={styles.ttsQuotaHint}>
          Ascultare gratuită azi: {formatTtsRemaining(ttsRemainingSec)} / 5:00
          {ttsRemainingSec <= 0 ? ' — limită atinsă' : ''}
        </Text>
      ) : null}
      {canListen && isPremium ? (
        <Text style={styles.ttsQuotaHint}>KHEYA Pro — ascultare teorie nelimitată</Text>
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
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.contentBottom,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  backRow: {
    marginBottom: spacing.sm,
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    ...iosText('title2'),
    color: 'rgba(255,255,255,0.9)',
  },
  screenTitle: {
    ...iosText('footnote'),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  generateTheoryBtn: { marginBottom: spacing.md, minHeight: sizes.touchTarget },
  generateTheoryBtnPressed: { opacity: 0.9 },
  generateTheoryBtnInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  generateTheoryBtnText: { ...iosText('headline'), color: '#60a5fa' },
  listenBtn: { marginBottom: spacing.md, minHeight: sizes.touchTarget },
  listenBtnInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(139, 92, 246, 0.28)',
    borderColor: 'rgba(167, 139, 250, 0.55)',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  listenBtnText: { ...iosText('headline'), fontWeight: '700', color: '#c4b5fd' },
  ttsQuotaHint: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: 'rgba(233, 213, 255, 0.85)',
    marginBottom: spacing.sm,
  },
  audioError: {
    ...iosText('subhead'),
    color: '#f87171',
    marginBottom: spacing.md,
  },
  playerBar: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
  },
  playerBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
    borderWidth: 1,
    borderRadius: radius.lg,
    minHeight: sizes.touchTarget,
  },
  playerBarLabel: {
    flex: 1,
    ...iosText('subhead'),
    fontWeight: '600',
    color: '#e9d5ff',
    marginRight: spacing.sm,
  },
  playerControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  playerControlBtn: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
  },
  playerControlText: {
    ...iosText('headline'),
    fontWeight: '700',
    color: '#fff',
  },
  chapterTitle: {
    ...iosText('title2'),
    color: '#ffffff',
    marginBottom: spacing.lg,
  },
  blockCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  blockLabel: {
    ...iosText('footnote'),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    ...iosText('title3'),
    color: '#ffffff',
    marginBottom: spacing.sm,
  },
  blockText: {
    ...iosText('body'),
    color: '#ffffff',
  },
  keypointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  bullet: {
    ...iosText('body'),
    color: 'rgba(255,255,255,0.8)',
    marginRight: spacing.sm,
  },
  keypointText: {
    flex: 1,
    ...iosText('body'),
    color: '#ffffff',
  },
  quizButton: { marginTop: spacing.lg, minHeight: sizes.touchTarget },
  quizButtonInner: {
    padding: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    alignItems: 'center',
    borderRadius: radius.md,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    borderWidth: 1,
  },
  quizButtonText: { ...iosText('headline'), fontWeight: '700', color: '#4ade80' },
  doneButtonPressed: {
    opacity: 0.9,
  },
  title: {
    ...iosText('title2'),
    color: colors.dark.text,
  },
  paywallCard: {
    marginHorizontal: spacing.screenPadding,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: radius.lg,
  },
  paywallEmoji: { ...iosText('largeTitle'), fontSize: spacing.xxlSpace + spacing.lg, marginBottom: spacing.md },
  paywallTitle: {
    ...iosText('title3'),
    color: '#ffffff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  paywallMessage: {
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  paywallButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.6)',
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  paywallButtonPressed: { opacity: 0.9 },
  paywallButtonText: {
    ...iosText('headline'),
    fontWeight: '700',
    color: '#4ade80',
  },
});
