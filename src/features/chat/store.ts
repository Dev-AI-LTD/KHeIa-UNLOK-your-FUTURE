import { create } from 'zustand';
import type { ChatMessageViewModel, OnlineUser, Room } from './types';

type ChatStore = {
  activeRoom: Room | null;
  messages: ChatMessageViewModel[];
  onlineUsers: OnlineUser[];
  loading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  error: string | null;
  setActiveRoom: (room: Room | null) => void;
  setMessages: (messages: ChatMessageViewModel[]) => void;
  addMessage: (message: ChatMessageViewModel) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  setLoading: (loading: boolean) => void;
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  activeRoom: null,
  messages: [],
  onlineUsers: [],
  loading: false,
  connectionStatus: 'connecting',
  error: null,
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }
      return { messages: [...state.messages, message] };
    }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setLoading: (loading) => set({ loading }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      activeRoom: null,
      messages: [],
      onlineUsers: [],
      loading: false,
      connectionStatus: 'disconnected',
      error: null,
    }),
}));
