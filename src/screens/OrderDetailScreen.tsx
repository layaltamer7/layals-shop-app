import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import { getOrderById } from '../services/shopService';
import type { Order, OrdersStackParamList } from '../types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;

export function OrderDetailScreen({ navigation, route }: Props) {
  const { profile } = useAuth();
  const { palette, formatCurrency } = useSettings();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    getOrderById(profile.id, route.params.orderId).then(setOrder);
  }, [profile, route.params.orderId]);

  if (!order) {
    return (
      <Screen>
        <Text style={{ color: palette.text }}>Loading order…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={{ color: palette.primary, fontWeight: '700' }}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>Order detail</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.id, { color: palette.text }]}>{order.id}</Text>
        <Text style={{ color: palette.primary, fontWeight: '700' }}>{order.status}</Text>
        <Text style={{ color: palette.mutedText }}>{new Date(order.createdAt).toLocaleString()}</Text>
        <Text style={{ color: palette.mutedText }}>{order.shippingAddress}</Text>
      </View>

      {order.items.map((item) => (
        <View key={item.product.id} style={[styles.item, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={{ color: palette.text, fontWeight: '700' }}>{item.product.title}</Text>
          <Text style={{ color: palette.mutedText }}>
            {item.quantity} × {formatCurrency(item.product.price, item.product.currencyCode)}
          </Text>
        </View>
      ))}

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={{ color: palette.text, fontWeight: '800' }}>
          Total: {formatCurrency(order.totalAmount, order.currencyCode)}
        </Text>
        <Text style={{ color: palette.mutedText }}>Paid with card ending in {order.paymentLast4}</Text>
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
    gap: 8,
  },
  id: {
    fontSize: 18,
    fontWeight: '800',
  },
  item: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
});
