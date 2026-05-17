import { useState, useCallback, useEffect } from 'react';
import {
  getSubscriptionStatus,
  refreshSubscriptionAfterCustomerCenter,
  refreshSubscriptionAfterPurchase,
  type SubscriptionStatus,
} from '@/services/subscription.service';
import { supabase } from '@/services/supabase';

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const s = await getSubscriptionStatus(user?.id ?? null);
    setStatus(s);
    setLoading(false);
    return s;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const refreshAfterPurchase = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const s = await refreshSubscriptionAfterPurchase(user?.id ?? null);
    setStatus(s);
    setLoading(false);
    return s;
  }, []);

  const refreshAfterCustomerCenter = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const s = await refreshSubscriptionAfterCustomerCenter(user?.id ?? null);
    setStatus(s);
    setLoading(false);
    return s;
  }, []);

  return {
    isPremium: status?.isPremium ?? false,
    planType: status?.planType ?? 'free',
    isCancelled: status?.isCancelled ?? false,
    willRenew: status?.willRenew ?? false,
    currentPeriodEnd: status?.currentPeriodEnd ?? null,
    status,
    loading,
    refresh,
    refreshAfterPurchase,
    refreshAfterCustomerCenter,
    needsPaywall: status != null && !status.isPremium,
  };
}
