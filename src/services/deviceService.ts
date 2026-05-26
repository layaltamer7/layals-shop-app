import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';

import type { Order, Product } from '../types';

const CACHE_FILE_URI = `${FileSystem.documentDirectory}recent-products.json`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function cacheViewedProduct(product: Product) {
  const current = await readCachedProducts();
  const deduped = [product, ...current.filter((item) => item.id !== product.id)].slice(0, 10);
  await FileSystem.writeAsStringAsync(CACHE_FILE_URI, JSON.stringify(deduped));
}

export async function readCachedProducts(): Promise<Product[]> {
  const info = await FileSystem.getInfoAsync(CACHE_FILE_URI);
  if (!info.exists) {
    return [];
  }

  const raw = await FileSystem.readAsStringAsync(CACHE_FILE_URI);
  return JSON.parse(raw) as Product[];
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  if (!projectId) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function schedulePromoNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekend drop',
      body: 'Your saved items just got a limited-time discount.',
    },
    trigger: { seconds: 4, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}

export async function scheduleOrderNotification(order: Order) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Order update',
      body: `Order ${order.id.slice(0, 8)} is confirmed and being packed.`,
    },
    trigger: null,
  });
}

export async function showForegroundNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null,
  });
}

export async function exportReceiptPdf(order: Order, customerName: string) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${item.product.title}</td>
          <td>${item.quantity}</td>
          <td>${item.product.currencyCode} ${item.product.price.toFixed(2)}</td>
        </tr>`,
    )
    .join('');

  const html = `
    <html>
      <body style="font-family: Arial; padding: 24px;">
        <h1>Layal's shop Receipt</h1>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <table style="width:100%; border-collapse: collapse;" border="1" cellspacing="0" cellpadding="8">
          <thead>
            <tr>
              <th align="left">Product</th>
              <th align="left">Qty</th>
              <th align="left">Price</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;"><strong>Total:</strong> ${order.currencyCode} ${order.totalAmount.toFixed(2)}</p>
        <p><strong>Payment:</strong> **** **** **** ${order.paymentLast4}</p>
        <p><strong>Shipping:</strong> ${order.shippingAddress}</p>
      </body>
    </html>`;

  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  }

  return file.uri;
}

export async function buzzLight() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function buzzSuccess() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function getBatteryAwareSyncState() {
  const power = await Battery.getPowerStateAsync();
  const batteryLevel = power.batteryLevel ?? 1;
  return {
    lowPowerMode: power.lowPowerMode ?? false,
    batteryLevel,
    syncPaused: batteryLevel <= 0.2 && !power.lowPowerMode ? true : (power.lowPowerMode ?? false),
  };
}

export function createProductDeepLink(productId: string) {
  return Linking.createURL(`/product/${productId}`);
}
