import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Banner } from '../components/Banner';
import { Screen } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import {
  registerForPushNotificationsAsync,
  schedulePromoNotification,
  showForegroundNotification,
} from '../services/deviceService';
import { subscribeToNotifications } from '../services/shopService';
import type { AccountStackParamList } from '../types';

type Props = NativeStackScreenProps<AccountStackParamList, 'AccountHome'>;

export function AccountScreen({ navigation }: Props) {
  const { profile, signOut, savePushToken } = useAuth();
  const { palette, locale, currencyCode, themePreference, setThemePreference } = useSettings();
  const [pushToken, setPushToken] = useState<string | null>(profile?.expoPushToken ?? null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const channel = subscribeToNotifications(profile.id, async ({ title, body }) => {
      await showForegroundNotification(title, body);
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [profile?.id]);

  const registerPush = async () => {
    const token = await registerForPushNotificationsAsync();
    await savePushToken(token);
    setPushToken(token);
    Alert.alert('Push registration', token ? 'Push token saved to the profile.' : 'Notifications are unavailable on this device or project config.');
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: palette.text }]}>Account & settings</Text>

      {profile ? (
        <View style={[styles.profileCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.name, { color: palette.text }]}>{profile.fullName}</Text>
          <Text style={{ color: palette.mutedText }}>{profile.email}</Text>
          <Text style={{ color: palette.primary, fontWeight: '700' }}>Role: {profile.role}</Text>
        </View>
      ) : null}

      <Banner title={`Locale: ${locale} • Currency: ${currencyCode}`} />
      <Banner title={`Current theme preference: ${themePreference}`} />
      <Banner title={pushToken ? 'Push notifications configured' : 'Push notifications not configured yet'} tone={pushToken ? 'success' : 'warning'} />

      <View style={styles.preferenceRow}>
        {(['system', 'light', 'dark'] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setThemePreference(value)}
            style={[
              styles.preferenceChip,
              {
                backgroundColor: themePreference === value ? palette.primary : palette.card,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={{ color: themePreference === value ? '#fff' : palette.text, fontWeight: '700' }}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={registerPush} style={[styles.primaryButton, { backgroundColor: palette.primary }]}>
        <Text style={styles.primaryButtonText}>Register push notifications</Text>
      </Pressable>

      <Pressable onPress={() => schedulePromoNotification()} style={[styles.secondaryButton, { borderColor: palette.border }]}>
        <Text style={{ color: palette.text, fontWeight: '700' }}>Trigger promo notification</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('VendorUpload')} style={[styles.secondaryButton, { borderColor: palette.border }]}>
        <Text style={{ color: palette.text, fontWeight: '700' }}>Open vendor collection upload</Text>
      </Pressable>

      <Pressable
        onPress={async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Sign out failed', String(error));
          }
        }}
        style={[styles.dangerButton, { backgroundColor: palette.danger }]}
      >
        <Text style={styles.primaryButtonText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  preferenceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  preferenceChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
  },
  primaryButton: {
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 15,
  },
  dangerButton: {
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 15,
  },
});
