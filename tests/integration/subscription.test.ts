/**
 * Integration tests for subscription flows with mocked Supabase.
 */
function chainableMock(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
    ...overrides,
  };
  return chain;
}

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '@/services/supabase';

import {
  getSubscriptionStatus,
  getFreeTestsUsedCount,
  canStartTest,
  updateSubscriptionAfterPurchase,
  type SubscriptionStatus,
} from '@/services/subscription.service';

describe('subscription integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const fromMock = supabase.from as jest.Mock;
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return chainableMock({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { subscription_type: 'free', referral_premium_until: null },
          }),
          single: jest.fn().mockResolvedValue({ data: {} }),
        });
      }
      if (table === 'subscriptions') {
        return chainableMock({
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        });
      }
      if (table === 'tests') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        };
      }
      return chainableMock();
    });
  });

  describe('getSubscriptionStatus', () => {
    it('returns free for null user', async () => {
      const status = await getSubscriptionStatus(null);
      expect(status.isPremium).toBe(false);
      expect(status.planType).toBe('free');
      expect(status.currentPeriodEnd).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('returns premium when profile has subscription_type monthly', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return chainableMock({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { subscription_type: 'monthly', referral_premium_until: null },
            }),
          });
        }
        if (table === 'subscriptions') {
          return chainableMock({
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          });
        }
        return chainableMock();
      });
      const status = await getSubscriptionStatus('user-123');
      expect(status.isPremium).toBe(true);
      expect(status.planType).toBe('monthly');
    });
  });

  describe('getFreeTestsUsedCount', () => {
    it('returns 0 for null user', async () => {
      const count = await getFreeTestsUsedCount(null);
      expect(count).toBe(0);
    });

    it('returns count from Supabase when user has tests', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'tests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 2, error: null }),
            }),
          };
        }
        return chainableMock();
      });
      const count = await getFreeTestsUsedCount('user-1');
      expect(count).toBe(2);
    });
  });

  describe('canStartTest', () => {
    const freeStatus: SubscriptionStatus = {
      isPremium: false,
      planType: 'free',
      currentPeriodEnd: null,
      referralPremiumUntil: null,
      isCancelled: false,
      willRenew: false,
    };

    it('returns true when premium', async () => {
      const premiumStatus: SubscriptionStatus = {
        ...freeStatus,
        isPremium: true,
        planType: 'monthly',
      };
      const result = await canStartTest('user-1', premiumStatus);
      expect(result).toBe(true);
    });

    it('returns true when free and used count 0', async () => {
      const result = await canStartTest('user-1', freeStatus);
      expect(result).toBe(true);
    });

    it('returns false when free and used count >= 1', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'tests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
            }),
          };
        }
        return chainableMock();
      });
      const result = await canStartTest('user-1', freeStatus);
      expect(result).toBe(false);
    });
  });

  describe('updateSubscriptionAfterPurchase', () => {
    it('succeeds when Supabase update and insert succeed', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue(undefined),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return chainableMock();
      });
      const result = await updateSubscriptionAfterPurchase(
        'user-1',
        'monthly',
        '2025-12-31T23:59:59Z'
      );
      expect(result.success).toBe(true);
    });

    it('returns success false when profile update fails', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue(undefined),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: new Error('DB error') }),
            }),
          };
        }
        return chainableMock();
      });
      const result = await updateSubscriptionAfterPurchase(
        'user-1',
        'yearly',
        '2026-12-31T23:59:59Z'
      );
      expect(result.success).toBe(false);
    });
  });
});
