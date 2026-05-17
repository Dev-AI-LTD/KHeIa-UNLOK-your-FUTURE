import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './store';
import type { Profile } from './types';

function displayLabel(profile: Profile | null, userId: string): string {
  if (profile?.username?.trim()) return profile.username.trim();
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  return `User_${userId.slice(0, 6)}`;
}

export function useAuthBootstrap() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (!mounted) return;

      if (data) {
        setProfile(data as Profile);
        return;
      }

      const fallbackName = `User_${userId.slice(0, 6)}`;
      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, display_name: fallbackName, username: fallbackName },
          { onConflict: 'id' },
        )
        .select('id, display_name, username, avatar_url, created_at')
        .single();

      if (mounted && inserted) {
        setProfile(inserted as Profile);
      }
    };

    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      if (data.session?.user?.id) {
        await loadProfile(data.session.user.id);
      } else {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user?.id) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setLoading, setProfile, setSession]);
}

export function useAuthUserLabel() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';
  return displayLabel(profile, userId);
}

export { displayLabel };
