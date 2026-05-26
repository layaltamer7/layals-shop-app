import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';

import { Banner } from '../components/Banner';
import { Screen } from '../components/Screen';
import { useSettings } from '../providers/SettingsProvider';
import { getStores } from '../services/shopService';
import type { MainTabParamList, StoreLocation } from '../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Stores'>;

export function StoresScreen(_: Props) {
  const { palette } = useSettings();
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [locationState, setLocationState] = useState('Requesting location…');

  useEffect(() => {
    getStores().then(setStores);
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setLocationState(
        status === 'granted'
          ? 'Location permission granted. Open the app on Android or iOS to see the interactive map.'
          : 'Location permission was not granted in this browser session.',
      );
    });
  }, []);

  return (
    <Screen>
      <Text style={[styles.title, { color: palette.text }]}>Store locator</Text>
      <Text style={[styles.subtitle, { color: palette.mutedText }]}>
        Web fallback: the native mobile build shows a live map with GPS coordinates and markers using `react-native-maps`.
      </Text>
      <Banner title={locationState} />

      {stores.map((store) => (
        <Pressable
          key={store.id}
          onPress={() => Alert.alert(store.name, `${store.address}\n${store.phone}`)}
          style={[styles.storeCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.storeName, { color: palette.text }]}>{store.name}</Text>
          <Text style={{ color: palette.mutedText }}>{store.address}</Text>
          <Text style={{ color: palette.primary, fontWeight: '700' }}>{store.phone}</Text>
          <Text style={{ color: palette.mutedText }}>
            Coordinates: {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    lineHeight: 22,
  },
  storeCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  storeName: {
    fontSize: 17,
    fontWeight: '700',
  },
});
