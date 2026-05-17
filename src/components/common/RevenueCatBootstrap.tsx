import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import {
  initPurchases,
  identifyUser,
  logOutPurchases,
  isRevenueCatConfigured,
} from '@/services/purchases.service';
import { syncSubscriptionStateFromRevenueCat } from '@/services/subscription.service';

/**
 * Initializes RevenueCat and keeps app_user_id in sync with Supabase auth.
 */
export function RevenueCatBootstrap() {
  useEffect(() => {
    if (!isRevenueCatConfigured()) return;

    void initPurchases();

    const syncIfLoggedIn = (userId: string) => {
      void identifyUser(userId).then(() => syncSubscriptionStateFromRevenueCat(userId));
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        syncIfLoggedIn(session.user.id);
      } else {
        void logOutPurchases();
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) syncIfLoggedIn(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
