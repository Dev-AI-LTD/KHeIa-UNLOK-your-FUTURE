import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { KindeAuthProvider } from '@kinde/expo';
import { AppBackground } from '@/components/common/AppBackground';
import { CatalogProvider } from '@/components/common/CatalogProvider';
import { StreakUpdater } from '@/components/common/StreakUpdater';
import { RevenueCatBootstrap } from '@/components/common/RevenueCatBootstrap';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SkinProvider } from '@/contexts/SkinContext';
import { bridgeKindeToSupabase } from '@/services/auth.service';

const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

const kindeDomain =
  process.env.EXPO_PUBLIC_KINDE_DOMAIN?.trim() ||
  extra?.EXPO_PUBLIC_KINDE_DOMAIN?.trim() ||
  '';
const kindeClientId =
  process.env.EXPO_PUBLIC_KINDE_CLIENT_ID?.trim() ||
  extra?.EXPO_PUBLIC_KINDE_CLIENT_ID?.trim() ||
  '';

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <KindeAuthProvider
      config={{
        domain: kindeDomain,
        clientId: kindeClientId,
        scopes: 'openid profile email offline',
      }}
      callbacks={{
        onSuccess: async (_user, _state, context) => {
          try {
            const accessToken = await context.getAccessToken();
            if (accessToken) {
              await bridgeKindeToSupabase(accessToken);
            }
          } catch (e) {
            console.error('[Kinde] bridge after OAuth failed:', e);
          }
        },
      }}
    >
    <SkinProvider>
    <AppBackground>
      <RevenueCatBootstrap />
      <StreakUpdater />
      <CatalogProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerTitle: '',
          contentStyle: {
            backgroundColor: 'transparent',
          },
          ...(Platform.OS === 'android' && {
            animation: 'none',
          }),
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="subjects" options={{ headerShown: false }} />
        <Stack.Screen name="subject/[subjectId]" />
        <Stack.Screen name="subject/[subjectId]/generate-chapter" />
        <Stack.Screen name="subject/generate-chapters" />
        <Stack.Screen
          name="generator"
          options={{ headerShown: false, headerTitle: '' }}
        />
        <Stack.Screen
          name="select-chapter"
          options={{ headerShown: false, headerTitle: '' }}
        />
        <Stack.Screen
          name="chapter/[chapterId]/index"
          options={{ headerShown: false, headerTitle: '' }}
        />
        <Stack.Screen
          name="chapter/[chapterId]/theory"
          options={{ headerShown: false, headerTitle: '' }}
        />
        <Stack.Screen
          name="chapter/[chapterId]/generate-theory"
          options={{ headerShown: false, headerTitle: '' }}
        />
        <Stack.Screen
          name="chapter/[chapterId]/quiz"
          options={{ headerShown: false, headerTitle: '' }}
        />
        <Stack.Screen
          name="chapter/[chapterId]/quiz-result"
          options={{ headerShown: false, headerTitle: '' }}
        />
        <Stack.Screen name="test/[testId]" />
        <Stack.Screen name="test/result/[testId]" />
        <Stack.Screen name="rewards" options={{ headerShown: false, headerTitle: '' }} />
        <Stack.Screen name="referral" options={{ headerShown: false, headerTitle: '' }} />
      </Stack>
      </CatalogProvider>
    </AppBackground>
    </SkinProvider>
    </KindeAuthProvider>
    </ErrorBoundary>
  );
}
