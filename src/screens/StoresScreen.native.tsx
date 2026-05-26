import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import { Screen } from '../components/Screen';
import { useSettings } from '../providers/SettingsProvider';
import { getStores } from '../services/shopService';
import type { MainTabParamList, StoreLocation } from '../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Stores'>;

type UserCoords = {
  latitude: number;
  longitude: number;
};

function distanceInKm(from: UserCoords, to: UserCoords) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function StoresScreen(_: Props) {
  const { palette } = useSettings();
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);

  useEffect(() => {
    getStores().then(setStores);
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        return;
      }
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    });
  }, []);

  const sortedStores = useMemo(() => {
    if (!userCoords) {
      return stores;
    }

    return [...stores].sort(
      (left, right) => distanceInKm(userCoords, left) - distanceInKm(userCoords, right),
    );
  }, [stores, userCoords]);

  const region = userCoords
    ? {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }
    : {
        latitude: 30.0444,
        longitude: 31.2357,
        latitudeDelta: 0.35,
        longitudeDelta: 0.35,
      };

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: palette.text }]}>Store locator</Text>
        <Text style={[styles.subtitle, { color: palette.mutedText }]}>
          Nearby stores are shown using the device GPS position and an interactive map view.
        </Text>

        <View style={[styles.mapWrap, { borderColor: palette.border }]}>
          <MapView style={styles.map} initialRegion={region} region={region}>
            {userCoords ? (
              <Marker coordinate={userCoords} title="You are here" pinColor={palette.primary} />
            ) : null}
            {stores.map((store) => (
              <Marker
                key={store.id}
                coordinate={{ latitude: store.latitude, longitude: store.longitude }}
                title={store.name}
                description={store.address}
              />
            ))}
          </MapView>
        </View>

        <View style={styles.list}>
          {sortedStores.map((store) => (
            <Pressable
              key={store.id}
              onPress={() => Alert.alert(store.name, `${store.address}\n${store.phone}`)}
              style={[styles.storeCard, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Text style={[styles.storeName, { color: palette.text }]}>{store.name}</Text>
              <Text style={{ color: palette.mutedText }}>{store.address}</Text>
              <Text style={{ color: palette.primary, fontWeight: '700' }}>{store.phone}</Text>
              {userCoords ? (
                <Text style={{ color: palette.mutedText }}>
                  {distanceInKm(userCoords, store).toFixed(1)} km away
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    lineHeight: 22,
  },
  mapWrap: {
    minHeight: 280,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  list: {
    gap: 12,
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
