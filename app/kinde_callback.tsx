import { useCallback, useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  InteractionManager,
  Text,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useKindeAuth } from '@kinde/expo';
import { colors, spacing, iosText } from '@/theme';
import { supabase } from '@/services/supabase';
import { bridgeKindeToSupabase } from '@/services/auth.service';

const CALLBACK_TIMEOUT_MS = 15_000;

/**
 * Deep-link target after Kinde OAuth (kheia://kinde_callback).
 * Waits for Supabase session; on timeout offers retry or return to login.
 */
export default function KindeCallbackScreen() {
  const router = useRouter();
  const kinde = useKindeAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const goHome = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      router.replace('/(tabs)/home');
    });
  }, [router]);

  const tryBridge = useCallback(async () => {
    setRetrying(true);
    setTimedOut(false);
    try {
      const token = await kinde.getAccessToken();
      if (token) {
        const { error } = await bridgeKindeToSupabase(token);
        if (!error) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            goHome();
            return;
          }
        }
      }
      setTimedOut(true);
    } catch {
      setTimedOut(true);
    } finally {
      setRetrying(false);
    }
  }, [kinde, goHome]);

  useEffect(() => {
    let cancelled = false;

    const onSession = () => {
      if (!cancelled) goHome();
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) onSession();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) onSession();
    });

    const timeout = setTimeout(() => {
      if (!cancelled) setTimedOut(true);
    }, CALLBACK_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      authListener.subscription.unsubscribe();
    };
  }, [goHome]);

  if (timedOut && !retrying) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Autentificarea durează prea mult</Text>
        <Text style={styles.subtitle}>
          Verifică conexiunea la internet și încearcă din nou.
        </Text>
        <Pressable
          onPress={() => void tryBridge()}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Încearcă din nou</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonSecondaryText}>Înapoi la autentificare</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.dark.primary} />
      <Text style={styles.loadingLabel}>
        {retrying ? 'Se reconectează...' : 'Se finalizează autentificarea...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  loadingLabel: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginTop: spacing.md,
  },
  title: {
    ...iosText('title3'),
    color: colors.dark.text,
    textAlign: 'center',
  },
  subtitle: {
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.dark.primary,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonSecondary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...iosText('headline'),
    color: '#fff',
  },
  buttonSecondaryText: {
    ...iosText('headline'),
    color: colors.dark.primary,
  },
});
