import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme';
import { supabase } from '@/services/supabase';

/**
 * Deep-link target after Kinde OAuth (kheia://kinde_callback).
 * Kinde SDK handles the URL; we wait for Supabase session then go home.
 */
export default function KindeCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const goHome = () => {
      if (cancelled) return;
      InteractionManager.runAfterInteractions(() => {
        if (!cancelled) {
          router.replace('/(tabs)/home');
        }
      });
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        goHome();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        goHome();
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.dark.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
