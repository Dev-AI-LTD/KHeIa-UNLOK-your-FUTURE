/** Subscription / payments removed — app is fully free. */

export type PlanType = 'free' | 'monthly' | 'yearly' | 'full_edumat';

export type SubscriptionStatus = {
  isPremium: boolean;
  planType: PlanType;
  currentPeriodEnd: string | null;
  referralPremiumUntil: string | null;
};

const FREE_ACCESS: SubscriptionStatus = {
  isPremium: true,
  planType: 'free',
  currentPeriodEnd: null,
  referralPremiumUntil: null,
};

export function getQuizQuestionLimit(_isPremium = true): number {
  return 10;
}

export async function getSubscriptionStatus(_userId: string | null): Promise<SubscriptionStatus> {
  return FREE_ACCESS;
}

export async function getFreeTestsUsedCount(_userId: string | null): Promise<number> {
  return 0;
}

export function canAccessChapter(
  _subjectId: string,
  _chapterOrder: number,
  _status?: SubscriptionStatus
): boolean {
  return true;
}

export async function canStartTest(
  _userId: string | null,
  _status?: SubscriptionStatus
): Promise<boolean> {
  return true;
}

export async function updateSubscriptionAfterPurchase(): Promise<{ success: boolean }> {
  return { success: true };
}

export async function grantReferralPremium(_userId: string): Promise<{ success: boolean }> {
  return { success: true };
}
