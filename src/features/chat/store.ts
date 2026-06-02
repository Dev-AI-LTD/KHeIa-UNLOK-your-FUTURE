import { create } from 'zustand';
import type { ChatMessageViewModel, OnlineUser, Room } from './types';

type ChatStore = {
  activeRoom: Room | null;
  messages: ChatMessageViewModel[];
  onlineUsers: OnlineUser[];
  blockedUserIds: string[];
  loading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  error: string | null;
  errorTitle: string | null;
  setActiveRoom: (room: Room | null) => void;
  setMessages: (messages: ChatMessageViewModel[]) => void;
  addMessage: (message: ChatMessageViewModel) => void;
  removeMessagesByUserId: (userId: string) => void;
  setBlockedUserIds: (ids: string[]) => void;
  addBlockedUserId: (userId: string) => void;
  removeBlockedUserId: (userId: string) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  setLoading: (loading: boolean) => void;
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  setError: (error: { title: string; subtitle: string } | null) => void;
  reset: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  activeRoom: null,
  messages: [],
  onlineUsers: [],
  blockedUserIds: [],
  loading: false,
  connectionStatus: 'connecting',
  error: null,
  errorTitle: null,
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      if (state.blockedUserIds.includes(message.userId)) {
        return state;
      }
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }
      return { messages: [...state.messages, message] };
    }),
  removeMessagesByUserId: (userId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.userId !== userId),
    })),
  setBlockedUserIds: (blockedUserIds) => set({ blockedUserIds }),
  addBlockedUserId: (userId) =>
    set((state) =>
      state.blockedUserIds.includes(userId)
        ? state
        : { blockedUserIds: [...state.blockedUserIds, userId] },
    ),
  removeBlockedUserId: (userId) =>
    set((state) => ({
      blockedUserIds: state.blockedUserIds.filter((id) => id !== userId),
    })),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setLoading: (loading) => set({ loading }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setError: (payload) =>
    set({
      error: payload?.subtitle ?? null,
      errorTitle: payload?.title ?? null,
    }),
  reset: () =>
    set({
      activeRoom: null,
      messages: [],
      onlineUsers: [],
      blockedUserIds: [],
      loading: false,
      connectionStatus: 'disconnected',
      error: null,
      errorTitle: null,
    }),
}));
