/**
 * Unit tests for subscription.service – pure logic (limits, access, constants).
 * For getSubscriptionStatus / getFreeTestsUsedCount / updateSubscriptionAfterPurchase use integration tests with mocked Supabase.
 */
jest.mock('@/services/supabase', () => ({ supabase: {} }));

import {
  getQuizQuestionLimit,
  canAccessChapter,
  FREE_CHAPTERS_PER_SUBJECT,
  FREE_TESTS_LIMIT,
  SUBSCRIPTION_PRICES_RON,
  type SubscriptionStatus,
} from '@/services/subscription.service';

describe('subscription.service (unit)', () => {
  describe('getQuizQuestionLimit', () => {
    it('returns 5 for free user', () => {
      expect(getQuizQuestionLimit(false)).toBe(5);
    });
    it('returns 10 for premium user', () => {
      expect(getQuizQuestionLimit(true)).toBe(10);
    });
  });

  describe('canAccessChapter', () => {
    const freeStatus: SubscriptionStatus = {
      isPremium: false,
      planType: 'free',
      currentPeriodEnd: null,
      referralPremiumUntil: null,
      isCancelled: false,
      willRenew: false,
    };
    const premiumStatus: SubscriptionStatus = {
      isPremium: true,
      planType: 'monthly',
      currentPeriodEnd: '2025-12-31T00:00:00Z',
      referralPremiumUntil: null,
      isCancelled: false,
      willRenew: true,
    };

    it('premium can access any chapter', () => {
      expect(canAccessChapter('sub-1', 1, premiumStatus)).toBe(true);
      expect(canAccessChapter('sub-1', 3, premiumStatus)).toBe(true);
      expect(canAccessChapter('sub-1', 10, premiumStatus)).toBe(true);
    });

    it('free user can access chapter 1 and 2', () => {
      expect(canAccessChapter('sub-1', 1, freeStatus)).toBe(true);
      expect(canAccessChapter('sub-1', 2, freeStatus)).toBe(true);
    });

    it('free user cannot access chapter 3 and above', () => {
      expect(canAccessChapter('sub-1', 3, freeStatus)).toBe(false);
      expect(canAccessChapter('sub-1', 5, freeStatus)).toBe(false);
    });

    it('subject id is ignored (only chapter order and status matter)', () => {
      expect(canAccessChapter('math', 2, freeStatus)).toBe(true);
      expect(canAccessChapter('romanian', 2, freeStatus)).toBe(true);
    });
  });

  describe('constants', () => {
    it('FREE_CHAPTERS_PER_SUBJECT is 2', () => {
      expect(FREE_CHAPTERS_PER_SUBJECT).toBe(2);
    });
    it('FREE_TESTS_LIMIT is 1', () => {
      expect(FREE_TESTS_LIMIT).toBe(1);
    });
    it('SUBSCRIPTION_PRICES_RON has expected values', () => {
      expect(SUBSCRIPTION_PRICES_RON.monthly).toBe(30);
      expect(SUBSCRIPTION_PRICES_RON.yearly).toBe(300);
      expect(SUBSCRIPTION_PRICES_RON.full_edumat).toBe(399);
    });
  });
});
