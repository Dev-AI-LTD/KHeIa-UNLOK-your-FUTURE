import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography } from '@/theme';
import { ConfettiOverlay } from '@/components/ui/ConfettiOverlay';

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Lunar',
  yearly: 'Anual',
  lifetime: 'Pro pe viață',
  full_edumat: 'Pro pe viață',
};

export default function SubscriptionSuccessScreen() {
  // Keep expiration param for backward compatibility with existing deep links
  const { plan, expiration } = useLocalSearchParams<{ plan: string; expiration?: string }>();
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    // We no longer update the database from the client.
    // The RevenueCat Webhook handles the update.
    // We just show the success animation.
    setDone(true);
    const timer = setTimeout(() => router.replace('/(tabs)'), 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      {done && <ConfettiOverlay />}
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.emoji}>
          🎉
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={styles.title}>
          Felicitări!
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(600).duration(500)} style={styles.subtitle}>
          {`Ai activat KHEYA ${PLAN_LABELS[plan ?? ''] ?? 'Premium'}. Accesul complet este deblocat!`}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(800).duration(500)} style={styles.note}>
          (Poate dura câteva minute pentru activare)
        </Animated.Text>
      </Animated.View>
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
  content: { alignItems: 'center', padding: spacing.xl },
  emoji: { fontSize: 80, marginBottom: spacing.lg },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: '700',
    color: colors.dark.text,
  },
  subtitle: {
    marginTop: spacing.md,
    fontSize: typography.size.lg,
    color: colors.dark.muted,
    textAlign: 'center',
  },
  note: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.dark.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
