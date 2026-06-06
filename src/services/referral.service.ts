import { supabase } from './supabase';
import { grantReferralPremium } from './subscription.service';

export type Profile = {
  id: string;
  referral_code: string | null;
  referred_by: string | null;
  school: string | null;
  display_name: string | null;
  subscription_type?: string;
  referral_premium_until?: string | null;
  created_at: string;
  updated_at: string;
};

const REFERRALS_FOR_PREMIUM = 5;

const REFERRAL_APP_URL = 'https://www.kheya.ro';

/**
 * Gets or creates the user's profile.
 * Ensures referral_code is set via DB trigger.
 */
export async function getOrCreateProfile(userId: string): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return existing as Profile;

  const { data: inserted, error } = await supabase
    .from('profiles')
    .insert({ id: userId })
    .select()
    .single();

  if (error) return null;
  return inserted as Profile;
}

/**
 * Gets the user's profile (read-only).
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}

/**
 * Updates profile fields (school, display_name).
 */
export async function updateProfile(
  userId: string,
  updates: { school?: string; display_name?: string }
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { success: !error };
}

/**
 * Applies referral code during sign-up.
 * Call with the referrer's code; returns referrer id if valid.
 */
export async function applyReferralCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const { data: referrerId, error: fnError } = await supabase.rpc('validate_referral_code', {
    code: code.toUpperCase().trim(),
  });

  if (fnError || !referrerId) {
    return { success: false, error: 'Cod invalid.' };
  }

  if (referrerId === userId) {
    return { success: false, error: 'Nu poți folosi propriul cod.' };
  }

  const { error: updError } = await supabase
    .from('profiles')
    .update({
      referred_by: referrerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updError) return { success: false, error: 'Eroare la aplicare.' };

  const referredCount = await getReferredCount(referrerId);
  if (referredCount >= REFERRALS_FOR_PREMIUM) {
    await grantReferralPremium(referrerId);
  }

  return { success: true };
}

/**
 * Counts how many users were referred by this user.
 */
export async function getReferredCount(referrerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', referrerId);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Builds share message for referral.
 */
export function buildReferralShareMessage(referralCode: string): string {
  return `Invită-mă pe KHEYA! Folosește codul meu ${referralCode} la înregistrare și deblochează capitol nou. Pregătire Evaluare Națională 2026 și BAC: ${REFERRAL_APP_URL}`;
}
