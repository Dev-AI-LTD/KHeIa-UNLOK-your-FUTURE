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
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getOrCreateProfile, buildReferralShareMessage, getReferredCount } from '@/services/referral.service';
import { supabase } from '@/services/supabase';

export default function ReferralScreen() {
  const router = useRouter();
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
    padding: spacing.lg,
    paddingBottom: spacing.contentBottom ?? spacing.xl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.dark.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.size.md,
    color: colors.dark.muted,
    lineHeight: 22,
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardLabel: {
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    marginBottom: spacing.sm,
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    color: colors.dark.primary,
  },
  shareBtn: {
    marginBottom: spacing.md,
  },
  shareBtnPressed: {
    opacity: 0.9,
  },
  shareBtnInner: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  shareBtnText: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: '#22C55E',
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  referralCount: {
    fontSize: typography.size.sm,
    color: colors.dark.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '600',
    color: colors.dark.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: spacing.sm,
    fontSize: typography.size.md,
    color: colors.dark.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  authBtn: {
    marginTop: spacing.sm,
  },
  authBtnPressed: {
    opacity: 0.9,
  },
  authBtnInner: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  authBtnText: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: '#60a5fa',
  },
  backBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backBtnPressed: {
    opacity: 0.9,
  },
  backBtnText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.dark.muted,
  },
});
