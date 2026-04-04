import { Platform } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

const APPLE_KEY = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE) ?? '';
const GOOGLE_KEY = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE) ?? '';

/** Entitlement identifier in RevenueCat dashboard for KHEYA Pro access. */
export const KHEIA_PRO_ENTITLEMENT_ID = 'pro';

/** RevenueCat nu rulează pe web. */
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export function isRevenueCatConfigured(): boolean {
  if (!isNative) return false;
  return !!(Platform.OS === 'ios' ? APPLE_KEY : GOOGLE_KEY);
}

function getApiKey(): string {
  const key = Platform.OS === 'ios' ? APPLE_KEY : GOOGLE_KEY;
  return key?.trim() ?? '';
}

let initialized = false;

export async function initPurchases(userId: string | null): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    await Purchases.configure({ apiKey });
    initialized = true;
    if (userId) await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[Purchases] init failed', e);
  }
}

export function isPurchasesInitialized(): boolean {
  return initialized;
}

/** Customer info from RevenueCat (entitlements, active subscriptions). */
export type CustomerInfo = {
  entitlements: { active: Record<string, { expirationDate?: string }> };
};

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isNative) return null;
  const apiKey = getApiKey();
  if (!apiKey || !initialized) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const info = await Purchases.getCustomerInfo();
    return info as unknown as CustomerInfo;
  } catch (e) {
    console.warn('[Purchases] getCustomerInfo failed', e);
    return null;
  }
}

/** Returns true if the user has the KHEYA Pro entitlement. */
export async function hasProEntitlement(): Promise<boolean> {
  const info = await getCustomerInfo();
  if (!info?.entitlements?.active) return false;
  return KHEIA_PRO_ENTITLEMENT_ID in info.entitlements.active;
}

export async function getOfferings(): Promise<{
  current: { availablePackages: Array<{ identifier: string; package: unknown }> };
} | null> {
  if (!isNative) return null;
  const apiKey = getApiKey();
  if (!apiKey || !initialized) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    return current ? { current } : null;
  } catch (e) {
    console.warn('[Purchases] getOfferings failed', e);
    return null;
  }
}

/**
 * Google Play product id for lifetime (see Play Console / API).
 * RevenueCat package may still be named `lifetime`; we also match this store id.
 */
export const LIFETIME_STORE_PRODUCT_ID = 'kheia_pro_lifetime';

/** Preferred RevenueCat package identifiers in the current offering (fallback: match store product id). */
export const PLAN_TO_PACKAGE_ID: Record<string, string> = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
  full_edumat: 'lifetime',
};

export function resolvePackageForPlan(
  packages: PurchasesPackage[],
  planId: 'monthly' | 'yearly' | 'lifetime'
): PurchasesPackage | undefined {
  const preferredRcId = PLAN_TO_PACKAGE_ID[planId] ?? planId;
  const byRc = packages.find((p) => p.identifier === preferredRcId);
  if (byRc) return byRc;

  if (planId === 'lifetime') {
    return packages.find(
      (p) =>
        p.identifier === LIFETIME_STORE_PRODUCT_ID ||
        p.product.identifier === LIFETIME_STORE_PRODUCT_ID ||
        /lifetime|edumat/i.test(p.product.identifier) ||
        /lifetime|edumat/i.test(p.identifier)
    );
  }

  return undefined;
}

/** Localized price strings from the store (offering `current`). */
export type PaywallPriceSnapshot = Partial<
  Record<'monthly' | 'yearly' | 'lifetime', { priceLabel: string }>
>;

export async function getPaywallPriceSnapshot(): Promise<PaywallPriceSnapshot> {
  if (!isNative) return {};
  const apiKey = getApiKey();
  if (!apiKey || !initialized) return {};
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return {};

    const out: PaywallPriceSnapshot = {};
    for (const planId of ['monthly', 'yearly', 'lifetime'] as const) {
      const pkg = resolvePackageForPlan(current.availablePackages, planId);
      const label = pkg?.product?.priceString?.trim();
      if (label) out[planId] = { priceLabel: label };
    }
    return out;
  } catch (e) {
    console.warn('[Purchases] getPaywallPriceSnapshot failed', e);
    return {};
  }
}

