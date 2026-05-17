import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Message } from './types';
import type { OnlineUser } from './types';
import { profileDisplayName } from './api';
import type { Profile } from '@/features/auth/types';

type MessageHandler = (message: Message, profile?: Profile) => void;
type PresenceHandler = (users: OnlineUser[]) => void;

export type ChatRealtime = {
  channel: RealtimeChannel;
  unsubscribe: () => void;
};

export function subscribeToChatRoom(options: {
  roomId: string;
  currentUserId: string;
  onMessage: MessageHandler;
  onPresence: PresenceHandler;
  onStatus?: (status: 'connecting' | 'connected' | 'disconnected') => void;
}): ChatRealtime {
  const { roomId, currentUserId, onMessage, onPresence, onStatus } = options;

  onStatus?.('connecting');

  const channel = supabase.channel(`room:${roomId}`, {
    config: { presence: { key: currentUserId } },
  });

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    },
    async (payload) => {
      const row = payload.new as Message;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .eq('id', row.user_id)
        .maybeSingle();

      onMessage(row, (profile as Profile | null) ?? undefined);
    },
  );

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState<{
      user_id: string;
      username: string;
    }>();
    const users: OnlineUser[] = [];
    const seen = new Set<string>();

    Object.values(state).forEach((presences) => {
      presences.forEach((p) => {
        if (!p.user_id || seen.has(p.user_id)) return;
        seen.add(p.user_id);
        users.push({
          userId: p.user_id,
          username: p.username || `User_${p.user_id.slice(0, 6)}`,
        });
      });
    });

    onPresence(users);
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      onStatus?.('connected');
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .eq('id', currentUserId)
        .maybeSingle();

      const username = profileDisplayName(
        (profile as Profile | null) ?? undefined,
        currentUserId,
      );

      await channel.track({
        user_id: currentUserId,
        username,
        online_at: new Date().toISOString(),
      });
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      onStatus?.('disconnected');
    }
  });

  return {
    channel,
    unsubscribe: () => {
      void supabase.removeChannel(channel);
      onStatus?.('disconnected');
    },
  };
}
