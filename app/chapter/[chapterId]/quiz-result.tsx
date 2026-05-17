import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { colors, spacing, radius, sizes, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/services/supabase';
import { onQuizFinished } from '@/services/progress-events.service';
import { buildProgressCertificateShareText } from '@/services/gamification.service';
import { monitorPerformance } from '@/services/quiz.service';
import { useSubscription } from '@/hooks/useSubscription';
import {
  isRevenueCatConfigured,
  presentPaywallIfNeeded,
} from '@/services/purchases.service';

const TOTAL_QUESTIONS = 10;

export default function ChapterQuizResultScreen() {
  const { chapterId, correctCount, chapterTitle, fromFreeQuiz } = useLocalSearchParams<{
    chapterId: string;
    correctCount?: string;
    chapterTitle?: string;
    fromFreeQuiz?: string;
  }>();
  const router = useRouter();
  const [conciergeMessage, setConciergeMessage] = useState<string | null>(null);
  const [bonusCoins, setBonusCoins] = useState<number | null>(null);
  const [suggestedChapter, setSuggestedChapter] = useState<{ chapterId: string; title: string } | null>(null);
  const [showDiscountOffer, setShowDiscountOffer] = useState(false);
  const { isPremium, refreshAfterPurchase } = useSubscription();
  const showUpgradeCta =
    (fromFreeQuiz === 'true' || showDiscountOffer) && !isPremium;

  useEffect(() => {
    if (!chapterId || !correctCount) return;

    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const correct = Math.max(0, parseInt(correctCount ?? '0', 10));
      await onQuizFinished(user.id, chapterId, correct);

      const perf = await monitorPerformance(user.id, chapterId);
      if (perf.needsEncouragement && perf.message) {
        setConciergeMessage(perf.message);
        if (perf.unlockedResource?.type === 'coins') {
          setBonusCoins(perf.unlockedResource.amount);
        }
        if (perf.suggestedChapter) {
          setSuggestedChapter(perf.suggestedChapter);
        }
        if (perf.offerDiscount24h) {
          setShowDiscountOffer(true);
        }
      }
    };

    run();
  }, [chapterId, correctCount]);

  const correct = Math.min(TOTAL_QUESTIONS, Math.max(0, parseInt(correctCount ?? '0', 10)));
  const coins = 5 + correct;
  const xpGained = correct * 10;

  const handleUpgrade = async () => {
    if (!isRevenueCatConfigured()) {
      return;
    }
    const { result } = await presentPaywallIfNeeded();
    if (result === 'PURCHASED' || result === 'RESTORED') {
      await refreshAfterPurchase();
    }
  };

  const handleShareCertificate = async () => {
    const message = buildProgressCertificateShareText(
      correct,
      TOTAL_QUESTIONS,
      chapterTitle || undefined
    );
    await Share.share({
      message,
      title: 'Rezultatul meu pe KHEYA',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rezultat quiz</Text>
      <Text style={styles.score}>
        {correct} / {TOTAL_QUESTIONS} răspunsuri corecte
      </Text>
      <Text style={styles.coins}>+{coins} monede</Text>
      <Text style={styles.xp}>+{xpGained} XP</Text>

      {conciergeMessage && (
        <GlassCard dark intensity={18} style={styles.conciergeCard}>
          <Text style={styles.conciergeTitle}>Încurajare</Text>
          <Text style={styles.conciergeText}>{conciergeMessage}</Text>
          {bonusCoins != null && (
            <Text style={styles.conciergeBonus}>+{bonusCoins} monede bonus</Text>
          )}
          {suggestedChapter && (
            <Pressable
              onPress={() => router.push(`/chapter/${suggestedChapter.chapterId}/theory`)}
              style={({ pressed }) => [styles.suggestedBtn, pressed && styles.buttonPressed]}
            >
              <Text style={styles.suggestedBtnText}>
                Încearcă: {suggestedChapter.title} →
              </Text>
            </Pressable>
          )}
        </GlassCard>
      )}

      {showUpgradeCta ? (
        <Pressable
          onPress={() => void handleUpgrade()}
          style={({ pressed }) => [styles.paywallBtn, pressed && styles.buttonPressed]}
        >
          <GlassCard dark intensity={18} style={styles.paywallBtnInner}>
            <Text style={styles.paywallBtnText}>
              Deblochează 10 întrebări și acces complet
            </Text>
          </GlassCard>
        </Pressable>
      ) : null}

      <Pressable
        onPress={handleShareCertificate}
        style={({ pressed }) => [styles.shareBtn, pressed && styles.buttonPressed]}
      >
        <GlassCard dark intensity={18} style={styles.shareBtnInner}>
          <Text style={styles.shareBtnText}>Share certificatul de progres</Text>
        </GlassCard>
      </Pressable>

      <Pressable
        onPress={() => router.push('/referral')}
        style={({ pressed }) => [styles.ctaBtn, pressed && styles.buttonPressed]}
      >
        <GlassCard dark intensity={18} style={styles.ctaBtnInner}>
          <Text style={styles.ctaBtnText}>
            Invită 5 colegi și primește bonus XP și monede!
          </Text>
        </GlassCard>
      </Pressable>

      <Pressable
        onPress={() => router.replace(`/chapter/${chapterId}/theory`)}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>← Înapoi la teorie</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.lg,
    backgroundColor: 'transparent',
  },
  title: {
    ...iosText('title2'),
    color: colors.dark.text,
  },
  score: {
    marginTop: spacing.md,
    ...iosText('title3'),
    color: colors.dark.text,
  },
  coins: {
    marginTop: spacing.sm,
    ...iosText('headline'),
    color: colors.dark.primary,
  },
  xp: {
    marginTop: spacing.xs,
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.muted,
  },
  conciergeCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: radius.lg,
  },
  conciergeTitle: {
    ...iosText('headline'),
    fontWeight: '700',
    color: colors.dark.secondary,
    marginBottom: spacing.sm,
  },
  conciergeText: {
    ...iosText('subhead'),
    color: colors.dark.text,
  },
  conciergeBonus: {
    marginTop: spacing.sm,
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.primary,
  },
  suggestedBtn: {
    marginTop: spacing.md,
    padding: spacing.sm,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  suggestedBtnText: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.secondary,
  },
  shareBtn: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    minHeight: sizes.touchTarget,
  },
  shareBtnInner: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: 'rgba(34, 211, 238, 0.4)',
    borderRadius: radius.md,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  shareBtnText: {
    ...iosText('headline'),
    color: colors.dark.secondary,
  },
  paywallBtn: {
    marginBottom: spacing.sm,
    minHeight: sizes.touchTarget,
  },
  paywallBtnInner: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    borderRadius: radius.md,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  paywallBtnText: {
    ...iosText('headline'),
    fontWeight: '700',
    color: '#60a5fa',
  },
  ctaBtn: {
    marginBottom: spacing.md,
    minHeight: sizes.touchTarget,
  },
  ctaBtnInner: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    borderRadius: radius.md,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  ctaBtnText: {
    ...iosText('headline'),
    fontWeight: '700',
    color: '#22C55E',
  },
  button: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    ...iosText('headline'),
    color: colors.dark.secondary,
  },
});