export type PurchaseResult =
  | { success: true; customerInfo: { expirationDate: string | null } }
  | { success: false; error: unknown };

export async function purchaseSubscriptionPlan(
  planId: 'monthly' | 'yearly' | 'lifetime'
): Promise<PurchaseResult> {
  if (!isNative) return { success: false, error: new Error('Purchases only on native') };
  const apiKey = getApiKey();
  if (!apiKey || !initialized) {
    return { success: false, error: new Error('RevenueCat not configured or not initialized') };
  }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return { success: false, error: new Error('No offering available') };
    const pkg = resolvePackageForPlan(current.availablePackages, planId);
    if (!pkg) {
      return {
        success: false,
        error: new Error(
          `Plan „${planId}” nu e în offering. Verifică RevenueCat (pachete monthly/yearly și produsul ${LIFETIME_STORE_PRODUCT_ID}).`
        ),
      };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = (customerInfo as CustomerInfo)?.entitlements?.active;
    const expirationDate =
      active?.[KHEIA_PRO_ENTITLEMENT_ID]?.expirationDate ??
      (active && Object.values(active)[0]?.expirationDate) ??
      null;
    return { success: true, customerInfo: { expirationDate } };
  } catch (e: unknown) {
    return { success: false, error: e };
  }
}

export async function purchasePackage(packageIdentifier: string): Promise<PurchaseResult> {
  if (!isNative) return { success: false, error: new Error('Purchases only on native') };
  const apiKey = getApiKey();
  if (!apiKey || !initialized) {
    return { success: false, error: new Error('RevenueCat not configured or not initialized') };
  }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return { success: false, error: new Error('No offering available') };
    let pkg: PurchasesPackage | undefined = current.availablePackages.find(
      (p: { identifier: string }) => p.identifier === packageIdentifier
    );
    if (!pkg && (packageIdentifier === LIFETIME_STORE_PRODUCT_ID || packageIdentifier === 'lifetime')) {
      pkg = resolvePackageForPlan(current.availablePackages, 'lifetime');
    }
    if (!pkg) {
      return {
        success: false,
        error: new Error(`Package "${packageIdentifier}" not found. Check RevenueCat dashboard.`),
      };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = (customerInfo as CustomerInfo)?.entitlements?.active;
    const expirationDate =
      active?.[KHEIA_PRO_ENTITLEMENT_ID]?.expirationDate ??
      (active && Object.values(active)[0]?.expirationDate) ??
      null;
    return { success: true, customerInfo: { expirationDate } };
  } catch (e: unknown) {
    return { success: false, error: e };
  }
}

/** Present RevenueCat Paywall (requires react-native-purchases-ui). */
export type PaywallResult = 'NOT_PRESENTED' | 'CANCELLED' | 'PURCHASED' | 'RESTORED' | 'ERROR';

export async function presentPaywall(): Promise<PaywallResult> {
  if (!isNative || !isRevenueCatConfigured()) return 'ERROR';
  try {
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    const result = await RevenueCatUI.presentPaywall();
    return (result?.toString?.() ?? result) as PaywallResult;
  } catch (e) {
    console.warn('[Purchases] presentPaywall failed', e);
    return 'ERROR';
  }
}

/** Present paywall only if user does not have KHEYA Pro. Returns whether paywall was shown and result. */
export async function presentPaywallIfNeeded(): Promise<{ presented: boolean; result: PaywallResult }> {
  if (!isNative || !isRevenueCatConfigured()) return { presented: false, result: 'ERROR' };
  try {
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: KHEIA_PRO_ENTITLEMENT_ID,
    });
    const presented = result?.toString?.() !== 'NOT_PRESENTED';
    return { presented, result: (result?.toString?.() ?? result) as PaywallResult };
  } catch (e) {
    console.warn('[Purchases] presentPaywallIfNeeded failed', e);
    return { presented: false, result: 'ERROR' };
  }
}

/** Present RevenueCat Customer Center (manage subscription, restore). */
export async function presentCustomerCenter(): Promise<void> {
  if (!isNative || !isRevenueCatConfigured()) return;
  try {
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    await RevenueCatUI.presentCustomerCenter();
  } catch (e) {
    console.warn('[Purchases] presentCustomerCenter failed', e);
  }
}
