import { Pressable, StyleSheet, Text, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, ios } from '@/theme';

type IOSButtonVariant = 'primary' | 'secondary' | 'destructive' | 'plain';

type IOSButtonProps = {
  label: string;
  onPress: () => void;
  variant?: IOSButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function IOSButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: IOSButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : colors.dark.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.primaryLabel,
            variant === 'secondary' && styles.secondaryLabel,
            variant === 'destructive' && styles.destructiveLabel,
            variant === 'plain' && styles.plainLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: ios.layout.buttonHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: ios.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.dark.primary,
  },
  secondary: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  destructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  plain: {
    backgroundColor: 'transparent',
    minHeight: ios.layout.minTouchTarget,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
  label: {
    fontSize: ios.typography.headline.fontSize,
    lineHeight: ios.typography.headline.lineHeight,
    fontWeight: '600',
    letterSpacing: ios.typography.headline.letterSpacing,
  },
  primaryLabel: { color: '#ffffff' },
  secondaryLabel: { color: '#93c5fd' },
  destructiveLabel: { color: '#f87171' },
  plainLabel: { color: colors.dark.secondary },
});
