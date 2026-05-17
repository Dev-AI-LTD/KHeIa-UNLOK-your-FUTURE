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

export const isUserPremium = async (_supabase: unknown, _userId: string): Promise<boolean> => {
  return true;
};
