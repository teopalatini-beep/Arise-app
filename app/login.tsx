import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { COLORS, GRADIENTS, FONT, RADIUS, SPACING, SHADOW } from '@/theme';

type Mode = 'login' | 'register' | 'reset';

function normalizeAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('email not confirmed')) {
    return 'Tu email todavia no esta confirmado. Revisa tu bandeja y valida la cuenta para ingresar.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Email o contrasena incorrectos.';
  }
  if (lower.includes('network')) {
    return 'No hay conexion con el servidor. Revisa internet e intenta de nuevo.';
  }
  return message;
}

export default function LoginScreen() {
  const { register, login, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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

  function showError(msg: string) {
    setError(msg);
    shake();
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit() {
    setError('');
    setSuccessMsg('');

    if (mode === 'reset') {
      if (!email.trim()) { showError('Ingresá tu email.'); return; }
      setLoading(true);
      const err = await resetPassword(email.trim());
      setLoading(false);
      if (err) { showError(err); }
      else { setSuccessMsg('Te enviamos un email para resetear tu contraseña.'); }
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) { showError('Ingresá tu nombre.'); return; }
      if (!email.trim()) { showError('Ingresá tu email.'); return; }
      if (!password) { showError('Ingresá una contraseña.'); return; }
      if (password !== confirmPassword) { showError('Las contraseñas no coinciden.'); return; }
      setLoading(true);
      const err = await register(name.trim(), email.trim(), password);
      setLoading(false);
      if (err) { showError(err); }
      else {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setSuccessMsg('Cuenta creada. Confirma tu email y luego inicia sesion.');
      }
      return;
    }

    // login
    if (!email.trim()) { showError('Ingresá tu email.'); return; }
    if (!password) { showError('Ingresá tu contraseña.'); return; }
    setLoading(true);
    const err = await login(email.trim(), password);
    setLoading(false);
    if (err) {
      showError(normalizeAuthError(err));
      setPassword('');
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Ingresar',
    register: 'Crear cuenta',
    reset: 'Recuperar contraseña',
  };

  const btnLabels: Record<Mode, string> = {
    login: 'ENTRAR',
    register: 'COMENZAR',
    reset: 'ENVIAR EMAIL',
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.inner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                {mode === 'login' ? 'Bienvenido de vuelta.' :
                 mode === 'register' ? 'Tu programa de 90 días.' :
                 'Recuperá tu acceso.'}
              </Text>
            </View>

            {/* Card */}
            <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.cardTitle}>{titles[mode]}</Text>

              {/* Name (register only) */}
              {mode === 'register' && (
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

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password */}
              {mode !== 'reset' && (
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
                      returnKeyType={mode === 'login' ? 'done' : 'next'}
                      onSubmitEditing={mode === 'login' ? handleSubmit : undefined}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Confirm password (register only) */}
              {mode === 'register' && (
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
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Forgot password link */}
              {mode === 'login' && (
                <TouchableOpacity onPress={() => switchMode('reset')} style={styles.forgotButton}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              )}

              {/* Error */}
              {error !== '' && (
                <View style={styles.messageRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Success */}
              {successMsg !== '' && (
                <View style={[styles.messageRow, { backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: RADIUS.sm, padding: SPACING.sm }]}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
                  <Text style={styles.successText}>{successMsg}</Text>
                </View>
              )}

              {/* Submit */}
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
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.submitText}>{btnLabels[mode]}</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>

              {/* Mode switchers */}
              <View style={styles.switchRow}>
                {mode === 'login' && (
                  <TouchableOpacity onPress={() => switchMode('register')}>
                    <Text style={styles.switchText}>
                      ¿No tenés cuenta? <Text style={styles.switchLink}>Registrate</Text>
                    </Text>
                  </TouchableOpacity>
                )}
                {mode === 'register' && (
                  <TouchableOpacity onPress={() => switchMode('login')}>
                    <Text style={styles.switchText}>
                      ¿Ya tenés cuenta? <Text style={styles.switchLink}>Ingresá</Text>
                    </Text>
                  </TouchableOpacity>
                )}
                {mode === 'reset' && (
                  <TouchableOpacity onPress={() => switchMode('login')}>
                    <Text style={styles.switchText}>
                      <Text style={styles.switchLink}>← Volver al login</Text>
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {/* Footer */}
            <Text style={styles.footer}>
              Tus datos están protegidos y son privados.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },

  brandArea: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md, ...SHADOW.glow,
  },
  logoLetter: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  brandTitle: { fontSize: FONT.xxxl, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 8 },
  brandSubtitle: { fontSize: FONT.base, color: COLORS.textSecondary, marginTop: SPACING.xs },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },

  field: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: SPACING.xs },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.sm,
  },
  inputIcon: { marginRight: SPACING.xs },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base, paddingVertical: 14 },
  eyeButton: { padding: SPACING.xs },

  forgotButton: { alignSelf: 'flex-end', marginBottom: SPACING.md, marginTop: -SPACING.xs },
  forgotText: { fontSize: FONT.sm, color: COLORS.accent },

  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: SPACING.md },
  errorText: { flex: 1, color: COLORS.danger, fontSize: FONT.sm, fontWeight: '600' },
  successText: { flex: 1, color: COLORS.success, fontSize: FONT.sm, fontWeight: '600' },

  submitButton: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.xs, ...SHADOW.glow },
  submitGradient: { paddingVertical: SPACING.md, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  submitText: { color: '#fff', fontSize: FONT.base, fontWeight: '900', letterSpacing: 2 },

  switchRow: { alignItems: 'center', marginTop: SPACING.lg },
  switchText: { fontSize: FONT.sm, color: COLORS.textMuted },
  switchLink: { color: COLORS.accent, fontWeight: '700' },

  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONT.sm, marginTop: SPACING.lg },
});
