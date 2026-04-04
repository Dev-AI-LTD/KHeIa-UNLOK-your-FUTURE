/**
 * Unit tests for purchases.service.
 * RevenueCat and native code are mocked; we test configuration and export behavior.
 */
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

import {
  isRevenueCatConfigured,
  KHEIA_PRO_ENTITLEMENT_ID,
  LIFETIME_STORE_PRODUCT_ID,
  PLAN_TO_PACKAGE_ID,
} from '@/services/purchases.service';

describe('purchases.service (unit)', () => {
  describe('isRevenueCatConfigured', () => {
    it('returns false on web (non-native)', () => {
      expect(isRevenueCatConfigured()).toBe(false);
    });
  });

  describe('constants', () => {
    it('KHEIA_PRO_ENTITLEMENT_ID is "pro"', () => {
      expect(KHEIA_PRO_ENTITLEMENT_ID).toBe('pro');
    });
    it('PLAN_TO_PACKAGE_ID maps plans; lifetime prefers RC package id with Play SKU constant', () => {
      expect(PLAN_TO_PACKAGE_ID.monthly).toBe('monthly');
      expect(PLAN_TO_PACKAGE_ID.yearly).toBe('yearly');
      expect(PLAN_TO_PACKAGE_ID.lifetime).toBe('lifetime');
      expect(LIFETIME_STORE_PRODUCT_ID).toBe('kheia_pro_lifetime');
    });
  });
});
