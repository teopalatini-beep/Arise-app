import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useApp } from '@/context/AppContext';
import { getStageTheme } from '@/lib/progression';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'flame-outline',
  programa: 'calendar-outline',
  progreso: 'stats-chart-outline',
  discovery: 'compass-outline',
  diario: 'book-outline',
  config: 'settings-outline',
};

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const iconName = TAB_ICONS[name] ?? 'ellipse-outline';
  return <Ionicons name={iconName} size={focused ? 22 : 20} color={color} />;
}

export default function TabsLayout() {
  const { data } = useApp();
  const stageTheme = getStageTheme(data?.user);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: stageTheme.tabBackground,
          borderTopColor: stageTheme.tabBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 70,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: stageTheme.tabActive,
        tabBarInactiveTintColor: stageTheme.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarAccessibilityLabel: 'Inicio de hoy',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="index" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="programa"
        options={{
          title: 'Programa',
          tabBarAccessibilityLabel: 'Programa de 90 dias',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="programa" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title: 'Progreso',
          tabBarAccessibilityLabel: 'Pantalla de progreso',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="progreso" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'Descubre',
          tabBarAccessibilityLabel: 'Herramientas discovery',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="discovery" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="diario"
        options={{
          title: 'Diario',
          tabBarAccessibilityLabel: 'Diario emocional',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="diario" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
