import { StyleSheet } from 'react-native';
import { spacing } from './spacing';

type GlassVariant = 'card' | 'tabBar';

const glassTokens = {
  card: {
    blur: 10,
    background: {
      light: 'rgba(255, 255, 255, 0.15)',
      dark: 'rgba(15, 23, 42, 0.35)',
    },
    border: 'rgba(255, 255, 255, 0.3)',
    shadow: {
      color: '#000',
      opacity: 0.25,
      radius: 16,
      offset: { width: 0, height: 10 },
      elevation: 8,
    },
  },
  tabBar: {
    blur: 18,
    background: {
      light: 'rgba(255, 255, 255, 0.25)',
      dark: 'rgba(15, 23, 42, 0.7)',
    },
    border: 'rgba(255, 255, 255, 0.25)',
    shadow: {
      color: '#000',
      opacity: 0.35,
      radius: 20,
      offset: { width: 0, height: 20 },
      elevation: 12,
    },
  },
};

export const glassStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.cardPadding,
  },
  tabBar: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: spacing.compact,
    paddingHorizontal: spacing.relaxed,
  },
});

export const getGlassSurface = (isDark: boolean, variant: GlassVariant = 'card') => {
  const token = glassTokens[variant];
  return {
    backgroundColor: isDark ? token.background.dark : token.background.light,
    borderColor: token.border,
    shadowColor: token.shadow.color,
    shadowOpacity: token.shadow.opacity,
    shadowRadius: token.shadow.radius,
    shadowOffset: token.shadow.offset,
    elevation: token.shadow.elevation,
  };
};

export const getGlassBlur = (variant: GlassVariant = 'card') => glassTokens[variant].blur;
