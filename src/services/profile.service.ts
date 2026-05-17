import * as ImagePicker from 'expo-image-picker';
import { supabase, supabaseUrl } from './supabase';

export type UserProfile = {
  id: string;
  display_name: string | null;
  school: string | null;
  city: string | null;
  study_year: string | null;
  avatar_url: string | null;
  referral_code?: string | null;
};

export type ProfileUpdateInput = {
  display_name?: string;
  school?: string;
  city?: string;
  study_year?: string;
};

export const STUDY_YEAR_OPTIONS = [
  'Clasa a V-a',
  'Clasa a VI-a',
  'Clasa a VII-a',
  'Clasa a VIII-a',
  'Clasa a IX-a',
  'Clasa a X-a',
  'Clasa a XI-a',
  'Clasa a XII-a',
] as const;

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, school, city, study_year, avatar_url, referral_code')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<{ success: boolean; error?: string }> {
  const payload: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };

  if (input.display_name !== undefined) {
    const name = input.display_name.trim();
    if (name.length < 2) {
      return { success: false, error: 'Numele trebuie să aibă minim 2 caractere' };
    }
    payload.display_name = name;
  }
  if (input.school !== undefined) {
    payload.school = input.school.trim();
  }
  if (input.city !== undefined) {
    payload.city = input.city.trim();
  }
  if (input.study_year !== undefined) {
    payload.study_year = input.study_year.trim();
  }

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function pickProfileImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }
  return result.assets[0].uri;
}

export async function uploadProfileAvatar(
  userId: string,
  localUri: string,
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const ext = localUri.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, blob, {
        upsert: true,
        contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true, avatarUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Încărcarea imaginii a eșuat';
    return { success: false, error: message };
  }
}

export function getAvatarPublicUrl(userId: string): string {
  return `${supabaseUrl}/storage/v1/object/public/avatars/${userId}/avatar.jpg`;
}

export async function fetchProfilesMap(
  userIds: string[],
): Promise<Map<string, UserProfile>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, school, city, study_year, avatar_url')
    .in('id', unique);

  if (error || !data) return new Map();

  const map = new Map<string, UserProfile>();
  for (const row of data) {
    map.set(row.id, row as UserProfile);
  }
  return map;
}

export function profileSubtitle(profile: UserProfile | undefined): string {
  const parts: string[] = [];
  if (profile?.study_year?.trim()) parts.push(profile.study_year.trim());
  if (profile?.city?.trim()) parts.push(profile.city.trim());
  return parts.join(' • ');
}

export function profileDisplayName(
  profile: UserProfile | undefined,
  userId: string,
): string {
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  return `Elev_${userId.slice(0, 6)}`;
}
