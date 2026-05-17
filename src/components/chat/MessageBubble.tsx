import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius, iosText } from '@/theme';
import { AppText } from './AppText';
import { formatMessageTime } from '@/utils/dates';
import type { ChatMessageViewModel } from '@/features/chat/types';

type MessageBubbleProps = {
  message: ChatMessageViewModel;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <View style={[styles.row, message.isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, message.isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!message.isOwn ? (
          <AppText variant="caption2" style={styles.author}>
            {message.username}
          </AppText>
        ) : null}
        <AppText variant="body" style={message.isOwn ? styles.textOwn : undefined}>
          {message.body}
        </AppText>
        <AppText variant="caption2" muted style={styles.time}>
          {formatMessageTime(message.createdAt)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  rowOwn: {
    alignItems: 'flex-end',
  },
  rowOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleOwn: {
    backgroundColor: colors.dark.primary,
    borderBottomRightRadius: spacing.xs,
  },
  bubbleOther: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dark.border,
    borderBottomLeftRadius: spacing.xs,
  },
  author: {
    ...iosText('caption2'),
    color: colors.dark.secondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textOwn: {
    color: '#0F172A',
  },
  time: {
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
});
