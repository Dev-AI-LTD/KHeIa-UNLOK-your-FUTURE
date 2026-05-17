import { Pressable, View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, ios, iosText, radius, sizes } from '@/theme';

type IOSListRowProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  destructive?: boolean;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IOSListRow({
  title,
  subtitle,
  onPress,
  icon,
  iconColor = colors.dark.primary,
  destructive = false,
  showChevron = !!onPress,
  style,
}: IOSListRowProps) {
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconWrap, destructive && styles.iconWrapDanger]}>
          <Ionicons name={icon} size={ios.icon.md} color={destructive ? '#f87171' : iconColor} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, destructive && styles.titleDanger]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={ios.icon.md} color={colors.dark.muted} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ios.layout.minTouchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.cardPadding,
    gap: spacing.fieldGap,
  },
  pressed: { opacity: 0.65 },
  iconWrap: {
    width: sizes.touchTarget - spacing.sm,
    height: sizes.touchTarget - spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
  },
  iconWrapDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  textWrap: { flex: 1 },
  title: {
    ...iosText('body'),
    color: colors.dark.text,
  },
  titleDanger: {
    color: '#f87171',
    fontWeight: '600',
  },
  subtitle: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginTop: spacing.xs / 2,
  },
});
