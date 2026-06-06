import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.screenPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Înapoi</Text>
      </Pressable>
      <Text style={styles.title}>Schimbă premii</Text>
      <Text style={styles.subtitle}>Folosește monedele câștigate din quiz-uri și teste</Text>

      <GlassCard dark intensity={18} style={styles.card}>
        <Text style={styles.placeholderTitle}>În curând</Text>
        <Text style={styles.placeholder}>
          Catalogul de premii este în pregătire. Monedele tale rămân salvate în cont.
        </Text>
      </GlassCard>
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
    paddingBottom: spacing.contentBottom,
  },
  back: {
    marginBottom: spacing.fieldGap,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    ...iosText('headline'),
    color: colors.dark.primary,
    textAlign: 'left',
  },
  title: {
    ...iosText('title2'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  subtitle: {
    marginTop: spacing.xs,
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
  card: {
    marginTop: spacing.sectionGap,
    padding: spacing.cardPadding,
  },
  placeholderTitle: {
    ...iosText('headline'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  placeholder: {
    marginTop: spacing.sm,
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
});
