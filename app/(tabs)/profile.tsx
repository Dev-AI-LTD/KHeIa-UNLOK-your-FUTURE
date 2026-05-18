import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, ios, iosText, radius, sizes } from '@/theme';
import { IOSListRow } from '@/components/ui/IOSListRow';
import { IOSButton } from '@/components/ui/IOSButton';
import { useSkin } from '@/contexts/SkinContext';
import { SKINS, type SkinName } from '@/theme/skins';
import { useGamification } from '@/hooks/useGamification';
import { useProgress } from '@/hooks/useProgress';
import { StyledTabs, type TabItem } from '@/components/ui/StyledTabs';
import { GlassCard } from '@/components/ui/GlassCard';
import { XPBar } from '@/components/gamification/XPBar';
import { CoinsDisplay } from '@/components/gamification/CoinsDisplay';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { GDPR_TEXT, PRIVACY_POLICY_TEXT, TERMS_TEXT } from '@/content/legal';
import { useKindeAuth } from '@kinde/expo';
import { signOutSupabase, deleteAccount } from '@/services/auth.service';
import { getKindeAuthOptions } from '@/lib/kindeConfig';
import { getSchoolLeaderboard, type SchoolLeaderboard } from '@/services/gamification.service';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import {
  profileDisplayName,
  profileSubtitle,
  getUserProfile,
} from '@/services/profile.service';
import { useSubscription } from '@/hooks/useSubscription';
import {
  isRevenueCatConfigured,
  presentPaywall,
  presentCustomerCenter,
  type PaywallResult,
} from '@/services/purchases.service';

const PROFILE_TABS: TabItem[] = [
  { id: 'evolutie', label: 'Evoluție' },
  { id: 'clasament', label: 'Clasament' },
  { id: 'statistici', label: 'Statistici' },
  { id: 'plan', label: 'Plan studiu' },
  { id: 'setari', label: 'Setări' },
  { id: 'legal', label: 'Legal' },
];

const LEGAL_TABS: TabItem[] = [
  { id: 'confidentialitate', label: 'Politica de Confidențialitate' },
  { id: 'termini', label: 'Termeni și Condiții' },
  { id: 'gdpr', label: 'GDPR' },
];

const LEGAL_CONTENT: Record<string, string> = {
  gdpr: GDPR_TEXT,
  confidentialitate: PRIVACY_POLICY_TEXT,
  termini: TERMS_TEXT,
};

