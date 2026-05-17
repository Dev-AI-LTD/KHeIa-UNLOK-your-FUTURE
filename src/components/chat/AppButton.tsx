import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, ios, spacing, sizes } from '@/theme';
import { AppText } from './AppText';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export function AppButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: AppButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#0F172A' : colors.dark.text} />
      ) : (
        <AppText
          variant="headline"
          style={[styles.label, !isPrimary && { color: colors.dark.text }]}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.touchTarget,
    borderRadius: ios.radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.dark.primary,
  },
  secondary: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dark.border,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#0F172A',
    fontWeight: '700',
  },
});
