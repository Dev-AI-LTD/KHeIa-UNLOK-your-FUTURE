import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { authStorage } from '@/lib/authStorage';
import { logger } from '@/lib/logger';

const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ||
  extra?.EXPO_PUBLIC_SUPABASE_URL?.trim() ||
  '';

const key =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  '';

if (!url || !key || url.includes('placeholder')) {
  logger.warn(
    'Supabase',
    'Lipsesc EXPO_PUBLIC_SUPABASE_URL / ANON_KEY. Verifică .env și repornește cu: npx expo start --clear',
  );
}

export const supabaseUrl = url || 'https://lbvltfvdrsdrmpuglboh.supabase.co';
export const supabaseAnonKey = key || 'missing-anon-key';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
