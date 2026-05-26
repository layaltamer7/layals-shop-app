import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import { getOrders } from '../services/shopService';
import type { Order, OrdersStackParamList } from '../types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrdersList'>;

export function OrdersScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const { palette, formatCurrency, t } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadOrdersPage = async (nextPage = 0, replace = false) => {
    if (!profile) {
      return;
    }

    const result = await getOrders(profile.id, nextPage);
    setOrders((current) => (replace ? result.data : [...current, ...result.data]));
    setHasMore(result.hasMore);
    setPage(nextPage);
  };

  useEffect(() => {
    loadOrdersPage(0, true).catch((error) => Alert.alert('Unable to load orders', String(error)));
  }, [profile?.id]);

  return (
    <Screen>
      <Text style={[styles.title, { color: palette.text }]}>{t('orders')}</Text>
      <Text style={[styles.subtitle, { color: palette.mutedText }]}>
        Order history is pulled from Supabase with pagination and per-order detail screens.
      </Text>

      {orders.length === 0 ? <Text style={{ color: palette.mutedText }}>{t('emptyOrders')}</Text> : null}

      {orders.map((order) => (
        <Pressable
          key={order.id}
          onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
          style={[styles.orderCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <View style={styles.row}>
            <Text style={[styles.orderId, { color: palette.text }]}>{order.id.slice(0, 12)}</Text>
            <Text style={{ color: palette.primary, fontWeight: '700' }}>{order.status}</Text>
          </View>
          <Text style={{ color: palette.mutedText }}>{new Date(order.createdAt).toLocaleString()}</Text>
          <Text style={{ color: palette.text, fontWeight: '700' }}>{formatCurrency(order.totalAmount, order.currencyCode)}</Text>
        </Pressable>
      ))}

      {hasMore ? (
        <Pressable onPress={() => loadOrdersPage(page + 1)} style={[styles.moreButton, { backgroundColor: palette.primary }]}>
          <Text style={styles.moreButtonText}>Load more orders</Text>
        </Pressable>
      ) : null}
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
  orderCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderId: {
    fontWeight: '800',
    fontSize: 16,
  },
  moreButton: {
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 14,
  },
  moreButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
