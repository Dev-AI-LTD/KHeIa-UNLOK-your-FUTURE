import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useKindeAuth } from '@kinde/expo';
import { supabase } from '@/services/supabase';
import { restoreSupabaseFromKinde } from '@/services/auth.service';

export default function Index() {
  const kinde = useKindeAuth();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveSession = async () => {
      if (kinde.isLoading) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        if (!cancelled) {
          setHasSession(true);
          setReady(true);
        }
        return;
      }

      if (kinde.isAuthenticated) {
        const restored = await restoreSupabaseFromKinde(kinde.getAccessToken);
        if (!cancelled) {
          setHasSession(restored);
          setReady(true);
        }
        return;
      }

      if (!cancelled) {
        setHasSession(false);
        setReady(true);
      }
    };

    resolveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setHasSession(!!session);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [kinde.isLoading, kinde.isAuthenticated, kinde.getAccessToken]);

  if (!ready || kinde.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#60a5fa" />
      </View>
    );
  }

  if (!hasSession) {
    return <Redirect href="/login" />;
  }

  // Redirect to the Tabs group; Tabs layout controls initial route (home).
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
