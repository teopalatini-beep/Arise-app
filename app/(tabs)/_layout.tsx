import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import { getStageTheme } from '@/lib/progression';
import { METAL, SURFACES } from '@/theme';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'flame-outline',
  coach: 'chatbubbles-outline',
  programa: 'calendar-outline',
  progreso: 'stats-chart-outline',
  mas: 'ellipsis-horizontal-circle-outline',
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
          backgroundColor: stageTheme.tabBackground || SURFACES.base,
          borderTopColor: METAL.goldBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 86 : 70,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: stageTheme.tabActive || METAL.gold,
        tabBarInactiveTintColor: stageTheme.tabInactive || '#78716C',
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
        name="coach"
        options={{
          title: 'Coach',
          tabBarAccessibilityLabel: 'Chat con tu coach',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="coach" color={color} focused={focused} />
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
        name="mas"
        options={{
          title: 'Más',
          tabBarAccessibilityLabel: 'Diario, descubre y ajustes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="mas" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="diario"
        options={{
          href: null,
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
