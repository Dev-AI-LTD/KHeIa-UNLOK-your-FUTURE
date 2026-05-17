import { Tabs } from 'expo-router';
import { useColorScheme, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '@/components/TabBarIcon';
import { spacing } from '@/theme';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
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
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
              },
            ]}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          left: spacing.screenPadding,
          right: spacing.screenPadding,
          bottom: insets.bottom + spacing.relaxed,
          borderRadius: 999,
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          paddingBottom: Math.max(insets.bottom, spacing.compact),
          paddingTop: spacing.compact,
          height: 64,
        },
        tabBarActiveTintColor: isDark ? '#F9FAFB' : '#111827',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarItemStyle: {
          borderRadius: 999,
          marginHorizontal: spacing.tight,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveBackgroundColor: 'rgba(255, 255, 255, 0.14)',
        tabBarIconStyle: {
          marginBottom: -spacing.tight,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Acasa',
          tabBarAccessibilityLabel: 'Acasă',
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
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
              size={size}
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
              size={size}
              activeName="clipboard"
              inactiveName="clipboard-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progres',
          tabBarAccessibilityLabel: 'Progres',
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              activeName="bar-chart"
              inactiveName="bar-chart-outline"
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
              size={size}
              activeName="person-circle"
              inactiveName="person-circle-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}
