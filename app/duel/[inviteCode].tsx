import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/services/supabase';
import { isValidInviteCode, joinDuelByCode } from '@/services/duel.service';

export default function DuelJoinScreen() {
  const { inviteCode } = useLocalSearchParams<{ inviteCode: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!inviteCode) {
        setStatus('error');
        setMessage('Cod lipsă.');
        return;
      }
      if (!isValidInviteCode(inviteCode)) {
        setStatus('error');
        setMessage('Cod invalid.');
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        setStatus('error');
        setMessage('Autentifică-te pentru a intra în duel.');
        return;
      }
      const result = await joinDuelByCode(user.id, inviteCode);
      if (result.success && result.sessionId) {
        setStatus('success');
        setMessage('Te-ai alăturat duelului!');
        setTimeout(() => router.replace('/(tabs)'), 1500);
      } else {
        setStatus('error');
        setMessage(result.error ?? 'Eroare la conectare.');
      }
    };
    run();
  }, [inviteCode, router]);

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <ActivityIndicator size="large" color={colors.dark.primary} />
      )}
      {status === 'success' && (
        <GlassCard dark intensity={18} style={styles.card}>
          <Text style={styles.title}>Duel acceptat!</Text>
          <Text style={styles.subtitle}>{message}</Text>
        </GlassCard>
      )}
      {status === 'error' && (
        <GlassCard dark intensity={18} style={styles.card}>
          <Text style={styles.title}>Eroare</Text>
          <Text style={styles.subtitle}>{message}</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>← Înapoi</Text>
          </Pressable>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    padding: spacing.xl,
    minWidth: 280,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.dark.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.dark.muted,
    marginBottom: spacing.lg,
  },
  btn: {
    padding: spacing.md,
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.9 },
  btnText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.dark.secondary,
  },
});
