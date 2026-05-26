import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Banner } from '../components/Banner';
import { Screen } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import { buzzSuccess, exportReceiptPdf, scheduleOrderNotification, schedulePromoNotification } from '../services/deviceService';
import { createOrder } from '../services/shopService';
import { useCartStore } from '../store/cartStore';
import type { ShopStackParamList } from '../types';

type Props = NativeStackScreenProps<ShopStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation }: Props) {
  const { palette, formatCurrency } = useSettings();
  const { profile } = useAuth();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const [name, setName] = useState(profile?.fullName ?? '');
  const [address, setAddress] = useState('Nasr City, Cairo');
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [submitting, setSubmitting] = useState(false);

  const totalText = useMemo(() => formatCurrency(subtotal, profile?.currencyCode), [formatCurrency, profile?.currencyCode, subtotal]);

  const submit = async () => {
    if (!profile) {
      Alert.alert('Account required', 'Sign in again before checking out.');
      return;
    }

    if (!address || cardNumber.length < 12 || expiry.length < 4 || cvv.length < 3) {
      Alert.alert('Incomplete payment form', 'Fill in your address and valid payment details.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        userId: profile.id,
        items,
        shippingAddress: address,
        paymentLast4: cardNumber.slice(-4),
        currencyCode: profile.currencyCode,
      });
      await buzzSuccess();
      await scheduleOrderNotification(order);
      await schedulePromoNotification();
      await exportReceiptPdf(order, name);
      clearCart();
      Alert.alert('Checkout complete', 'The order was saved, the receipt PDF was generated, and a notification was scheduled.');
      navigation.popToTop();
    } catch (error) {
      Alert.alert('Checkout failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={{ color: palette.primary, fontWeight: '700' }}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>Secure checkout</Text>
      <Banner title="Payment fields are validated locally and only the last four digits are stored with the order record." tone="success" />

      <View style={[styles.formCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={palette.mutedText}
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
        />
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Shipping address"
          placeholderTextColor={palette.mutedText}
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
        />
        <TextInput
          value={cardNumber}
          onChangeText={setCardNumber}
          placeholder="Card number"
          keyboardType="number-pad"
          placeholderTextColor={palette.mutedText}
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
        />
        <View style={styles.row}>
          <TextInput
            value={expiry}
            onChangeText={setExpiry}
            placeholder="MM/YY"
            placeholderTextColor={palette.mutedText}
            style={[styles.input, styles.half, { borderColor: palette.border, color: palette.text }]}
          />
          <TextInput
            value={cvv}
            onChangeText={setCvv}
            placeholder="CVV"
            keyboardType="number-pad"
            placeholderTextColor={palette.mutedText}
            style={[styles.input, styles.half, { borderColor: palette.border, color: palette.text }]}
          />
        </View>
      </View>

      <View style={[styles.summary, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.summaryLabel, { color: palette.text }]}>Order total</Text>
        <Text style={[styles.summaryAmount, { color: palette.text }]}>{totalText}</Text>
      </View>

      <Pressable
        onPress={submit}
        disabled={submitting || items.length === 0}
        style={[styles.button, { backgroundColor: palette.primary, opacity: items.length > 0 ? 1 : 0.4 }]}
      >
        <Text style={styles.buttonText}>{submitting ? 'Placing order...' : 'Pay and create receipt PDF'}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  formCard: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  summary: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontWeight: '700',
  },
  summaryAmount: {
    fontWeight: '800',
    fontSize: 20,
  },
  button: {
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
