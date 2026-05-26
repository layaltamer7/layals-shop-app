import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Banner } from '../components/Banner';
import { Screen } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import { buzzLight, cacheViewedProduct, createProductDeepLink } from '../services/deviceService';
import { getProductById, getWishlistProductIds, toggleWishlist } from '../services/shopService';
import { useCartStore } from '../store/cartStore';
import type { Product, ShopStackParamList } from '../types';

type Props = NativeStackScreenProps<ShopStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ navigation, route }: Props) {
  const { profile } = useAuth();
  const { palette, formatCurrency } = useSettings();
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    getProductById(route.params.productId)
      .then(async (item) => {
        setProduct(item);
        if (item) {
          await cacheViewedProduct(item);
        }
      })
      .catch(() => Alert.alert('Product not found', 'Try returning to the catalog and reloading.'));
  }, [route.params.productId]);

  useEffect(() => {
    if (!profile || !product) {
      return;
    }

    getWishlistProductIds(profile.id).then((ids) => setInWishlist(ids.includes(product.id)));
  }, [product, profile]);

  const deepLink = useMemo(() => createProductDeepLink(route.params.productId), [route.params.productId]);

  if (!product) {
    return (
      <Screen>
        <Text style={{ color: palette.text }}>Loading product...</Text>
      </Screen>
    );
  }

  const addToCart = async () => {
    addItem(product);
    await buzzLight();
    Alert.alert('Added to cart', `${product.title} was added to your shopping cart.`);
  };

  const handleWishlist = async () => {
    if (!profile) {
      return;
    }
    const ids = await toggleWishlist(profile.id, product.id);
    setInWishlist(ids.includes(product.id));
  };

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={{ color: palette.primary, fontWeight: '700' }}>Back</Text>
      </Pressable>

      <Image source={{ uri: product.imageUrl }} style={styles.image} />

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.category, { color: palette.primary }]}>{product.category}</Text>
        <Text style={[styles.title, { color: palette.text }]}>{product.title}</Text>
        <Text style={[styles.price, { color: palette.text }]}>{formatCurrency(product.price, product.currencyCode)}</Text>
        <Text style={[styles.description, { color: palette.mutedText }]}>{product.description}</Text>
        <Banner title={`Barcode: ${product.barcode}`} />
        <Banner title={`Deep link: ${deepLink}`} />

        <View style={styles.actionRow}>
          <Pressable onPress={addToCart} style={[styles.primaryButton, { backgroundColor: palette.primary }]}>
            <Text style={styles.primaryButtonText}>Add to cart</Text>
          </Pressable>
          <Pressable onPress={handleWishlist} style={[styles.secondaryButton, { borderColor: palette.border }]}>
            <Text style={{ color: palette.text, fontWeight: '700' }}>{inWishlist ? 'Saved' : 'Wishlist'}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 280,
    borderRadius: 28,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  category: {
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '800',
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    lineHeight: 22,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 15,
  },
});
