import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export const getSupabaseUser = async (req: Request) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
};

export const isUserPremium = async (supabase: any, userId: string): Promise<boolean> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_type, referral_premium_until')
    .eq('id', userId)
    .single();

  if (!profile) return false;

  if (profile.subscription_type !== 'free') return true;

  if (profile.referral_premium_until) {
    const now = new Date();
    const until = new Date(profile.referral_premium_until);
    if (until > now) return true;
  }

  return false;
};
