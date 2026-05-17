import { Platform } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

const APPLE_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE) ?? '';
const GOOGLE_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE) ?? '';

/**
 * RevenueCat entitlement Identifier (API) — dashboard may show display name „KheIA Pro”.
 * Must match RevenueCat → Entitlements → Identifier exactly. User-facing brand is KHEYA.
 */
export const KHEIA_PRO_ENTITLEMENT_ID =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID) ||
  'KheIA Pro';

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

async function getPurchasesModule() {
  const Purchases = (await import('react-native-purchases')).default;
  return Purchases;
}

/** Configure RevenueCat SDK once at app startup. */
export async function initPurchases(): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey || initialized) return;
  try {
    const Purchases = await getPurchasesModule();
    if (__DEV__) {
      const { LOG_LEVEL } = await import('react-native-purchases');
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.setLogHandler((level, message) => {
        if (
          message.includes('ProductAlreadyPurchasedError') ||
          message.includes('ITEM_ALREADY_OWNED') ||
          message.includes('already active')
        ) {
          console.log('[Purchases]', message);
          return;
        }
        if (level === LOG_LEVEL.ERROR) console.error('[Purchases]', message);
        else if (level === LOG_LEVEL.WARN) console.warn('[Purchases]', message);
        else console.log('[Purchases]', message);
      });
    }
    await Purchases.configure({ apiKey });
    initialized = true;
  } catch (e) {
    console.warn('[Purchases] init failed', e);
  }
}

/** Link purchases to Supabase user id (same as webhook app_user_id). */
export async function identifyUser(userId: string): Promise<void> {
  if (!userId || !isRevenueCatConfigured()) return;
  const apiKey = getApiKey();
  if (!apiKey) return;
  try {
    if (!initialized) await initPurchases();
    const Purchases = await getPurchasesModule();
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[Purchases] logIn failed', e);
  }
}

export async function logOutPurchases(): Promise<void> {
  if (!initialized || !isRevenueCatConfigured()) return;
  try {
    const Purchases = await getPurchasesModule();
    await Purchases.logOut();
  } catch (e) {
    console.warn('[Purchases] logOut failed', e);
  }
}

export function isPurchasesInitialized(): boolean {
  return initialized;
}

export type CustomerInfo = {
  entitlements: { active: Record<string, { expirationDate?: string }> };
};

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isNative || !initialized) return null;
  try {
    const Purchases = await getPurchasesModule();
    const info = await Purchases.getCustomerInfo();
    return info as unknown as CustomerInfo;
  } catch (e) {
    console.warn('[Purchases] getCustomerInfo failed', e);
    return null;
  }
}

export async function hasProEntitlement(): Promise<boolean> {
  const snapshot = await getRevenueCatPremiumSnapshot();
  return snapshot.isPremium;
}

export type RevenueCatPremiumSnapshot = {
  isPremium: boolean;
  productId: string | null;
  expirationDate: string | null;
  /** Abonament activ dar nu se reînnoiește (anulat în Play/App Store). */
  isCancelled: boolean;
  willRenew: boolean;
};

const EMPTY_RC_SNAPSHOT: RevenueCatPremiumSnapshot = {
  isPremium: false,
  productId: null,
  expirationDate: null,
  isCancelled: false,
  willRenew: false,
};

/** Citește entitlement activ direct din SDK (sursă de adevăr imediat după cumpărare). */
export async function getRevenueCatPremiumSnapshot(): Promise<RevenueCatPremiumSnapshot> {
  if (!isNative || !isRevenueCatConfigured()) {
    return EMPTY_RC_SNAPSHOT;
  }
  try {
    if (!initialized) await initPurchases();
    const Purchases = await getPurchasesModule();
    const info = await Purchases.getCustomerInfo();
    const active = info.entitlements.active as Record<
      string,
      {
        isActive?: boolean;
        productIdentifier?: string;
        expirationDate?: string | null;
        willRenew?: boolean;
        unsubscribeDetectedAt?: string | null;
      }
    >;
    const ent = active[KHEIA_PRO_ENTITLEMENT_ID];
    if (!ent?.isActive) {
      return EMPTY_RC_SNAPSHOT;
    }
    const willRenew = ent.willRenew ?? true;
    const isCancelled = !willRenew || !!ent.unsubscribeDetectedAt;
    return {
      isPremium: true,
      productId: ent.productIdentifier ?? null,
      expirationDate: ent.expirationDate ?? null,
      isCancelled,
      willRenew,
    };
  } catch (e) {
    console.warn('[Purchases] getRevenueCatPremiumSnapshot failed', e);
    return EMPTY_RC_SNAPSHOT;
  }
}

export type CustomerCenterAction = 'DISMISSED' | 'CANCELLED' | 'RESTORED';

export type CustomerCenterResult = {
  action: CustomerCenterAction;
};

export function planTypeFromRevenueCatProduct(productId: string | null): 'monthly' | 'yearly' | 'full_edumat' {
  const id = (productId ?? '').toLowerCase();
  if (id.includes('yearly') || id.includes('annual')) return 'yearly';
  if (id.includes('lifetime') || id.includes('edumat')) return 'full_edumat';
  return 'monthly';
}

export const LIFETIME_STORE_PRODUCT_ID = 'kheia_pro_lifetime';

export const PLAN_TO_PACKAGE_ID: Record<string, string> = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
  full_edumat: 'lifetime',
};

