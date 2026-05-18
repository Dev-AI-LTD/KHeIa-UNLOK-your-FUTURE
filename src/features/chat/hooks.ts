import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useChatStore } from './store';
import {
  ensureRoomMembership,
  fetchGlobalRoom,
  fetchMessages,
  fetchProfilesByIds,
  profileDisplayName,
  sendMessage,
} from './api';
import { subscribeToChatRoom } from './realtime';
import type { ChatMessageViewModel } from './types';

function formatChatError(e: unknown): { title: string; subtitle: string } {
  const err = e as { code?: string; message?: string; details?: string };
  const msg =
    err?.message ??
    err?.details ??
    (e instanceof Error ? e.message : typeof e === 'string' ? e : '');

  if (err?.code === 'PGRST205' || msg.includes('public.rooms') || msg.includes('public.messages')) {
    return {
      title: 'Chat neconfigurat',
      subtitle:
        'Tabelele chat nu sunt create în Supabase. Rulează SQL-ul din docs/supabase-chat-copy-paste.sql (Dashboard → SQL Editor), apoi apasă Reîncearcă.',
    };
  }
  if (msg.includes('Global Chat nu există') || msg.includes('migrarea SQL 020')) {
    return { title: 'Chat neconfigurat', subtitle: msg };
  }
  if (msg.includes('foreign key') || msg.includes('profiles')) {
    return {
      title: 'Profil incomplet',
      subtitle:
        'Profilul tău nu e în baza de date. Ieși din cont, autentifică-te din nou, apoi apasă Reîncearcă.',
    };
  }
  if (msg.includes('JWT') || msg.toLowerCase().includes('session')) {
    return {
      title: 'Sesiune expirată',
      subtitle: 'Reautentifică-te și deschide din nou tab-ul Chat.',
    };
  }
  if (msg.includes('missing-anon-key') || msg.includes('placeholder')) {
    return {
      title: 'Chat neconfigurat',
      subtitle:
        'Lipsesc cheile Supabase în build. Verifică EXPO_PUBLIC_SUPABASE_URL și EXPO_PUBLIC_SUPABASE_ANON_KEY în EAS (production).',
    };
  }
  if (msg.trim()) {
    return { title: 'Chat indisponibil', subtitle: msg.trim() };
  }
  return {
    title: 'Chat indisponibil',
    subtitle:
      'Verifică conexiunea la internet și că migrarea chat (020) a fost rulată în Supabase → SQL Editor.',
  };
}

function toViewModel(
  row: { id: string; user_id: string; body: string; created_at: string },
  profiles: Map<string, { display_name: string | null; username: string | null }>,
  currentUserId: string,
): ChatMessageViewModel {
  const profile = profiles.get(row.user_id);
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    userId: row.user_id,
    username: profileDisplayName(profile, row.user_id),
    isOwn: row.user_id === currentUserId,
  };
}

export function useGlobalChat() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? null;

  const {
    activeRoom,
    messages,
    onlineUsers,
    loading,
    connectionStatus,
    setActiveRoom,
    setMessages,
    addMessage,
    setOnlineUsers,
    setLoading,
    setConnectionStatus,
    setError,
    error,
    errorTitle,
    reset,
  } = useChatStore();

  const realtimeRef = useRef<ReturnType<typeof subscribeToChatRoom> | null>(null);

  const bootstrap = useCallback(async () => {
    if (!userId) {
      reset();
      return;
    }

    setLoading(true);
    setConnectionStatus('connecting');
    setError(null);

    try {
      const room = await fetchGlobalRoom();
      if (!room) {
        throw new Error('Camera Global Chat nu există. Rulează migrarea SQL 020.');
      }

      setActiveRoom(room);
      await ensureRoomMembership(room.id, userId);

      const rows = await fetchMessages(room.id);
      const profileMap = await fetchProfilesByIds(rows.map((r) => r.user_id));
      const vms = rows.map((r) => toViewModel(r, profileMap, userId));
      setMessages(vms);

      realtimeRef.current?.unsubscribe();
      realtimeRef.current = subscribeToChatRoom({
        roomId: room.id,
        currentUserId: userId,
        onMessage: (msg, profile) => {
          addMessage(
            toViewModel(
              msg,
              new Map([[msg.user_id, profile ?? { display_name: null, username: null }]]),
              userId,
            ),
          );
        },
        onPresence: setOnlineUsers,
        onStatus: setConnectionStatus,
      });
    } catch (e) {
      console.error('[Chat] bootstrap failed:', e);
      setError(formatChatError(e));
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [
    addMessage,
    reset,
    setActiveRoom,
    setConnectionStatus,
    setLoading,
    setMessages,
    setOnlineUsers,
    setError,
    userId,
  ]);

  useEffect(() => {
    void bootstrap();
    return () => {
      realtimeRef.current?.unsubscribe();
      realtimeRef.current = null;
    };
  }, [bootstrap]);

  const postMessage = useCallback(
    async (body: string) => {
      if (!userId || !activeRoom) return;
      const msg = await sendMessage(activeRoom.id, userId, body);
      addMessage(
        toViewModel(
          msg,
          new Map([
            [
              userId,
              useAuthStore.getState().profile ?? { display_name: null, username: null },
            ],
          ]),
          userId,
        ),
      );
    },
    [activeRoom, addMessage, userId],
  );

  return {
    userId,
    activeRoom,
    messages,
    onlineUsers,
    loading,
    connectionStatus,
    error,
    errorTitle,
    postMessage,
    refresh: bootstrap,
  };
}
