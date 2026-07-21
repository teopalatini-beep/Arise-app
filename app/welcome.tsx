import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { FONT, RADIUS, SPACING } from '@/theme';

const { width, height } = Dimensions.get('window');

const QUOTES = [
  { text: 'La disciplina es el puente entre las metas y los logros.', author: 'Jim Rohn' },
  { text: 'No desees que sea mas facil. Desea ser mejor.', author: 'Jim Rohn' },
  { text: 'Cuando tu mente diga que ya esta, todavia te queda mas.', author: 'David Goggins' },
  { text: 'Programa el sufrimiento en tu dia. Asi se callosia la mente.', author: 'David Goggins' },
  { text: 'La motivacion es mentira. Los sistemas y la ejecucion ganan.', author: 'Alex Hormozi' },
  { text: 'Sale mas fuerte de lo dificil. Eso es adaptabilidad.', author: 'Alex Hormozi' },
  { text: 'Procrastinar suele ser miedo disfrazado de pereza.', author: 'Chris Williamson' },
  { text: 'El cuerpo disciplinado le ensena a la mente que puede hacer cosas dificiles.', author: 'Chris Williamson' },
  { text: 'El gym es metafora de la vida: lo que plantas ahi florece afuera.', author: 'Greg Plitt' },
  { text: 'El “quiero” se defiende con accion, no con intencion.', author: 'Greg Plitt' },
  { text: 'La disciplina pesa gramos. El arrepentimiento, toneladas.', author: 'Coach ARISE' },
  { text: 'Resultado > intencion. Hoy se construye el estandar.', author: 'Coach ARISE' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { data } = useApp();
  const { userName } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const name = userName ?? data?.user?.name ?? 'Guerrero';
  const day = data?.user?.currentDay ?? 1;

  useEffect(() => {
    // Secuencia de animación de entrada
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 75, friction: 10, useNativeDriver: true }),
      ]),
      Animated.timing(quoteAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    // Pulso del glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });

  function handleEnter() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
      router.replace('/(tabs)');
    });
  }

  return (
    <LinearGradient colors={['#05050A', '#0A0A14', '#0F0F1E']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

      {/* Glow de fondo — chakra */}
      <Animated.View style={[styles.glowBg, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowBg2, { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] }) }]} />

      {/* Partículas decorativas */}
      <View style={[styles.particle, { top: height * 0.12, left: width * 0.08 }]} />
      <View style={[styles.particle, { top: height * 0.25, right: width * 0.1, width: 4, height: 4, backgroundColor: '#818CF840' }]} />
      <View style={[styles.particle, { bottom: height * 0.3, left: width * 0.15, width: 3, height: 3 }]} />
      <View style={[styles.particle, { bottom: height * 0.18, right: width * 0.2 }]} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* Emblema / símbolo */}
        <View style={styles.emblemContainer}>
          <Animated.View style={[styles.emblemOuter, { opacity: glowOpacity }]} />
          <View style={styles.emblem}>
            <Text style={styles.emblemText}>気</Text>
          </View>
        </View>

        {/* Bienvenida */}
        <Text style={styles.welcomeLabel}>BIENVENIDO</Text>
        <Text style={styles.name}>{name.toUpperCase()}</Text>

        {/* Día */}
        <View style={styles.dayBadge}>
          <Text style={styles.dayText}>DÍA {day} · JORNADA 90</Text>
        </View>

        {/* Separador */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerSymbol}>⚡</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Frase */}
        <Animated.View style={[styles.quoteContainer, { opacity: quoteAnim }]}>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </Animated.View>

        {/* Botón */}
        <Animated.View style={{ opacity: btnAnim, width: '100%' }}>
          <TouchableOpacity
            onPress={handleEnter}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Comenzar jornada"
          >
            <LinearGradient
              colors={['#6366F1', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>COMENZAR JORNADA</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.btnIcon} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleEnter}
            style={styles.skipBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Entrar rapido al inicio"
          >
            <Text style={styles.skipText}>Entrar rapido</Text>
          </TouchableOpacity>
        </Animated.View>

      </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  glowBg: {
    position: 'absolute',
    width: 320, height: 320,
    borderRadius: 160,
    backgroundColor: '#6366F1',
    top: height * 0.2,
    alignSelf: 'center',
    filter: undefined,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 120,
    elevation: 30,
  },
  glowBg2: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: '#38BDF8',
    top: height * 0.26,
    alignSelf: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
    elevation: 20,
  },
  particle: {
    position: 'absolute',
    width: 5, height: 5,
    borderRadius: 3,
    backgroundColor: '#818CF840',
  },

  content: {
    width: '100%',
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },

  emblemContainer: {
    width: 110, height: 110,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emblemOuter: {
    position: 'absolute',
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  emblem: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#0F0F1E',
    borderWidth: 2,
    borderColor: '#818CF8',
    alignItems: 'center', justifyContent: 'center',
  },
  emblemText: { fontSize: 42, color: '#A5B4FC' },

  welcomeLabel: {
    fontSize: FONT.xs, color: '#818CF8',
    fontWeight: '900', letterSpacing: 6,
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: 42, fontWeight: '900',
    color: '#F5F0FF', letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: '#6366F1',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: SPACING.sm,
  },

  dayBadge: {
    borderWidth: 1, borderColor: 'rgba(129,140,248,0.35)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    backgroundColor: 'rgba(99,102,241,0.12)',
    marginBottom: SPACING.lg,
  },
  dayText: { fontSize: FONT.xs, color: '#A5B4FC', fontWeight: '800', letterSpacing: 2 },

  divider: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    width: '80%', marginBottom: SPACING.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerSymbol: { fontSize: 14, color: '#A5B4FC' },

  quoteContainer: {
    alignItems: 'center', marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  quoteText: {
    fontSize: FONT.base, color: '#C4BEDD',
    fontStyle: 'italic', textAlign: 'center',
    lineHeight: 26, marginBottom: SPACING.sm,
  },
  quoteAuthor: {
    fontSize: FONT.xs, color: '#E8460A',
    fontWeight: '700', letterSpacing: 1,
  },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, borderRadius: RADIUS.xl,
    paddingVertical: 16, paddingHorizontal: SPACING.xl,
    shadowColor: '#E8460A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  btnText: {
    color: '#fff', fontSize: FONT.base,
    fontWeight: '900', letterSpacing: 2,
  },
  btnIcon: { marginLeft: 8 },
  skipBtn: {
    marginTop: SPACING.sm,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#A8A1C5',
    fontSize: FONT.sm,
    fontWeight: '700',
  },
});
