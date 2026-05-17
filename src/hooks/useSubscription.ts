import { useMemo } from 'react';
import type { SubscriptionStatus } from '@/services/subscription.service';

const FREE_ACCESS: SubscriptionStatus = {
  isPremium: true,
  planType: 'free',
  currentPeriodEnd: null,
  referralPremiumUntil: null,
};

export function useSubscription() {
  return useMemo(
    () => ({
      status: FREE_ACCESS,
      loading: false,
      needsPaywall: false,
      refresh: async () => FREE_ACCESS,
    }),
    []
  );
}
