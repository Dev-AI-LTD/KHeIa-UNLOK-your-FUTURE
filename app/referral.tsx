import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, sizes, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getOrCreateProfile, buildReferralShareMessage, getReferredCount } from '@/services/referral.service';
import { supabase } from '@/services/supabase';

export default function ReferralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referredCount, setReferredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const profile = await getOrCreateProfile(user.id);
    setReferralCode(profile?.referral_code ?? null);
    const count = await getReferredCount(user.id);
    setReferredCount(count);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const handleShare = async () => {
    if (!referralCode) return;
    setSharing(true);
    try {
      const message = buildReferralShareMessage(referralCode);
      const result = await Share.share({
        message,
        title: 'Invită un coleg pe KHEYA',
      });
      if (result.action === Share.sharedAction) {
        // Shared successfully
      }
    } catch (err) {
      Alert.alert('Eroare', 'Nu s-a putut deschide meniul de partajare.');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.screenPadding, paddingBottom: insets.bottom + spacing.contentBottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Invită colegii</Text>
        <Text style={styles.subtitle}>
          Share codul tău și ajută-i pe prieteni să se pregătească pentru Evaluare Națională
          2026 și BAC. Ei deblochează un capitol nou, tu câștigi!
        </Text>
      </View>

      {referralCode ? (
        <>
          <GlassCard dark intensity={18} style={styles.card}>
            <Text style={styles.cardLabel}>Codul tău de invitație</Text>
            <Text style={styles.code}>{referralCode}</Text>
          </GlassCard>

          <Pressable
            onPress={handleShare}
            disabled={sharing}
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
          >
            <GlassCard dark intensity={18} style={styles.shareBtnInner}>
              <Text style={styles.shareBtnText}>
                {sharing ? 'Se deschide...' : 'Share codul'}
              </Text>
            </GlassCard>
          </Pressable>

          <Text style={styles.hint}>
            Prietenii tăi introduc codul la înregistrare. La 5 invitații primești bonus XP și monede!
          </Text>
          {referredCount > 0 && (
            <Text style={styles.referralCount}>
              Ai invitat {referredCount} {referredCount === 1 ? 'persoană' : 'persoane'}.
              {referredCount >= 5 ? ' Ai deblocat bonusul de referral!' : ` Mai ai nevoie de ${5 - referredCount} invitații pentru bonus.`}
            </Text>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Autentifică-te pentru cod de invitație</Text>
          <Text style={styles.emptySubtitle}>
            Conectează-te pentru a primi un cod unic pe care îl poți partaja cu colegii.
          </Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.authBtn, pressed && styles.authBtnPressed]}
          >
            <GlassCard dark intensity={18} style={styles.authBtnInner}>
              <Text style={styles.authBtnText}>Autentificare</Text>
            </GlassCard>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
      >
        <Text style={styles.backBtnText}>← Înapoi</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  header: {
    marginBottom: spacing.sectionGap,
  },
  title: {
    ...iosText('title2'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  subtitle: {
    marginTop: spacing.fieldGap,
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
  card: {
    padding: spacing.cardPadding,
    alignItems: 'flex-start',
    marginBottom: spacing.sectionGap,
    borderRadius: radius.lg,
  },
  cardLabel: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  code: {
    ...iosText('largeTitle'),
    letterSpacing: spacing.xs,
    color: colors.dark.primary,
    textAlign: 'left',
  },
  shareBtn: {
    marginBottom: spacing.fieldGap,
    minHeight: sizes.touchTarget,
  },
  shareBtnPressed: {
    opacity: 0.9,
  },
  shareBtnInner: {
    padding: spacing.cardPadding,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    borderRadius: radius.md,
  },
  shareBtnText: {
    ...iosText('headline'),
    fontWeight: '700',
    color: '#22C55E',
    textAlign: 'left',
  },
  hint: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    textAlign: 'left',
    marginBottom: spacing.sm,
  },
  referralCount: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.primary,
    textAlign: 'left',
    marginBottom: spacing.sectionGap,
  },
  emptyState: {
    padding: spacing.sectionGap,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  emptySubtitle: {
    marginTop: spacing.fieldGap,
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'left',
    marginBottom: spacing.sectionGap,
  },
  authBtn: {
    marginTop: spacing.fieldGap,
    minHeight: sizes.touchTarget,
    alignSelf: 'stretch',
  },
  authBtnPressed: {
    opacity: 0.9,
  },
  authBtnInner: {
    padding: spacing.cardPadding,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: radius.md,
  },
  authBtnText: {
    ...iosText('headline'),
    fontWeight: '700',
    color: '#60a5fa',
    textAlign: 'left',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
    justifyContent: 'center',
    marginTop: spacing.sectionGap,
  },
  backBtnPressed: {
    opacity: 0.9,
  },
  backBtnText: {
    ...iosText('headline'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
});
