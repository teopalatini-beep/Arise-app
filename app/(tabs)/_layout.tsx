import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/theme';
import { Platform, Text, View } from 'react-native';

// Emoji icons para el tema anime
const ANIME_ICONS: Record<string, string> = {
  index:     '🔥',   // chakra / fuego Naruto
  programa:  '⚔️',   // espadas Demon Slayer
  progreso:  '⚡',   // rayo Super Saiyan
  discovery: '🎯',   // sharingan / foco
  diario:    '📜',   // pergamino ninja
  config:    '⚙️',   // engranaje
};

function AnimeTabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{
        fontSize: focused ? 20 : 17,
        opacity: focused ? 1 : 0.5,
        textShadowColor: focused ? color : 'transparent',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: focused ? 8 : 0,
      }}>
        {ANIME_ICONS[name]}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#05050A',
          borderTopColor: 'rgba(232,70,10,0.2)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chakra',
          tabBarIcon: ({ color, focused }) => (
            <AnimeTabIcon name="index" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="programa"
        options={{
          title: 'Misión',
          tabBarIcon: ({ color, focused }) => (
            <AnimeTabIcon name="programa" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title: 'Poder',
          tabBarIcon: ({ color, focused }) => (
            <AnimeTabIcon name="progreso" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'Sharingan',
          tabBarIcon: ({ color, focused }) => (
            <AnimeTabIcon name="discovery" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="diario"
        options={{
          title: 'Pergamino',
          tabBarIcon: ({ color, focused }) => (
            <AnimeTabIcon name="diario" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, focused }) => (
            <AnimeTabIcon name="config" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
