import type { Session } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at?: string;
};

export type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
};
