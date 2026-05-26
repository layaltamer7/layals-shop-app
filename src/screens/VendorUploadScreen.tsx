import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { Banner } from '../components/Banner';
import { Screen } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import { createVendorProduct, uploadProductImage } from '../services/shopService';
import type { AccountStackParamList, ProductDraft } from '../types';

type Props = NativeStackScreenProps<AccountStackParamList, 'VendorUpload'>;

const initialDraft: ProductDraft = {
  title: '',
  description: '',
  category: 'Accessories',
  price: '99',
  stock: '10',
  barcode: `${Date.now()}`.slice(-13).padEnd(13, '0'),
};

export function VendorUploadScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const { palette } = useSettings();
  const [draft, setDraft] = useState<ProductDraft>(initialDraft);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (mode: 'library' | 'camera') => {
    const permission =
      mode === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to continue uploading product images.');
      return;
    }

    const result =
      mode === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });

    if (!result.canceled) {
      setDraft((current) => ({ ...current, imageUri: result.assets[0].uri }));
    }
  };

  const submit = async () => {
    if (!profile) {
      return;
    }

    if (!draft.title || !draft.description || !draft.imageUri) {
      Alert.alert('Missing fields', 'Add the product text fields and select an image before saving.');
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = await uploadProductImage(profile.id, draft.imageUri);
      await createVendorProduct(profile, draft, imageUrl);
      Alert.alert('Product uploaded', 'The product image and catalog record were saved.');
      setDraft(initialDraft);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={{ color: palette.primary, fontWeight: '700' }}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>Vendor collection upload</Text>
      <Banner title="Capture or choose a clothing photo, upload it to storage, and create the catalog row." />

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <TextInput
          value={draft.title}
          onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
          placeholder="Clothing item title"
          placeholderTextColor={palette.mutedText}
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
        />
        <TextInput
          value={draft.description}
          onChangeText={(value) => setDraft((current) => ({ ...current, description: value }))}
          placeholder="Description"
          placeholderTextColor={palette.mutedText}
          multiline
          style={[styles.input, styles.multiline, { borderColor: palette.border, color: palette.text }]}
        />
        <TextInput
          value={draft.category}
          onChangeText={(value) => setDraft((current) => ({ ...current, category: value }))}
          placeholder="Category"
          placeholderTextColor={palette.mutedText}
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
        />
        <View style={styles.row}>
          <TextInput
            value={draft.price}
            onChangeText={(value) => setDraft((current) => ({ ...current, price: value }))}
            placeholder="Price"
            keyboardType="decimal-pad"
            placeholderTextColor={palette.mutedText}
            style={[styles.input, styles.half, { borderColor: palette.border, color: palette.text }]}
          />
          <TextInput
            value={draft.stock}
            onChangeText={(value) => setDraft((current) => ({ ...current, stock: value }))}
            placeholder="Stock"
            keyboardType="number-pad"
            placeholderTextColor={palette.mutedText}
            style={[styles.input, styles.half, { borderColor: palette.border, color: palette.text }]}
          />
        </View>
        <TextInput
          value={draft.barcode}
          onChangeText={(value) => setDraft((current) => ({ ...current, barcode: value }))}
          placeholder="Barcode"
          keyboardType="number-pad"
          placeholderTextColor={palette.mutedText}
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
        />

        {draft.imageUri ? <Image source={{ uri: draft.imageUri }} style={styles.preview} /> : null}

        <View style={styles.row}>
          <Pressable onPress={() => pickImage('camera')} style={[styles.secondaryButton, { borderColor: palette.border }]}>
            <Text style={{ color: palette.text, fontWeight: '700' }}>Use camera</Text>
          </Pressable>
          <Pressable onPress={() => pickImage('library')} style={[styles.secondaryButton, { borderColor: palette.border }]}>
            <Text style={{ color: palette.text, fontWeight: '700' }}>Choose photo</Text>
          </Pressable>
        </View>

        <Pressable onPress={submit} disabled={submitting} style={[styles.primaryButton, { backgroundColor: palette.primary }]}>
          <Text style={styles.primaryButtonText}>{submitting ? 'Uploading...' : 'Upload item'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 14,
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
});
