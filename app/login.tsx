import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, GRADIENTS, FONT, RADIUS, SPACING, SHADOW } from '../src/theme';

export default function LoginScreen() {
  const { hasAccount, register, login } = useAuth();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleSubmit() {
    setError('');

    if (!hasAccount) {
      // Register flow
      if (!name.trim()) {
        setError('Ingresá tu nombre.');
        shake();
        return;
      }
      if (!password) {
        setError('Ingresá una contraseña.');
        shake();
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        shake();
        return;
      }
      setLoading(true);
      await register(name.trim(), password);
      setLoading(false);
    } else {
      // Login flow
      if (!password) {
        setError('Ingresá tu contraseña.');
        shake();
        return;
      }
      setLoading(true);
      const ok = await login(password);
      setLoading(false);
      if (!ok) {
        setError('Contraseña incorrecta.');
        shake();
        setPassword('');
      }
    }
  }

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.inner}>

            {/* Brand */}
            <View style={styles.brandArea}>
              <LinearGradient
                colors={GRADIENTS.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoCircle}
              >
                <Text style={styles.logoLetter}>A</Text>
              </LinearGradient>
              <Text style={styles.brandTitle}>ARISE</Text>
              <Text style={styles.brandSubtitle}>
                {hasAccount ? 'Bienvenido de vuelta.' : 'Tu programa de 90 días.'}
              </Text>
            </View>

            {/* Card */}
            <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.cardTitle}>
                {hasAccount ? 'Ingresar' : 'Crear cuenta'}
              </Text>

              {/* Name field (only on register) */}
              {!hasAccount && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>NOMBRE</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="person-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="¿Cómo te llamás?"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>
                </View>
              )}

              {/* Password field */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Tu contraseña"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType={hasAccount ? 'done' : 'next'}
                    onSubmitEditing={hasAccount ? handleSubmit : undefined}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm password (only on register) */}
              {!hasAccount && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>CONFIRMAR CONTRASEÑA</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Repetí la contraseña"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry={!showConfirm}
                      autoCorrect={false}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeButton}>
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Error */}
              {error !== '' && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient
                  colors={GRADIENTS.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {hasAccount ? 'ENTRAR' : 'COMENZAR'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <Text style={styles.footer}>
              {hasAccount
                ? 'Tu progreso está guardado de forma local.'
                : 'Sin cuentas. Sin servidores. Solo vos.'}
            </Text>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  brandArea: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOW.glow,
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  brandTitle: {
    fontSize: FONT.xxxl,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 8,
  },
  brandSubtitle: {
    fontSize: FONT.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    letterSpacing: 0.3,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },

  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
  },
  inputIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: SPACING.xs,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT.sm,
    fontWeight: '600',
  },

  submitButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.xs,
    ...SHADOW.glow,
  },
  submitGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitText: {
    color: '#fff',
    fontSize: FONT.base,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footer: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginTop: SPACING.lg,
  },
});