export default function ProfileScreen() {
  const router = useRouter();
  const kinde = useKindeAuth();
  const { skin, setSkin } = useSkin();
  const { coins, level, xpProgress, streak, loading: gamLoading, userId, refresh } =
    useGamification();
  const {
    stats,
    recommendedNext,
    subjectProgress,
    recentChapters,
    loading: progressLoading,
  } = useProgress();
  const {
    isPremium,
    planType,
    isCancelled,
    currentPeriodEnd,
    refreshAfterPurchase,
    refreshAfterCustomerCenter,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState('evolutie');
  const [legalTab, setLegalTab] = useState('confidentialitate');
  const [leaderboard, setLeaderboard] = useState<SchoolLeaderboard[]>([]);
  const [userSchool, setUserSchool] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const refreshLeaderboard = useCallback(() => {
    if (!userId) return;
    void Promise.all([getSchoolLeaderboard(10), getUserProfile(userId)]).then(
      ([data, profile]) => {
        setLeaderboard(data);
        const mine = data.flatMap((g) => g.entries).find((e) => e.user_id === userId);
        setUserSchool(mine?.school ?? profile?.school ?? null);
      },
    );
  }, [userId]);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  useFocusEffect(
    useCallback(() => {
      void refresh({ silent: true });
    }, [refresh])
  );

  const loading = gamLoading || progressLoading;
  const initial = userId ? 'U' : '?';

  const renderEvolutieTab = () => {
    if (!userId) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Autentifică-te pentru a vedea progresul</Text>
          <Text style={styles.emptySubtitle}>Progresul tău va fi sincronizat și salvat.</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.level}>Nivel {level}</Text>
            <XPBar progress={xpProgress} />
          </View>
        </View>

        <View style={styles.coinsRow}>
          <CoinsDisplay coins={coins} />
        </View>
        <View style={styles.streakRow}>
          <StreakCounter streak={streak} />
        </View>

        <Pressable
          onPress={() => router.push('/referral')}
          style={({ pressed }) => [styles.referralCard, pressed && styles.chapterRowPressed]}
        >
          <GlassCard dark intensity={18} style={styles.referralCardInner}>
            <Text style={styles.referralTitle}>Invită colegii</Text>
            <Text style={styles.referralSubtitle}>
              Share codul tău și deblochează capitol nou
            </Text>
            <Text style={styles.referralCta}>→ Deschide</Text>
          </GlassCard>
        </Pressable>

        <Pressable
          onPress={() => router.push('/rewards')}
          style={({ pressed }) => [styles.referralCard, pressed && styles.chapterRowPressed]}
        >
          <GlassCard dark intensity={18} style={styles.rewardsCardInner}>
            <Text style={styles.referralTitle}>Schimbă premii</Text>
            <Text style={styles.referralSubtitle}>
              Folosește monedele pentru premii. Va urma.
            </Text>
            <Text style={styles.referralCta}>→ Deschide</Text>
          </GlassCard>
        </Pressable>

        <GlassCard dark intensity={18} style={styles.card}>
          <Text style={styles.cardTitle}>Progres capitole</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {stats.completed} / {stats.totalChapters} completate
            </Text>
            <View style={styles.chartBarBg}>
              <View
                style={[styles.chartBarFill, { width: `${stats.completionRate * 100}%` }]}
              />
            </View>
          </View>
        </GlassCard>

        {recentChapters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ultimele capitoluri actualizate</Text>
            {recentChapters.map((ch) => (
              <Pressable
                key={ch.id}
                onPress={() => router.push(`/chapter/${ch.id}/theory`)}
                style={({ pressed }) => [styles.chapterRow, pressed && styles.chapterRowPressed]}
              >
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle} numberOfLines={1}>{ch.title}</Text>
                  <Text style={styles.chapterMeta}>{ch.subjectName} • {ch.status}</Text>
                </View>
                {ch.lastQuizScore != null && (
                  <Text style={styles.chapterScore}>{ch.lastQuizScore}%</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </>
    );
  };

  const renderClasamentTab = () => {
    if (!userId) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Autentifică-te pentru a vedea clasamentul</Text>
        </View>
      );
    }

    const sortedLeaderboard = userSchool
      ? [...leaderboard].sort((a, b) => {
          if (a.school === userSchool) return -1;
          if (b.school === userSchool) return 1;
          return 0;
        })
      : leaderboard;

    return (
      <View style={styles.section}>
        <ProfileEditor userId={userId} onSaved={refreshLeaderboard} />

        {leaderboard.length === 0 ? (
          <View style={styles.emptyStateInline}>
            <Text style={styles.emptySubtitle}>
              Completează școala și salvează profilul pentru a apărea în clasament alături de colegi.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Clasament pe școală</Text>
            <Text style={styles.sectionDesc}>
              Top XP în școala ta și din alte școli. Poziția ta e evidențiată.
            </Text>
            {sortedLeaderboard.map(({ school, entries }) => (
              <GlassCard key={school} dark intensity={18} style={styles.leaderboardCard}>
                <Text style={styles.leaderboardSchool}>{school}</Text>
                {entries.map((e) => {
                  const name = profileDisplayName(
                    {
                      id: e.user_id,
                      display_name: e.display_name,
                      school: e.school,
                      city: e.city,
                      study_year: e.study_year,
                      avatar_url: e.avatar_url,
                    },
                    e.user_id,
                  );
                  const meta = profileSubtitle({
                    id: e.user_id,
                    display_name: e.display_name,
                    school: e.school,
                    city: e.city,
                    study_year: e.study_year,
                    avatar_url: e.avatar_url,
                  });
                  const initial = name[0]?.toUpperCase() ?? 'E';

                  return (
                    <View
                      key={e.user_id}
                      style={[
                        styles.leaderboardRow,
                        e.user_id === userId && styles.leaderboardRowHighlight,
                      ]}
                    >
                      <Text style={styles.leaderboardRank}>#{e.rank}</Text>
                      {e.avatar_url ? (
                        <Image source={{ uri: e.avatar_url }} style={styles.leaderboardAvatar} />
                      ) : (
                        <View style={styles.leaderboardAvatarPlaceholder}>
                          <Text style={styles.leaderboardAvatarText}>{initial}</Text>
                        </View>
                      )}
                      <View style={styles.leaderboardInfo}>
                        <Text style={styles.leaderboardName} numberOfLines={1}>
                          {name}
                          {e.user_id === userId ? ' (tu)' : ''}
                        </Text>
                        {meta ? (
                          <Text style={styles.leaderboardMeta} numberOfLines={1}>
                            {meta}
                          </Text>
                        ) : null}
                        <Text style={styles.leaderboardXPInline}>{e.total_xp} XP • 🪙 {e.coins}</Text>
                      </View>
                    </View>
                  );
                })}
              </GlassCard>
            ))}
          </>
        )}
      </View>
    );
  };

  const renderStatisticiTab = () => {
    if (!userId) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Autentifică-te pentru a vedea statisticile</Text>
        </View>
      );
    }

    const remaining = stats.totalChapters - stats.completed;

    return (
      <>
        <GlassCard dark intensity={18} style={styles.card}>
          <Text style={styles.cardTitle}>Progres pe materie</Text>
          {subjectProgress.map((sp) => (
            <View key={sp.subject.id} style={styles.subjectProgressRow}>
              <Text style={styles.subjectLabel} numberOfLines={1}>{sp.subject.name}</Text>
              <View style={styles.subjectBarWrap}>
                <View style={styles.chartBarBg}>
                  <View
                    style={[styles.chartBarFill, { width: `${sp.rate * 100}%` }]}
                  />
                </View>
                <Text style={styles.subjectValue}>{Math.round(sp.rate * 100)}%</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        <GlassCard dark intensity={18} style={styles.card}>
          <Text style={styles.cardTitle}>Ce mai trebuie să înveți</Text>
          <Text style={styles.remainingCount}>{remaining} capitoluri rămase</Text>
          <View style={styles.breakdownSection}>
            {subjectProgress
              .filter((sp) => sp.completed < sp.total)
              .map((sp) => (
                <View key={sp.subject.id} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{sp.subject.name}</Text>
                  <Text style={styles.breakdownValue}>
                    {sp.total - sp.completed} restante
                  </Text>
                </View>
              ))}
          </View>
        </GlassCard>
      </>
    );
  };

  const renderPlanTab = () => {
    if (!userId) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Autentifică-te pentru planul de studiu</Text>
        </View>
      );
    }

    if (recommendedNext.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Felicitări!</Text>
          <Text style={styles.emptySubtitle}>
            Ai parcurs toate capitolele recomandate.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recomandări pentru tine</Text>
        <Text style={styles.planSubtitle}>Următoarele capitole</Text>
        {recommendedNext.map((ch) => (
          <Pressable
            key={ch.id}
            onPress={() => router.push(`/chapter/${ch.id}/theory`)}
            style={({ pressed }) => [styles.planCard, pressed && styles.chapterRowPressed]}
          >
            <GlassCard dark intensity={18} style={styles.planCardInner}>
              <Text style={styles.chapterTitle} numberOfLines={1}>{ch.title}</Text>
              <Text style={styles.chapterMeta}>{ch.subjectName}</Text>
              <Text style={styles.planArrow}>→ Începe</Text>
            </GlassCard>
          </Pressable>
        ))}
      </View>
    );
  };

  const handleSignOut = () => {
    Alert.alert('Deconectare', 'Sigur vrei să te deconectezi din cont?', [
      { text: 'Anulare', style: 'cancel' },
      {
        text: 'Deconectare',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutSupabase();
            await kinde.logout({ revokeToken: true, ...getKindeAuthOptions() });
          } catch {
            // navigăm la login chiar dacă logout Kinde eșuează parțial
          }
          router.replace('/login');
        },
      },
    ]);
  };

  const handlePaywallResult = async (result: PaywallResult) => {
    if (result === 'PURCHASED' || result === 'RESTORED') {
      await refreshAfterPurchase();
    }
  };

  const handleOpenPremium = async () => {
    if (!userId) {
      router.replace('/login');
      return;
    }
    if (!isRevenueCatConfigured()) {
      Alert.alert(
        'Indisponibil',
        __DEV__
          ? 'Adaugă EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE în .env și reconstruiește app-ul (npm run android).'
          : 'Plățile nu sunt disponibile în această versiune. Actualizează aplicația din Play Store sau contactează contact@kheya.ro.',
      );
      return;
    }
    const result = await presentPaywall();
    await handlePaywallResult(result);
  };

  const formatSubscriptionEndDate = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const handleManageSubscription = async () => {
    if (!userId) {
      router.replace('/login');
      return;
    }
    if (!isRevenueCatConfigured()) {
      Alert.alert('Indisponibil', 'RevenueCat nu este configurat pe acest build.');
      return;
    }
    const ccResult = await presentCustomerCenter();
    const status = await refreshAfterCustomerCenter();

    if (ccResult.action === 'RESTORED') {
      Alert.alert('Abonament restaurat', 'KHEYA Pro a fost restaurat cu succes.');
      return;
    }

    if (ccResult.action === 'CANCELLED' || status.isCancelled) {
      const endLabel = formatSubscriptionEndDate(status.currentPeriodEnd);
      Alert.alert(
        'Abonament anulat',
        endLabel
          ? `KHEYA Pro rămâne activ până la ${endLabel}. După această dată vei reveni automat la planul gratuit.`
          : 'Abonamentul a fost anulat. Vei reveni la planul gratuit la sfârșitul perioadei plătite.',
      );
      return;
    }

    if (!status.isPremium) {
      Alert.alert('Plan gratuit', 'Nu ai un abonament activ. Poți activa KHEYA Pro din secțiunea de mai sus.');
    }
  };

  const handleDeleteAccount = () => {
    if (!userId) return;
    Alert.alert(
      'Ștergere cont',
      'Toate datele tale (profil, progres, statistici) vor fi șterse definitiv. Conform GDPR, nu poți reveni după ștergere. Ești sigur?',
      [
        { text: 'Anulare', style: 'cancel' },
        {
          text: 'Continuă',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmă ștergerea',
              'Contul tău și toate datele asociate vor fi șterse permanent. Apasă „Șterge cont” pentru a confirma.',
              [
                { text: 'Anulare', style: 'cancel' },
                {
                  text: 'Șterge cont',
                  style: 'destructive',
                  onPress: async () => {
                    const { error } = await deleteAccount();
                    if (error) {
                      Alert.alert('Eroare', error.message ?? 'Ștergerea contului a eșuat. Încearcă din nou sau contactează contact@kheya.ro.');
                    } else {
                      await signOutSupabase();
                      await kinde.logout({ revokeToken: true, ...getKindeAuthOptions() });
                      router.replace('/login');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderSetariTab = () => (
    <View style={styles.skinSection}>
      <Text style={styles.settingsSectionTitle}>Cont</Text>
      {userId ? (
        <GlassCard dark intensity={14} style={styles.accountCard}>
          <IOSListRow
            title="Deconectare"
            subtitle="Ieși din cont pe acest dispozitiv"
            icon="log-out-outline"
            iconColor="#60a5fa"
            onPress={handleSignOut}
          />
          <View style={styles.accountDivider} />
          <IOSListRow
            title="Șterge cont"
            subtitle="Ștergere definitivă (GDPR)"
            icon="trash-outline"
            destructive
            onPress={handleDeleteAccount}
          />
        </GlassCard>
      ) : (
        <GlassCard dark intensity={14} style={styles.accountCardGuest}>
          <Text style={styles.accountGuestText}>Autentifică-te pentru a gestiona contul.</Text>
          <IOSButton label="Autentificare" onPress={() => router.replace('/login')} variant="primary" />
        </GlassCard>
      )}

      <Text style={[styles.settingsSectionTitle, { marginTop: spacing.sectionGap }]}>Abonament</Text>
      {userId ? (
        <GlassCard dark intensity={14} style={styles.accountCard}>
          <Text style={styles.premiumStatusText}>
            {isPremium
              ? isCancelled
                ? `KHEYA Pro — anulat${currentPeriodEnd ? `, activ până la ${formatSubscriptionEndDate(currentPeriodEnd)}` : ''}`
                : `KHEYA Pro activ${planType !== 'free' ? ` (${planType})` : ''}`
              : 'Plan gratuit — deblochează acces complet'}
          </Text>
          {isPremium && isCancelled ? (
            <Text style={styles.premiumCancelledHint}>
              Abonamentul nu se reînnoiește. Beneficiile Pro rămân până la data de expirare.
            </Text>
          ) : null}
          {!isPremium ? (
            <IOSButton
              label="Deblochează KHEYA Pro"
              onPress={() => void handleOpenPremium()}
              variant="primary"
              style={styles.premiumCta}
            />
          ) : null}
          <IOSButton
            label="Restaurare / Gestionează abonamentul"
            onPress={() => void handleManageSubscription()}
            variant="secondary"
            style={styles.premiumCta}
          />
        </GlassCard>
      ) : null}

      <Text style={[styles.skinTitle, { marginTop: spacing.sectionGap }]}>Temă / Skin</Text>
      <Text style={styles.skinSubtitle}>Alege fundalul aplicației</Text>
      <View style={styles.skinOptions}>
        {Object.values(SKINS).map((s) => {
          const isActive = skin === s.name;
          return (
            <Pressable
              key={s.name}
              onPress={() => setSkin(s.name)}
              style={[styles.skinOption, isActive && styles.skinOptionSelected]}
            >
              <View style={[styles.skinSwatch, { backgroundColor: s.primaryColor }]} />
              <Text style={styles.skinLabel}>{s.label}</Text>
              {isActive && (
                <View style={styles.skinBadge}>
                  <Text style={styles.skinBadgeText}>Activ</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderLegalTab = () => (
    <View style={styles.legalSection}>
      <StyledTabs tabs={LEGAL_TABS} activeId={legalTab} onChange={setLegalTab} fullWidth />
      <View style={styles.legalContent}>
        <Text style={styles.legalText}>{LEGAL_CONTENT[legalTab]}</Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'evolutie':
        return renderEvolutieTab();
      case 'clasament':
        return renderClasamentTab();
      case 'statistici':
        return renderStatisticiTab();
      case 'plan':
        return renderPlanTab();
      case 'setari':
        return renderSetariTab();
      case 'legal':
        return renderLegalTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerArea, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Evoluție, statistici și setări.</Text>
      </View>

      <StyledTabs tabs={PROFILE_TABS} activeId={activeTab} onChange={setActiveTab} />

      {loading ? (
        <View style={[styles.centered, { minHeight: 200 }]}>
          <ActivityIndicator size="large" color={colors.dark.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
          <View style={styles.bottom} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerArea: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.fieldGap,
  },
  title: {
    ...iosText('largeTitle'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  subtitle: {
    marginTop: spacing.xs,
    ...iosText('subhead'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sectionGap,
    paddingBottom: spacing.contentBottom,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    height: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.fieldGap,
  },
  avatar: {
    width: sizes.touchTarget + spacing.xs,
    height: sizes.touchTarget + spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...iosText('title2'),
    color: '#fff',
  },
  headerRight: {
    flex: 1,
    marginLeft: spacing.fieldGap,
  },
  level: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  coinsRow: {
    marginTop: spacing.sm,
  },
  streakRow: {
    marginTop: spacing.sm,
  },
  referralCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  referralCardInner: {
    padding: spacing.lg,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  referralTitle: {
    ...iosText('headline'),
    color: colors.dark.text,
  },
  referralSubtitle: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginTop: spacing.xs,
  },
  referralCta: {
    marginTop: spacing.sm,
    ...iosText('subhead'),
    fontWeight: '600',
    color: '#22C55E',
  },
  rewardsCardInner: {
    padding: spacing.lg,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  cardTitle: {
    ...iosText('headline'),
    color: colors.dark.text,
    marginBottom: spacing.fieldGap,
  },
  progressRow: {
    marginTop: spacing.xs,
  },
  progressLabel: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.xs,
  },
  chartBarBg: {
    flex: 1,
    height: spacing.sm + spacing.xs,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    backgroundColor: colors.dark.primary,
    borderRadius: radius.sm,
  },
  section: {
    marginTop: spacing.sectionGap,
  },
  sectionDesc: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.fieldGap,
  },
  leaderboardCard: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  leaderboardSchool: {
    ...iosText('headline'),
    color: colors.dark.text,
    marginBottom: spacing.sm,
  },
  emptyStateInline: {
    paddingVertical: spacing.md,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  leaderboardAvatar: {
    width: sizes.touchTarget - spacing.xs,
    height: sizes.touchTarget - spacing.xs,
    borderRadius: radius.pill,
  },
  leaderboardAvatarPlaceholder: {
    width: sizes.touchTarget - spacing.xs,
    height: sizes.touchTarget - spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardAvatarText: {
    ...iosText('body'),
    fontWeight: '700',
    color: colors.dark.primary,
  },
  leaderboardInfo: {
    flex: 1,
    minWidth: 0,
  },
  leaderboardName: {
    ...iosText('subhead'),
    fontWeight: '700',
    color: colors.dark.text,
  },
  leaderboardMeta: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginTop: spacing.xs / 2,
  },
  leaderboardXPInline: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  leaderboardRowHighlight: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    marginHorizontal: -spacing.md,
    marginVertical: -spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  leaderboardRank: {
    width: sizes.iconLg + spacing.sm,
    ...iosText('subhead'),
    fontWeight: '700',
    color: colors.dark.muted,
  },
  sectionTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    marginBottom: spacing.sm,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ios.layout.minTouchTarget,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  chapterRowPressed: {
    opacity: 0.9,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    ...iosText('body'),
    fontWeight: '600',
    color: colors.dark.text,
  },
  chapterMeta: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginTop: spacing.xs,
  },
  chapterScore: {
    ...iosText('body'),
    fontWeight: '700',
    color: colors.dark.primary,
  },
  emptyState: {
    padding: spacing.sectionGap,
    alignItems: 'center',
  },
  emptyTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: spacing.sm,
    ...iosText('body'),
    color: colors.dark.muted,
    textAlign: 'center',
  },
  subjectProgressRow: {
    marginBottom: spacing.md,
  },
  subjectLabel: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.xs,
  },
  subjectBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subjectValue: {
    width: sizes.touchTarget - spacing.xs,
    ...iosText('subhead'),
    fontWeight: '700',
    color: colors.dark.text,
    textAlign: 'right',
  },
  remainingCount: {
    ...iosText('title3'),
    color: colors.dark.text,
    marginBottom: spacing.fieldGap,
  },
  breakdownSection: {
    marginTop: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  breakdownLabel: {
    ...iosText('subhead'),
    color: colors.dark.text,
  },
  breakdownValue: {
    ...iosText('subhead'),
    color: colors.dark.muted,
  },
  planSubtitle: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.fieldGap,
  },
  planCard: {
    marginBottom: spacing.sm,
  },
  planCardInner: {
    padding: spacing.lg,
  },
  planArrow: {
    marginTop: spacing.sm,
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.primary,
  },
  skinSection: {
    marginTop: spacing.sm,
  },
  settingsSectionTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    marginBottom: spacing.fieldGap,
    textAlign: 'left',
  },
  premiumStatusText: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    padding: spacing.cardPadding,
    paddingBottom: spacing.sm,
  },
  premiumCancelledHint: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    paddingHorizontal: spacing.cardPadding,
    paddingBottom: spacing.sm,
    opacity: 0.9,
  },
  premiumCta: {
    marginHorizontal: spacing.cardPadding,
    marginBottom: spacing.sm,
  },
  accountCard: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  accountCardGuest: {
    padding: spacing.cardPadding,
    gap: spacing.fieldGap,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  accountDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    marginHorizontal: spacing.cardPadding,
  },
  accountGuestText: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
  skinTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  skinSubtitle: {
    marginTop: spacing.xs,
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.fieldGap,
    textAlign: 'left',
  },
  skinOptions: {
    gap: spacing.sm,
  },
  skinOption: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ios.layout.minTouchTarget,
    padding: spacing.cardPadding,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    marginBottom: spacing.sm,
  },
  skinOptionSelected: {
    borderColor: colors.dark.primary,
  },
  skinSwatch: {
    width: sizes.iconLg + spacing.xs,
    height: sizes.iconLg + spacing.xs,
    borderRadius: radius.pill,
    marginRight: spacing.md,
  },
  skinLabel: {
    flex: 1,
    ...iosText('body'),
    fontWeight: '600',
    color: colors.dark.text,
  },
  skinBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.dark.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  skinBadgeText: {
    ...iosText('caption2'),
    fontWeight: '700',
    color: '#fff',
  },
  legalSection: {
    marginTop: spacing.sm,
  },
  legalContent: {
    padding: spacing.fieldGap,
    paddingBottom: spacing.sectionGap,
  },
  legalText: {
    ...iosText('subhead'),
    color: colors.dark.text,
  },
});
