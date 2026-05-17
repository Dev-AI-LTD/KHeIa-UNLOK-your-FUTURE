export type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
};

export type Message = {
  id: string;
  room_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type ChatMessageViewModel = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  username: string;
  isOwn: boolean;
};

export type OnlineUser = {
  userId: string;
  username: string;
};

export type ChatState = {
  activeRoom: Room | null;
  messages: ChatMessageViewModel[];
  onlineUsers: OnlineUser[];
  loading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
};
