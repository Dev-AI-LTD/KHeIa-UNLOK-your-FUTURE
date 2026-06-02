import { View, StyleSheet, Pressable } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

type ChatHeaderProps = {
  roomName: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onPressGuidelines?: () => void;
};

const statusLabel: Record<ChatHeaderProps['connectionStatus'], string> = {
  connecting: 'Se conectează…',
  connected: 'Live',
  disconnected: 'Deconectat',
};

const statusColor: Record<ChatHeaderProps['connectionStatus'], string> = {
  connecting: colors.dark.muted,
  connected: colors.dark.success,
  disconnected: colors.dark.danger,
};

export function ChatHeader({ roomName, connectionStatus, onPressGuidelines }: ChatHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <AppText variant="title3" style={styles.title}>
          {roomName}
        </AppText>
        {onPressGuidelines ? (
          <Pressable onPress={onPressGuidelines} hitSlop={10}>
            <AppText variant="footnote" style={styles.guidelines}>
              Reguli
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: statusColor[connectionStatus] }]} />
        <AppText variant="footnote" style={{ color: statusColor[connectionStatus] }}>
          {statusLabel[connectionStatus]}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
  },
  title: {
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  guidelines: {
    color: colors.dark.secondary,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
