import { ScrollView, View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/theme';
import { AppText } from './AppText';
import type { OnlineUser } from '@/features/chat/types';

type OnlineUsersBarProps = {
  users: OnlineUser[];
};

export function OnlineUsersBar({ users }: OnlineUsersBarProps) {
  if (users.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="caption2" muted>
        Online ({users.length})
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {users.map((u) => (
          <View key={u.userId} style={styles.chip}>
            <View style={styles.dot} />
            <AppText variant="caption2">{u.username}</AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.screenPadding,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dark.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dark.success,
  },
});
