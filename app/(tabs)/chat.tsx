import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { spacing, sizes } from '@/theme';
import { useAuthBootstrap } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/store';
import { useGlobalChat } from '@/features/chat/hooks';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { OnlineUsersBar } from '@/components/chat/OnlineUsersBar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { EmptyState } from '@/components/chat/EmptyState';
import type { ChatMessageViewModel } from '@/features/chat/types';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList<ChatMessageViewModel>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useAuthBootstrap();

  const session = useAuthStore((s) => s.session);
  const authLoading = useAuthStore((s) => s.loading);

  const {
    activeRoom,
    messages,
    onlineUsers,
    loading,
    connectionStatus,
    error,
    postMessage,
    refresh,
  } = useGlobalChat();

  const scrollToEnd = useCallback(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(scrollToEnd, 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToEnd]);

  /** Tab bar flotant când tastatura e închisă; deasupra tastaturii când e deschisă */
  const inputBottomPad =
    keyboardHeight > 0
      ? keyboardHeight - insets.bottom + spacing.sm
      : spacing.contentBottom + insets.bottom;

  if (authLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: inputBottomPad }]}>
        <ChatHeader roomName="Chat comunitate" connectionStatus="disconnected" />
        <EmptyState
          title="Conectează-te pentru chat"
          subtitle="Autentifică-te pentru a trimite mesaje în camera globală KHEYA și a vedea conversația live."
          actionLabel="Autentificare"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ChatHeader
        roomName={activeRoom?.name ?? 'Global Chat'}
        connectionStatus={connectionStatus}
      />
      <OnlineUsersBar users={onlineUsers} />

      {error ? (
        <EmptyState
          title="Chat neconfigurat"
          subtitle={error}
          icon="server-outline"
          actionLabel="Reîncearcă"
          onAction={() => void refresh()}
        />
      ) : loading && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : messages.length === 0 ? (
        <EmptyState
          title="Niciun mesaj încă"
          subtitle="Fii primul care salută comunitatea! Mesajele sunt sincronizate în timp real pentru toți utilizatorii."
          icon="chatbubble-ellipses-outline"
        />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{
            paddingTop: spacing.md,
            paddingBottom: keyboardHeight > 0 ? spacing.lg : spacing.md,
          }}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={styles.list}
        />
      )}

      <View style={{ paddingBottom: inputBottomPad }}>
        <ChatInput
          onSend={postMessage}
          onFocus={scrollToEnd}
          disabled={connectionStatus === 'disconnected' || !activeRoom}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  list: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    minHeight: sizes.touchTarget,
  },
});
