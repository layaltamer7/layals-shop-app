import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { useSettings } from '../providers/SettingsProvider';
import { useCartStore } from '../store/cartStore';
import type { ShopStackParamList } from '../types';

type Props = NativeStackScreenProps<ShopStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { palette, formatCurrency } = useSettings();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const subtotal = useCartStore((state) => state.getSubtotal());

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={{ color: palette.primary, fontWeight: '700' }}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>Shopping cart</Text>

      {items.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>Your cart is empty</Text>
          <Text style={{ color: palette.mutedText }}>Add fashion pieces from the catalog or scan a barcode to build your order.</Text>
        </View>
      ) : null}

      {items.map((item) => (
        <View key={item.product.id} style={[styles.rowCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.itemTitle, { color: palette.text }]}>{item.product.title}</Text>
            <Text style={{ color: palette.mutedText }}>{formatCurrency(item.product.price, item.product.currencyCode)}</Text>
          </View>

          <View style={styles.qtyRow}>
            <Pressable onPress={() => updateQuantity(item.product.id, item.quantity - 1)} style={[styles.qtyButton, { borderColor: palette.border }]}>
              <Text style={{ color: palette.text, fontWeight: '700' }}>-</Text>
            </Pressable>
            <Text style={[styles.qtyText, { color: palette.text }]}>{item.quantity}</Text>
            <Pressable onPress={() => updateQuantity(item.product.id, item.quantity + 1)} style={[styles.qtyButton, { borderColor: palette.border }]}>
              <Text style={{ color: palette.text, fontWeight: '700' }}>+</Text>
            </Pressable>
            <Pressable onPress={() => removeItem(item.product.id)} style={[styles.removeButton, { backgroundColor: palette.danger }]}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={[styles.summary, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.summaryText, { color: palette.text }]}>Subtotal</Text>
        <Text style={[styles.summaryAmount, { color: palette.text }]}>{formatCurrency(subtotal)}</Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate('Checkout')}
        disabled={items.length === 0}
        style={[styles.checkoutButton, { backgroundColor: palette.primary, opacity: items.length > 0 ? 1 : 0.4 }]}
      >
        <Text style={styles.checkoutButtonText}>Go to secure checkout</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    width: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  removeButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 'auto',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  summary: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  checkoutButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
