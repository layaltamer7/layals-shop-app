import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { ProductCard } from '../components/ProductCard';
import { Screen } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import { buzzLight } from '../services/deviceService';
import { getWishlistProducts, toggleWishlist } from '../services/shopService';
import { useCartStore } from '../store/cartStore';
import type { MainTabParamList, Product } from '../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Wishlist'>;

export function WishlistScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const { palette, t } = useSettings();
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);

  const loadWishlist = async () => {
    if (!profile) {
      return;
    }
    setProducts(await getWishlistProducts(profile.id));
  };

  useEffect(() => {
    loadWishlist().catch((error) => Alert.alert('Unable to load wishlist', String(error)));
  }, [profile?.id]);

  if (!profile) {
    return (
      <Screen>
        <Text style={{ color: palette.text }}>Sign in to use the wishlist.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Text style={[styles.title, { color: palette.text }]}>{t('wishlist')}</Text>
            <Text style={[styles.subtitle, { color: palette.mutedText }]}>
              Favourite products are stored in the wishlist table and synced per user.
            </Text>
          </>
        }
        ListEmptyComponent={<Text style={{ color: palette.mutedText, paddingTop: 20 }}>{t('emptyWishlist')}</Text>}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('Shop', { screen: 'ProductDetail', params: { productId: item.id } })}
            onAddToCart={async () => {
              addItem(item);
              await buzzLight();
            }}
            onToggleWishlist={async () => {
              await toggleWishlist(profile.id, item.id);
              await loadWishlist();
            }}
            inWishlist
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 14,
  },
});
