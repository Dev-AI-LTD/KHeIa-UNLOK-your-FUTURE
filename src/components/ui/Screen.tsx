import { ReactNode } from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'horizontal')[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle' | 'children'>;
};

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom', 'horizontal'],
  style,
  contentContainerStyle,
  scrollProps,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalPad =
    width >= 428 ? spacing.screenPaddingLarge : spacing.screenPadding;

  const pad: ViewStyle = {};
  if (edges.includes('horizontal')) {
    pad.paddingHorizontal = horizontalPad;
  }
  if (edges.includes('top')) {
    pad.paddingTop = insets.top;
  }
  if (edges.includes('bottom')) {
    pad.paddingBottom = Math.max(insets.bottom, spacing.sm);
  }

  if (scroll) {
    return (
      <ScrollView
        style={[styles.flex, style]}
        contentContainerStyle={[pad, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.flex, pad, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
});
