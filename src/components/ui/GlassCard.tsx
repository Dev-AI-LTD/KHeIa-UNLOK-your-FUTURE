import { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { getGlassBlur, getGlassSurface, glassStyles } from '@/theme';

type GlassCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  dark?: boolean;
};

export const GlassCard = ({ children, style, intensity, dark = false }: GlassCardProps) => {
  const cardStyle = [glassStyles.card, styles.clip, getGlassSurface(dark, 'card'), style];

  // BlurView is expensive during stack transitions on Android; use frosted surface only.
  if (Platform.OS === 'android') {
    return <View style={cardStyle}>{children}</View>;
  }

  const resolvedIntensity = intensity ?? getGlassBlur('card');
  return (
    <BlurView
      intensity={resolvedIntensity}
      tint={dark ? 'dark' : 'light'}
      style={cardStyle}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
