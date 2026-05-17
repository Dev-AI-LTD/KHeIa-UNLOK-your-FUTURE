import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, ios, iosText, radius } from '@/theme';

type PillButtonProps = {
  label: string;
  onPress: () => void;
};

export const PillButton = ({ label, onPress }: PillButtonProps) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.pill,
    minHeight: ios.layout.minTouchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  text: {
    ...iosText('headline'),
    color: colors.light.text,
  },
});
