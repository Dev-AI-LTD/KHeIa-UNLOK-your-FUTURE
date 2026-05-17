import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import {
  getUserGamification,
  getRecentTransactions,
  getGamificationSummary,
  type CoinTransaction,
} from '@/services/gamification.service';

type UseGamificationState = {
  coins: number;
  level: number;
  xpProgress: number;
  streak: number;
  transactions: CoinTransaction[];
  loading: boolean;
  userId: string | null;
  totalXP: number;
};

const initialState: UseGamificationState = {
  coins: 0,
  level: 1,
  xpProgress: 0,
  streak: 0,
  transactions: [],
  loading: true,
  userId: null,
  totalXP: 0,
};

export function useGamification() {
  const [state, setState] = useState<UseGamificationState>(initialState);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    setState((s) => (silent ? s : { ...s, loading: true }));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setState({ ...initialState, loading: false });
      return;
    }

    const [gamification, transactions] = await Promise.all([
      getUserGamification(user.id),
      getRecentTransactions(user.id, 20),
    ]);

    if (!gamification) {
      setState({
        ...initialState,
        userId: user.id,
        loading: false,
      });
      return;
    }

    const summary = getGamificationSummary(gamification);

    setState({
      coins: summary.coins,
      level: summary.level,
      xpProgress: summary.xpProgress,
      streak: summary.streak,
      transactions,
      loading: false,
      userId: gamification.user_id,
      totalXP: summary.totalXP,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
