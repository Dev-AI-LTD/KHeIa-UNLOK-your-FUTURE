import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  InteractionManager,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useKindeAuth } from '@kinde/expo';
import { colors, spacing, ios, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { IOSButton } from '@/components/ui/IOSButton';
import { bridgeKindeToSupabase, restoreSupabaseFromKinde } from '@/services/auth.service';
import { getKindeAuthOptions } from '@/lib/kindeConfig';
import { supabase } from '@/services/supabase';
import { getPrivacyPolicyUrl, getTermsUrl, openLegalUrl } from '@/lib/legalUrls';

const brandIcon = require('../../assets/KHEIA ICON.png');

const FEATURES = [
  {
    icon: 'cloud-upload-outline' as const,
    title: 'Progres în cloud',
    subtitle: 'Capitole, XP și streak sincronizate',
  },
  {
    icon: 'trophy-outline' as const,
    title: 'Gamificare',
    subtitle: 'Misiuni zilnice și recompense',
  },
  {
    icon: 'school-outline' as const,
    title: 'EN & Bacalaureat',
    subtitle: 'Teorie, quiz-uri și simulări',
  },
] as const;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kinde = useKindeAuth();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const tryRestore = async () => {
      if (kinde.isLoading) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        if (!cancelled) {
          setCheckingSession(false);
          router.replace('/(tabs)/home');
        }
        return;
      }

      if (kinde.isAuthenticated) {
        const restored = await restoreSupabaseFromKinde(kinde.getAccessToken);
        if (!cancelled) {
          setCheckingSession(false);
          if (restored) {
            router.replace('/(tabs)/home');
            return;
          }
        }
        return;
      }

      if (!cancelled) setCheckingSession(false);
    };

    tryRestore();

    return () => {
      cancelled = true;
    };
  }, [kinde.isLoading, kinde.isAuthenticated, kinde.getAccessToken, router]);

  const finishAuth = async (accessToken: string | undefined) => {
    if (!accessToken) {
      Alert.alert('Eroare', 'Nu am primit token de la autentificare.');
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

  if (checkingSession || kinde.isLoading) {
    return (
      <View style={[styles.scroll, styles.sessionCheck]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
        <Text style={styles.loadingText}>Se restaurează sesiunea...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + spacing.sectionGap,
          paddingBottom: insets.bottom + spacing.sectionGap,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandBlock}>
        <View style={styles.logoFrame}>
          <Image
            source={brandIcon}
            style={styles.logo}
            resizeMode="cover"
            accessibilityLabel="KHEYA"
          />
        </View>

        <Text style={styles.brandName}>KHEYA</Text>
        <Text style={styles.brandTagline}>Unlock Your Future</Text>
        <Text style={styles.brandDesc}>Antrenorul tău pentru Evaluare Națională și Bacalaureat</Text>

        <View style={styles.examBadges}>
          <View style={styles.examBadge}>
            <Text style={styles.examBadgeText}>EN 2026</Text>
          </View>
          <View style={[styles.examBadge, styles.examBadgeBac]}>
            <Text style={styles.examBadgeText}>BAC</Text>
          </View>
        </View>
      </View>

      <GlassCard dark intensity={16} style={styles.card}>
        <Text style={styles.cardHeading}>Intră în cont</Text>
        <Text style={styles.cardSubheading}>
          Conectează-te ca să salvezi progresul și să continui de unde ai rămas.
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map((item) => (
            <View key={item.title} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={item.icon} size={ios.icon.md} color="#4ade80" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.dark.primary} />
            <Text style={styles.loadingText}>Se deschide autentificarea...</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <IOSButton label="Autentificare" onPress={handleSignIn} variant="primary" />
            <IOSButton label="Creează cont gratuit" onPress={handleSignUp} variant="secondary" />
          </View>
        )}
      </GlassCard>

      <Text style={styles.footer}>Datele tale sunt protejate · autentificare securizată</Text>

      <View style={styles.legalLinks}>
        {getPrivacyPolicyUrl() ? (
          <Pressable
            onPress={() => {
              const url = getPrivacyPolicyUrl();
              if (!url) return;
              void openLegalUrl(url, 'politica de confidențialitate').catch((e: unknown) => {
                Alert.alert('Eroare', e instanceof Error ? e.message : 'Nu s-a putut deschide linkul.');
              });
            }}
            accessibilityRole="link"
            accessibilityLabel="Politica de confidențialitate"
          >
            <Text style={styles.legalLink}>Politica de confidențialitate</Text>
          </Pressable>
        ) : null}
        {getTermsUrl() ? (
          <Pressable
            onPress={() => {
              const url = getTermsUrl();
              if (!url) return;
              void openLegalUrl(url, 'termenii și condițiile').catch((e: unknown) => {
                Alert.alert('Eroare', e instanceof Error ? e.message : 'Nu s-a putut deschide linkul.');
              });
            }}
            accessibilityRole="link"
            accessibilityLabel="Termeni și condiții"
          >
            <Text style={styles.legalLink}>Termeni și condiții</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sessionCheck: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
    justifyContent: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.sectionGap,
  },
  logoFrame: {
    width: 160,
    height: 160,
    borderRadius: ios.radius.xl,
    marginBottom: spacing.fieldGap,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: '#020617',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    ...iosText('largeTitle'),
    color: '#ffffff',
    letterSpacing: 2,
  },
  brandTagline: {
    marginTop: spacing.xs,
    ...iosText('title3'),
    color: '#4ade80',
  },
  brandDesc: {
    marginTop: spacing.sm,
    ...iosText('subhead'),
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    paddingHorizontal: spacing.fieldGap,
  },
  examBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.fieldGap,
  },
  examBadge: {
    minHeight: ios.layout.minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderRadius: ios.radius.pill,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  examBadgeBac: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  examBadgeText: {
    ...iosText('footnote'),
    fontWeight: '700',
    color: '#f9fafb',
  },
  card: {
    padding: spacing.cardPadding,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    borderColor: 'rgba(148, 163, 184, 0.28)',
    gap: 0,
  },
  cardHeading: {
    ...iosText('title2'),
    color: colors.dark.text,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  cardSubheading: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.fieldGap,
    textAlign: 'left',
  },
  featureList: {
    gap: spacing.fieldGap,
    marginBottom: spacing.sectionGap,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: ios.layout.rowHeight,
  },
  featureIconWrap: {
    width: ios.layout.minTouchTarget,
    height: ios.layout.minTouchTarget,
    borderRadius: ios.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    ...iosText('headline'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  featureSubtitle: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginTop: 2,
    textAlign: 'left',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  loadingText: {
    ...iosText('subhead'),
    color: colors.dark.muted,
  },
  actions: {
    gap: spacing.fieldGap,
  },
  footer: {
    marginTop: spacing.sectionGap,
    ...iosText('caption1'),
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
  },
  legalLinks: {
    marginTop: spacing.fieldGap,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  legalLink: {
    ...iosText('caption1'),
    color: colors.dark.primary,
    textDecorationLine: 'underline',
  },
});
