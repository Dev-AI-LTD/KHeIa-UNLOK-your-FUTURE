import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKindeAuth } from '@kinde/expo';
import { colors, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { bridgeKindeToSupabase } from '@/services/auth.service';
import { getKindeAuthOptions } from '@/lib/kindeConfig';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kinde = useKindeAuth();
  const [loading, setLoading] = useState(false);

  const finishAuth = async (accessToken: string | undefined) => {
    if (!accessToken) {
      Alert.alert('Eroare', 'Nu am primit token de la Kinde.');
      return;
    }
    const { error } = await bridgeKindeToSupabase(accessToken);
    if (error) {
      Alert.alert('Eroare', error.message);
      return;
    }

    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });

    router.replace('/(tabs)/home');
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await kinde.login(getKindeAuthOptions());
      await finishAuth(result.success ? result.accessToken : undefined);
    } catch (e) {
      Alert.alert('Eroare', e instanceof Error ? e.message : 'Autentificare eșuată');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const result = await kinde.register(getKindeAuthOptions());
      await finishAuth(result.success ? result.accessToken : undefined);
    } catch (e) {
      Alert.alert('Eroare', e instanceof Error ? e.message : 'Înregistrare eșuată');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.title}>KHEYA</Text>
      <Text style={styles.subtitle}>Autentificare securizată cu Kinde</Text>

      <GlassCard dark style={styles.card}>
        <Text style={styles.cardText}>
          Conectează-te pentru a salva progresul, XP și statisticile în cloud.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.dark.primary} style={styles.spinner} />
        ) : (
          <>
            <Pressable
              onPress={handleSignIn}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Autentificare"
            >
              <Text style={styles.primaryBtnText}>Autentificare</Text>
            </Pressable>

            <Pressable
              onPress={handleSignUp}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Creează cont"
            >
              <Text style={styles.secondaryBtnText}>Creează cont</Text>
            </Pressable>
          </>
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.dark.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardText: {
    fontSize: typography.size.md,
    color: colors.dark.muted,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  spinner: { marginVertical: spacing.lg },
  primaryBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.45)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.6)',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  btnPressed: { opacity: 0.9 },
  primaryBtnText: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: '#4ade80',
  },
  secondaryBtnText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: '#93c5fd',
  },
});
