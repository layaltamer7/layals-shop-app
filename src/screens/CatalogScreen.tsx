import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Banner } from '../components/Banner';
import { ProductCard } from '../components/ProductCard';
import { Screen } from '../components/Screen';
import { useBatteryStatus } from '../hooks/useBatteryStatus';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import { buzzLight } from '../services/deviceService';
import { getCategories, getProducts, getWishlistProductIds, subscribeToProductRealtime, toggleWishlist } from '../services/shopService';
import { useCartStore } from '../store/cartStore';
import type { Product, ShopStackParamList } from '../types';

export function CatalogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const { profile } = useAuth();
  const { palette, t } = useSettings();
  const { isConnected } = useNetworkStatus();
  const { syncPaused, batteryLevel } = useBatteryStatus();
  const addItem = useCartStore((state) => state.addItem);
  const cartCount = useCartStore((state) => state.getCount());
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [nextProducts, nextCategories] = await Promise.all([getProducts({ category, search }), getCategories()]);
    setProducts(nextProducts);
    setCategories(nextCategories);
    if (profile) {
      setWishlistIds(await getWishlistProductIds(profile.id));
    }
  };

  useEffect(() => {
    loadData()
      .catch((error) => Alert.alert('Unable to load products', error instanceof Error ? error.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, [category, profile?.id, search]);

  useEffect(() => {
    const channel = subscribeToProductRealtime(() => {
      if (!syncPaused) {
        loadData().catch(() => undefined);
      }
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [category, search, syncPaused]);

  const refresh = async () => {
    if (syncPaused) {
      Alert.alert('Sync paused', 'Battery is low, so auto-sync is paused. Recharge or disable low-power mode to resume.');
      return;
    }

    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddToCart = async (product: Product) => {
    addItem(product);
    await buzzLight();
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!profile) {
      return;
    }

    const next = await toggleWishlist(profile.id, productId);
    setWishlistIds(next);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient colors={[palette.heroStart, palette.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroText}>
            <Text style={styles.heroKicker}>New season</Text>
            <Text style={styles.heroTitle}>{t('appTitle')}</Text>
            <Text style={styles.heroSubtitle}>
              Colorful daily style, curated outfits, barcode lookup, and fast checkout in one polished shopping app.
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Cart')} style={styles.cartBubble}>
            <Ionicons name="bag-handle" size={20} color="#fff" />
            <Text style={styles.cartBubbleText}>{cartCount}</Text>
          </Pressable>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNumber}>{products.length}</Text>
            <Text style={styles.heroStatLabel}>Styles</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNumber}>{wishlistIds.length}</Text>
            <Text style={styles.heroStatLabel}>Saved</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNumber}>{profile?.role === 'vendor' ? 'Vendor' : 'Shopper'}</Text>
            <Text style={styles.heroStatLabel}>Mode</Text>
          </View>
        </View>
      </LinearGradient>

      {!isConnected ? <Banner title={t('offlineMode')} tone="warning" /> : null}
      {syncPaused ? <Banner title={`${t('syncPaused')} - ${Math.round(batteryLevel * 100)}%`} tone="warning" /> : null}
      {!isConnected ? <Banner title={t('recentCache')} /> : null}

      <View style={[styles.searchWrap, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Ionicons name="search-outline" size={18} color={palette.primary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search dresses, denim, blazers, or barcode"
          placeholderTextColor={palette.mutedText}
          style={[styles.search, { color: palette.text }]}
        />
      </View>

      <View style={styles.chips}>
        {categories.map((item) => {
          const active = category === item;
          return (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? palette.primary : palette.chip,
                  borderColor: active ? palette.primary : palette.border,
                },
              ]}
            >
              <Text style={{ color: active ? '#fff' : palette.text, fontWeight: '800' }}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  if (loading) {
    return (
      <Screen contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.primary} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            onAddToCart={() => handleAddToCart(item)}
            onToggleWishlist={() => handleToggleWishlist(item.id)}
            inWishlist={wishlistIds.includes(item.id)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
    gap: 18,
  },
  header: {
    gap: 16,
    marginBottom: 16,
  },
  hero: {
    borderRadius: 32,
    padding: 20,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroText: {
    flex: 1,
    gap: 8,
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.88)',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '800',
    fontSize: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
    fontSize: 15,
  },
  cartBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cartBubbleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroStatNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.84)',
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  searchWrap: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  search: {
    flex: 1,
    minHeight: 52,
    fontSize: 15,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
});
