import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, iosText, type IosTextVariant } from '@/theme';

type AppTextProps = TextProps & {
  variant?: IosTextVariant;
  muted?: boolean;
};

export function AppText({ variant = 'body', muted, style, ...props }: AppTextProps) {
  return (
    <Text
      style={[
        iosText(variant),
        { color: muted ? colors.dark.muted : colors.dark.text },
        style,
      ]}
      {...props}
    />
  );
}

export const chatTextStyles = StyleSheet.create({
  caption: {
    ...iosText('caption1'),
    color: colors.dark.muted,
  },
});
