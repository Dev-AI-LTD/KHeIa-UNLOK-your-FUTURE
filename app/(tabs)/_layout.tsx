import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '@/components/TabBarIcon';
import { spacing, ios } from '@/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = ios.layout.tabBarContentHeight + insets.bottom;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        freezeOnBlur: false,
        sceneStyle: {
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(15, 23, 42, 0.72)',
                borderRadius: ios.radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(255, 255, 255, 0.12)',
              },
            ]}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          left: spacing.screenPadding,
          right: spacing.screenPadding,
          bottom: Math.max(insets.bottom, spacing.sm),
          height: tabBarHeight,
          borderRadius: ios.radius.lg,
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingTop: spacing.xs,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: '#F9FAFB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarItemStyle: {
          minHeight: ios.layout.minTouchTarget,
          borderRadius: ios.radius.md,
          marginHorizontal: spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: ios.typography.caption1.fontSize,
          lineHeight: ios.typography.caption1.lineHeight,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 2,
        },
        tabBarActiveBackgroundColor: 'rgba(255, 255, 255, 0.12)',
        tabBarIconStyle: {
          marginTop: spacing.xs,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Acasă',
          tabBarAccessibilityLabel: 'Acasă',
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size ?? ios.icon.md}
              activeName="book"
              inactiveName="book-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="kheia"
        options={{
          title: 'KHEYA',
          tabBarAccessibilityLabel: 'Chat KHEYA',
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size ?? ios.icon.md}
              activeName="chatbubble-ellipses"
              inactiveName="chatbubble-ellipses-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'Teste',
          tabBarAccessibilityLabel: 'Teste',
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size ?? ios.icon.md}
              activeName="clipboard"
              inactiveName="clipboard-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarAccessibilityLabel: 'Chat comunitate',
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size ?? ios.icon.md}
              activeName="people"
              inactiveName="people-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarAccessibilityLabel: 'Profil',
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size ?? ios.icon.md}
              activeName="person-circle"
              inactiveName="person-circle-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}
