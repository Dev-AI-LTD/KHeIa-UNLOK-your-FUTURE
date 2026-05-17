import { supabase } from '@/lib/supabase';
import type { Message, Room } from './types';
import type { Profile } from '@/features/auth/types';

const GLOBAL_ROOM_SLUG = 'global-chat';
const MESSAGE_PAGE_SIZE = 50;

export async function fetchGlobalRoom(): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, slug, name, description, is_public, created_at')
    .eq('slug', GLOBAL_ROOM_SLUG)
    .maybeSingle();

  if (error) throw error;
  return data as Room | null;
}

export async function ensureRoomMembership(roomId: string, userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from('room_members').insert({
    room_id: roomId,
    user_id: userId,
    role: 'member',
  });

  if (error && !error.message.includes('duplicate')) {
    throw error;
  }
}

export async function fetchMessages(roomId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, room_id, user_id, body, created_at')
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(MESSAGE_PAGE_SIZE);

  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function fetchProfilesByIds(ids: string[]): Promise<Map<string, Profile>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .in('id', unique);

  if (error) throw error;

  const map = new Map<string, Profile>();
  for (const row of data ?? []) {
    map.set(row.id, row as Profile);
  }
  return map;
}

export function profileDisplayName(profile: Profile | undefined, userId: string): string {
  if (profile?.username?.trim()) return profile.username.trim();
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  return `User_${userId.slice(0, 6)}`;
}

export async function sendMessage(roomId: string, userId: string, body: string): Promise<Message> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error('Mesajul nu poate fi gol');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ room_id: roomId, user_id: userId, body: trimmed })
    .select('id, room_id, user_id, body, created_at')
    .single();

  if (error) throw error;
  return data as Message;
}

export async function updateChatUsername(userId: string, username: string): Promise<void> {
  const clean = username.trim().slice(0, 24);
  if (clean.length < 3) {
    throw new Error('Username-ul trebuie să aibă minim 3 caractere');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: clean, display_name: clean })
    .eq('id', userId);

  if (error) throw error;
}
