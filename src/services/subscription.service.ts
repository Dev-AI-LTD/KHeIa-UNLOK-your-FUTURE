import { supabase } from './supabase';

export type PlanType = 'free' | 'monthly' | 'yearly' | 'full_edumat';

export type SubscriptionStatus = {
  isPremium: boolean;
  planType: PlanType;
  currentPeriodEnd: string | null;
  referralPremiumUntil: string | null;
};

const FREE_QUIZ_LIMIT = 5;
const PREMIUM_QUIZ_LIMIT = 10;

/** Primele N capitole per materie sunt gratuite (teorie + quiz). */
export const FREE_CHAPTERS_PER_SUBJECT = 2;
/** Numărul de teste gratuite în total; apoi e nevoie de Premium. */
export const FREE_TESTS_LIMIT = 1;

/**
 * Returns max quiz questions for user based on subscription.
 */
export function getQuizQuestionLimit(isPremium: boolean): number {
  return isPremium ? PREMIUM_QUIZ_LIMIT : FREE_QUIZ_LIMIT;
}

/**
 * Fetches subscription status from profiles (subscription_type, referral_premium_until).
 */
export async function getSubscriptionStatus(userId: string | null): Promise<SubscriptionStatus> {
  if (!userId) {
    return {
      isPremium: false,
      planType: 'free',
      currentPeriodEnd: null,
      referralPremiumUntil: null,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_type, referral_premium_until')
    .eq('id', userId)
    .maybeSingle();

  const planType = (profile?.subscription_type as PlanType) ?? 'free';
  const referralPremiumUntil = profile?.referral_premium_until as string | null;

  const now = new Date();
  const referralActive =
    referralPremiumUntil && new Date(referralPremiumUntil) > now;

  const isPremium =
    planType !== 'free' || referralActive;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  const periodEnd = sub?.current_period_end as string | null;
  const paidActive = periodEnd && new Date(periodEnd) > now;

  return {
    isPremium: isPremium || !!paidActive,
    planType: paidActive ? (planType !== 'free' ? planType : 'monthly') : referralActive ? 'monthly' : planType,
    currentPeriodEnd: periodEnd,
    referralPremiumUntil,
  };
}

/**
 * Numără câte teste a început/utilizat userul (pentru limita gratuită).
 */
export async function getFreeTestsUsedCount(userId: string | null): Promise<number> {
  if (!userId) return 0;
  const { count, error } = await supabase
    .from('tests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return 0;
  return count ?? 0;
}

/**
 * Verifică dacă userul poate accesa un capitol (teorie + quiz).
 * Primele FREE_CHAPTERS_PER_SUBJECT capitole per materie sunt gratuite; restul necesită Premium.
 * @param chapterOrder – ordinea capitolului în materie (1-based, ex. 1, 2, 3…).
 */
export function canAccessChapter(
  _subjectId: string,
  chapterOrder: number,
  status: SubscriptionStatus
): boolean {
  if (status.isPremium) return true;
  return chapterOrder <= FREE_CHAPTERS_PER_SUBJECT;
}

/**
 * Verifică dacă userul poate începe un nou test (limita de teste gratuite).
 */
export async function canStartTest(
  userId: string | null,
  status: SubscriptionStatus
): Promise<boolean> {
  if (status.isPremium) return true;
  const used = await getFreeTestsUsedCount(userId);
  return used < FREE_TESTS_LIMIT;
}

/**
 * Updates subscription after RevenueCat purchase.
 */
export async function updateSubscriptionAfterPurchase(
  userId: string,
  planType: PlanType,
  currentPeriodEnd: string
): Promise<{ success: boolean }> {
  await supabase
    .from('subscriptions')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');

  const { error: subErr } = await supabase.from('subscriptions').insert({
    user_id: userId,
    plan_type: planType,
    status: 'active',
    current_period_end: currentPeriodEnd,
    updated_at: new Date().toISOString(),
  });

  if (subErr) return { success: false };

  const { error: profErr } = await supabase
    .from('profiles')
    .update({
      subscription_type: planType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { success: !profErr };
}

/**
 * Grants 1 month premium from referral credits (5 invites = 1 month).
 */
export async function grantReferralPremium(userId: string): Promise<{ success: boolean }> {
  const until = new Date();
  until.setMonth(until.getMonth() + 1);

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_premium_until, subscription_type')
    .eq('id', userId)
    .single();

  const existing = profile?.referral_premium_until as string | null;
  const existingDate = existing ? new Date(existing) : null;
  const newUntil = existingDate && existingDate > until ? existingDate : until;

  const updates: Record<string, unknown> = {
    referral_premium_until: newUntil.toISOString(),
    updated_at: new Date().toISOString(),
  };
  if ((profile?.subscription_type as string) === 'free') {
    updates.subscription_type = 'monthly';
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  return { success: !error };
}

/**
 * Fallback prices (RON) când încă nu s-au încărcat prețurile din magazin pe ecranul de abonament.
 */
export const SUBSCRIPTION_PRICES_RON = {
  monthly: 29,
  yearly: 249,
  full_edumat: 399,
} as const;
