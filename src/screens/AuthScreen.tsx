import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import type { UserRole } from '../types';

function Field({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
}) {
  const { palette } = useSettings();

  return (
    <View style={[styles.fieldWrap, { backgroundColor: palette.input, borderColor: palette.border }]}>
      <Ionicons name={icon} size={18} color={palette.primary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.mutedText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, { color: palette.text }]}
      />
    </View>
  );
}

export function AuthScreen() {
  const { signIn, signUp, usingDemoMode } = useAuth();
  const { palette } = useSettings();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('layal@example.com');
  const [password, setPassword] = useState('12345678');
  const [fullName, setFullName] = useState('Layal Tamer');
  const [role, setRole] = useState<UserRole>('customer');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp({ email: email.trim(), password, fullName: fullName.trim(), role });
      }
    } catch (error) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll={false} contentStyle={{ padding: 0 }}>
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        <View style={[styles.orb, styles.orbOne, { backgroundColor: palette.heroStart }]} />
        <View style={[styles.orb, styles.orbTwo, { backgroundColor: palette.heroEnd }]} />
        <View style={[styles.orb, styles.orbThree, { backgroundColor: palette.accent }]} />

        <View style={styles.top}>
          <Text style={[styles.brandKicker, { color: palette.primary }]}>Fashion commerce</Text>
          <Text style={[styles.brandTitle, { color: palette.text }]}>Layal&apos;s shop</Text>
          <Text style={[styles.brandSubtitle, { color: palette.mutedText }]}>
            Sign in first, then explore colorful collections, wishlist picks, live stock updates, barcode scanning, and secure checkout.
          </Text>
        </View>

        <View style={[styles.shell, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <View style={styles.modeRow}>
            {(['signin', 'signup'] as const).map((value) => {
              const active = mode === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setMode(value)}
                  style={[
                    styles.modeChip,
                    {
                      backgroundColor: active ? palette.primary : palette.chip,
                      borderColor: active ? palette.primary : palette.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#fff' : palette.text, fontWeight: '800' }}>
                    {value === 'signin' ? 'Login' : 'Sign Up'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <LinearGradient colors={[palette.heroStart, palette.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.callout}>
            <Text style={styles.calloutTitle}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
            <Text style={styles.calloutText}>
              {mode === 'signin'
                ? 'Login with your email and password to access your cart, orders, and saved fashion favorites.'
                : 'Sign up to save your wishlist, place orders, and manage your shopping profile.'}
            </Text>
          </LinearGradient>

          <View style={styles.form}>
            {mode === 'signup' ? <Field icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Full name" /> : null}

            <Field icon="mail-outline" value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
            <Field icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

            {mode === 'signup' ? (
              <View style={styles.roleRow}>
                {(['customer', 'vendor'] as const).map((value) => {
                  const active = role === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setRole(value)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: active ? palette.accentSoft : palette.surface,
                          borderColor: active ? palette.accent : palette.border,
                        },
                      ]}
                    >
                      <Text style={{ color: palette.text, fontWeight: '700' }}>
                        {value === 'customer' ? 'Customer' : 'Vendor'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Pressable onPress={handleSubmit} disabled={submitting} style={styles.ctaWrap}>
              <LinearGradient colors={[palette.primary, palette.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <Text style={styles.ctaText}>{submitting ? 'Please wait...' : mode === 'signin' ? 'Login' : 'Sign Up'}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {usingDemoMode ? (
            <View style={[styles.notice, { backgroundColor: palette.banner, borderColor: palette.secondary }]}>
              <Ionicons name="sparkles-outline" size={18} color={palette.secondary} />
              <Text style={[styles.noticeText, { color: palette.text }]}>
                Demo mode is on. The login screen still appears first, and you can explore the full UI without real backend credentials.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 28,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.17,
  },
  orbOne: {
    width: 220,
    height: 220,
    top: -40,
    right: -50,
  },
  orbTwo: {
    width: 180,
    height: 180,
    top: 210,
    left: -70,
  },
  orbThree: {
    width: 240,
    height: 240,
    bottom: -90,
    right: -60,
  },
  top: {
    gap: 8,
    marginBottom: 24,
  },
  brandKicker: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  brandSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    maxWidth: '92%',
  },
  shell: {
    borderWidth: 1,
    borderRadius: 34,
    padding: 18,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 6,
    gap: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  callout: {
    borderRadius: 26,
    padding: 18,
    gap: 6,
  },
  calloutTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  calloutText: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 20,
  },
  form: {
    gap: 12,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
  },
  ctaWrap: {
    marginTop: 4,
  },
  cta: {
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  notice: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
    fontWeight: '600',
  },
});