export function resolvePackageForPlan(
  packages: PurchasesPackage[],
  planId: 'monthly' | 'yearly' | 'lifetime',
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
        /lifetime|edumat/i.test(p.identifier),
    );
  }

  return undefined;
}

export type PaywallResult = 'NOT_PRESENTED' | 'CANCELLED' | 'PURCHASED' | 'RESTORED' | 'ERROR';

function paywallResultFromNative(result: unknown): PaywallResult {
  return (result?.toString?.() ?? result ?? 'ERROR') as PaywallResult;
}

/** Google Play: abonament deja activ (ITEM_ALREADY_OWNED) — nu e eșec pentru utilizator. */
export function isProductAlreadyOwnedError(e: unknown): boolean {
  if (!e) return false;
  const err = e as {
    code?: string | number;
    message?: string;
    underlyingErrorMessage?: string;
    userInfo?: { code?: string; message?: string };
  };
  const code = String(err.code ?? err.userInfo?.code ?? '');
  const combined = `${err.message ?? ''} ${err.underlyingErrorMessage ?? ''} ${err.userInfo?.message ?? ''}`;
  return (
    code === 'ProductAlreadyPurchasedError' ||
    code === '6' ||
    combined.includes('ProductAlreadyPurchasedError') ||
    combined.includes('ITEM_ALREADY_OWNED') ||
    combined.includes('already active')
  );
}

/** Reîmprospătează entitlement-ul din magazin (după cumpărare sau „deja deținut”). */
export async function refreshCustomerInfoFromStore(): Promise<void> {
  if (!isNative || !isRevenueCatConfigured()) return;
  try {
    if (!initialized) await initPurchases();
    const Purchases = await getPurchasesModule();
    if (Platform.OS === 'android') {
      await Purchases.syncPurchases();
    } else {
      await Purchases.restorePurchases();
    }
    await Purchases.getCustomerInfo();
  } catch (e) {
    if (!isProductAlreadyOwnedError(e)) {
      console.warn('[Purchases] refreshCustomerInfoFromStore failed', e);
    }
  }
}

/** Dacă RC arată Pro activ, tratează ca PURCHASED (inclusiv NOT_PRESENTED / ERROR după ITEM_ALREADY_OWNED). */
export async function normalizePaywallResult(raw: PaywallResult): Promise<PaywallResult> {
  if (raw === 'PURCHASED' || raw === 'RESTORED') return raw;
  await refreshCustomerInfoFromStore();
  if (await hasProEntitlement()) return 'PURCHASED';
  return raw;
}

export async function presentPaywall(): Promise<PaywallResult> {
  if (!isNative || !isRevenueCatConfigured()) return 'ERROR';
  try {
    if (!initialized) await initPurchases();
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    const result = paywallResultFromNative(await RevenueCatUI.presentPaywall());
    return normalizePaywallResult(result);
  } catch (e) {
    if (isProductAlreadyOwnedError(e)) {
      await refreshCustomerInfoFromStore();
      return 'PURCHASED';
    }
    await refreshCustomerInfoFromStore();
    const normalized = await normalizePaywallResult('ERROR');
    if (normalized === 'PURCHASED') return normalized;
    console.warn('[Purchases] presentPaywall failed', e);
    return 'ERROR';
  }
}

export async function presentPaywallIfNeeded(): Promise<{ presented: boolean; result: PaywallResult }> {
  if (!isNative || !isRevenueCatConfigured()) return { presented: false, result: 'ERROR' };
  try {
    if (!initialized) await initPurchases();
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    const raw = paywallResultFromNative(
      await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: KHEIA_PRO_ENTITLEMENT_ID,
      }),
    );
    const result = await normalizePaywallResult(raw);
    const presented = raw !== 'NOT_PRESENTED' || result === 'PURCHASED';
    return { presented, result };
  } catch (e) {
    if (isProductAlreadyOwnedError(e)) {
      await refreshCustomerInfoFromStore();
      return { presented: false, result: 'PURCHASED' };
    }
    await refreshCustomerInfoFromStore();
    const result = await normalizePaywallResult('ERROR');
    if (result === 'PURCHASED') return { presented: false, result };
    console.warn('[Purchases] presentPaywallIfNeeded failed', e);
    return { presented: false, result: 'ERROR' };
  }
}

export async function presentCustomerCenter(): Promise<CustomerCenterResult> {
  if (!isNative || !isRevenueCatConfigured()) {
    return { action: 'DISMISSED' };
  }

  let cancelSelected = false;
  let restored = false;

  try {
    if (!initialized) await initPurchases();
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onManagementOptionSelected: (event) => {
          if (event.option === 'cancel') cancelSelected = true;
        },
        onRestoreCompleted: () => {
          restored = true;
        },
      },
    });
  } catch (e) {
    console.warn('[Purchases] presentCustomerCenter failed', e);
    return { action: 'DISMISSED' };
  }

  await refreshCustomerInfoFromStore();

  if (restored) return { action: 'RESTORED' };

  const rc = await getRevenueCatPremiumSnapshot();
  if (cancelSelected || rc.isCancelled) {
    return { action: 'CANCELLED' };
  }

  return { action: 'DISMISSED' };
}

/** @deprecated Use initPurchases + identifyUser separately. */
export async function initPurchasesWithUser(userId: string | null): Promise<void> {
  await initPurchases();
  if (userId) await identifyUser(userId);
}
