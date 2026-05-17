import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, ios, iosText } from '@/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Înapoi',
  right,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.wrap, style]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <Ionicons name="chevron-back" size={ios.icon.lg} color={colors.dark.secondary} />
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sectionGap,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ios.layout.minTouchTarget,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
    paddingRight: spacing.sm,
  },
  backPlaceholder: {
    height: spacing.xs,
  },
  backText: {
    ...iosText('body'),
    fontWeight: '600',
    color: colors.dark.secondary,
    marginLeft: -2,
  },
  titleBlock: {
    alignItems: 'flex-start',
  },
  title: {
    ...iosText('largeTitle'),
    color: colors.dark.text,
  },
  subtitle: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginTop: spacing.xs,
    textAlign: 'left',
  },
  right: {
    position: 'absolute',
    right: 0,
    top: 0,
    minHeight: ios.layout.minTouchTarget,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.65 },
});
