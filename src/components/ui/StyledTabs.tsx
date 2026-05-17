import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, spacing, ios, iosText, radius } from '@/theme';

export type TabItem = { id: string; label: string };

type StyledTabsProps = {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  fullWidth?: boolean;
};

export function StyledTabs({ tabs, activeId, onChange, fullWidth }: StyledTabsProps) {
  return (
    <View style={[styles.container, fullWidth && styles.containerFullWidth]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={[styles.tab, isActive && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.fieldGap,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  containerFullWidth: {
    marginHorizontal: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    flexGrow: 0,
    gap: spacing.xs,
  },
  tab: {
    minHeight: ios.layout.minTouchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    minWidth: 72,
  },
  tabActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
  },
  tabText: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.muted,
  },
  tabTextActive: {
    color: colors.dark.text,
  },
});
