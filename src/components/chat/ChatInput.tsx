import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, sizes, iosText } from '@/theme';

type ChatInputProps = {
  onSend: (text: string) => Promise<void>;
  onFocus?: () => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, onFocus, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.bar}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Scrie un mesaj..."
        placeholderTextColor={colors.dark.muted}
        multiline
        maxLength={4000}
        editable={!disabled && !sending}
        returnKeyType="send"
        onFocus={onFocus}
        onSubmitEditing={() => void handleSend()}
        textAlignVertical={Platform.OS === 'android' ? 'center' : undefined}
      />
      <Pressable
        onPress={() => void handleSend()}
        disabled={disabled || sending || !text.trim()}
        style={({ pressed }) => [
          styles.sendBtn,
          (disabled || !text.trim()) && styles.sendDisabled,
          pressed && { opacity: 0.8 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Trimite mesaj"
      >
        {sending ? (
          <ActivityIndicator size="small" color="#0F172A" />
        ) : (
          <Ionicons name="arrow-up" size={22} color="#0F172A" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.dark.border,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
  },
  input: {
    flex: 1,
    minHeight: sizes.inputMinHeight,
    maxHeight: 120,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dark.border,
    color: colors.dark.text,
    ...iosText('body'),
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  sendBtn: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
