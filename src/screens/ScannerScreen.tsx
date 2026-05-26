import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../components/Screen';
import { useSettings } from '../providers/SettingsProvider';
import { buzzLight } from '../services/deviceService';
import { getProductByBarcode } from '../services/shopService';
import { useCartStore } from '../store/cartStore';
import type { MainTabParamList } from '../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Scanner'>;

export function ScannerScreen({ navigation }: Props) {
  const { palette } = useSettings();
  const addItem = useCartStore((state) => state.addItem);
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [lastCode, setLastCode] = useState('');

  const onScan = async (result: BarcodeScanningResult) => {
    if (locked) {
      return;
    }

    setLocked(true);
    setLastCode(result.data);
    const product = await getProductByBarcode(result.data);
    if (!product) {
      Alert.alert('No product found', `Scanned code ${result.data} is not in the catalog.`);
      setTimeout(() => setLocked(false), 1600);
      return;
    }

    addItem(product);
    await buzzLight();
    Alert.alert('Product added', `${product.title} was found and added to your cart.`);
    navigation.navigate('Shop', { screen: 'ProductDetail', params: { productId: product.id } });
    setTimeout(() => setLocked(false), 1600);
  };

  if (!permission) {
    return (
      <Screen>
        <Text style={{ color: palette.text }}>Checking camera permission…</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={[styles.permissionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.permissionTitle, { color: palette.text }]}>Camera access is needed</Text>
          <Text style={{ color: palette.mutedText }}>
            The barcode scanner uses the device camera to find products instantly and add them to the cart.
          </Text>
          <Pressable onPress={requestPermission} style={[styles.button, { backgroundColor: palette.primary }]}>
            <Text style={styles.buttonText}>Allow camera</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: palette.text }]}>Barcode scanner</Text>
        <Text style={[styles.subtitle, { color: palette.mutedText }]}>
          Scan a product barcode to look it up and add it straight to the cart.
        </Text>

        <View style={[styles.cameraFrame, { borderColor: palette.border }]}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
            }}
            onBarcodeScanned={onScan}
          />
        </View>

        <View style={[styles.resultCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.resultLabel, { color: palette.text }]}>Last code</Text>
          <Text style={{ color: palette.mutedText }}>{lastCode || 'Nothing scanned yet.'}</Text>
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
  permissionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  button: {
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
  cameraFrame: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
    minHeight: 420,
  },
  camera: {
    flex: 1,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  resultLabel: {
    fontWeight: '700',
  },
});
