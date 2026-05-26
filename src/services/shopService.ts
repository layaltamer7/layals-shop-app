import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { mockProducts, mockStores } from '../data/mockData';
import { supabase } from '../lib/supabase';
import type { AppProfile, CheckoutInput, Order, Product, ProductDraft, ProductFilters, StoreLocation } from '../types';

const LOCAL_WISHLIST_PREFIX = 'shop-app:wishlist:';
const LOCAL_ORDERS_PREFIX = 'shop-app:orders:';
const LOCAL_PRODUCTS_KEY = 'shop-app:vendor-products';

function sortProducts(products: Product[]) {
  return [...products].sort((left, right) => Number(right.featured) - Number(left.featured) || left.title.localeCompare(right.title));
}

function applyProductFilters(products: Product[], filters?: ProductFilters) {
  return products.filter((product) => {
    const categoryMatches = !filters?.category || filters.category === 'All' || product.category === filters.category;
    const searchText = filters?.search?.trim().toLowerCase();
    const searchMatches =
      !searchText ||
      product.title.toLowerCase().includes(searchText) ||
      product.description.toLowerCase().includes(searchText) ||
      product.barcode.includes(searchText);

    return categoryMatches && searchMatches;
  });
}

async function getLocalVendorProducts(): Promise<Product[]> {
  const raw = await AsyncStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as Product[];
}

async function setLocalVendorProducts(products: Product[]) {
  await AsyncStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

function mapSupabaseProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    price: Number(row.price),
    currencyCode: 'EGP',
    imageUrl: String(row.image_url ?? ''),
    imagePath: row.image_path ? String(row.image_path) : null,
    barcode: String(row.barcode ?? ''),
    stock: Number(row.stock ?? 0),
    featured: Boolean(row.featured),
    vendorId: String(row.vendor_id ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  try {
    if (supabase) {
      let query = supabase.from('products').select('*').order('featured', { ascending: false }).order('title');

      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      if (filters?.search?.trim()) {
        query = query.or(
          `title.ilike.%${filters.search.trim()}%,description.ilike.%${filters.search.trim()}%,barcode.ilike.%${filters.search.trim()}%`,
        );
      }

      const result = await query;
      if (result.error) {
        throw result.error;
      }

      return result.data.map((row) => mapSupabaseProduct(row as Record<string, unknown>));
    }
  } catch {
    // Fall back to the local dataset so the app still runs in demo mode.
  }

  const localProducts = [...mockProducts, ...(await getLocalVendorProducts())];
  return applyProductFilters(sortProducts(localProducts), filters);
}

export async function getProductById(productId: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((item) => item.id === productId) ?? null;
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((item) => item.barcode === barcode) ?? null;
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts();
  return ['All', ...Array.from(new Set(products.map((product) => product.category)))];
}

export async function getStores(): Promise<StoreLocation[]> {
  if (!supabase) {
    return mockStores;
  }

  const result = await supabase.from('stores').select('*').order('name');
  if (result.error) {
    return mockStores;
  }

  return result.data.map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
  }));
}

function wishlistKey(userId: string) {
  return `${LOCAL_WISHLIST_PREFIX}${userId}`;
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  if (!supabase) {
    const raw = await AsyncStorage.getItem(wishlistKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  }

  const result = await supabase.from('wishlists').select('product_id').eq('user_id', userId);
  if (result.error) {
    return [];
  }

  return result.data.map((row) => row.product_id);
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  const ids = await getWishlistProductIds(userId);
  const products = await getProducts();
  return products.filter((product) => ids.includes(product.id));
}

export async function toggleWishlist(userId: string, productId: string) {
  if (!supabase) {
    const current = await getWishlistProductIds(userId);
    const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
    await AsyncStorage.setItem(wishlistKey(userId), JSON.stringify(next));
    return next;
  }

  const current = await getWishlistProductIds(userId);
  if (current.includes(productId)) {
    await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId);
  } else {
    await supabase.from('wishlists').insert({ user_id: userId, product_id: productId });
  }

  return getWishlistProductIds(userId);
}

function orderKey(userId: string) {
  return `${LOCAL_ORDERS_PREFIX}${userId}`;
}

async function getLocalOrders(userId: string): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(orderKey(userId));
  return raw ? (JSON.parse(raw) as Order[]) : [];
}

async function setLocalOrders(userId: string, orders: Order[]) {
  await AsyncStorage.setItem(orderKey(userId), JSON.stringify(orders));
}

function mapSupabaseOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    items: (row.items as Order['items']) ?? [],
    status: row.status as Order['status'],
    totalAmount: Number(row.total_amount),
    currencyCode: 'EGP',
    shippingAddress: String(row.shipping_address),
    paymentLast4: String(row.payment_last4),
    createdAt: String(row.created_at),
  };
}

export async function createOrder(input: CheckoutInput): Promise<Order> {
  const totalAmount = input.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const nextOrder: Order = {
    id: `order-${Date.now()}`,
    userId: input.userId,
    items: input.items,
    status: 'paid',
    totalAmount,
    currencyCode: input.currencyCode,
    shippingAddress: input.shippingAddress,
    paymentLast4: input.paymentLast4,
    createdAt: new Date().toISOString(),
  };

  if (!supabase) {
    const current = await getLocalOrders(input.userId);
    await setLocalOrders(input.userId, [nextOrder, ...current]);
    return nextOrder;
  }

  const result = await supabase
    .from('orders')
    .insert({
      user_id: input.userId,
      items: input.items,
      status: nextOrder.status,
      total_amount: totalAmount,
      currency_code: input.currencyCode,
      shipping_address: input.shippingAddress,
      payment_last4: input.paymentLast4,
    })
    .select('*')
    .single();

  if (result.error) {
    throw result.error;
  }

  for (const item of input.items) {
    await supabase
      .from('products')
      .update({ stock: Math.max(item.product.stock - item.quantity, 0), updated_at: new Date().toISOString() })
      .eq('id', item.product.id);
  }

  await supabase.from('notifications').insert({
    user_id: input.userId,
    title: 'Order confirmed',
    body: `Your order ${result.data.id} is now paid and being prepared.`,
    type: 'order',
    order_id: result.data.id,
  });

  return mapSupabaseOrder(result.data as Record<string, unknown>);
}

export async function getOrders(userId: string, page = 0, pageSize = 5): Promise<{ data: Order[]; hasMore: boolean }> {
  if (!supabase) {
    const orders = await getLocalOrders(userId);
    const start = page * pageSize;
    const next = orders.slice(start, start + pageSize);
    return { data: next, hasMore: start + pageSize < orders.length };
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  const result = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (result.error) {
    throw result.error;
  }

  const total = result.count ?? 0;
  return {
    data: result.data.map((row) => mapSupabaseOrder(row as Record<string, unknown>)),
    hasMore: to + 1 < total,
  };
}

export async function getOrderById(userId: string, orderId: string): Promise<Order | null> {
  const orders = await getOrders(userId, 0, 100);
  return orders.data.find((order) => order.id === orderId) ?? null;
}

export async function createVendorProduct(profile: AppProfile, draft: ProductDraft, imageUrl: string): Promise<Product> {
  const product: Product = {
    id: `vendor-${Date.now()}`,
    title: draft.title,
    description: draft.description,
    category: draft.category,
    price: Number(draft.price),
    currencyCode: profile.currencyCode,
    imageUrl,
    imagePath: imageUrl,
    barcode: draft.barcode,
    stock: Number(draft.stock),
    featured: false,
    vendorId: profile.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!supabase) {
    const current = await getLocalVendorProducts();
    await setLocalVendorProducts([product, ...current]);
    return product;
  }

  const result = await supabase
    .from('products')
    .insert({
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      currency_code: product.currencyCode,
      image_url: product.imageUrl,
      image_path: product.imagePath,
      barcode: product.barcode,
      stock: product.stock,
      featured: product.featured,
      vendor_id: product.vendorId,
    })
    .select('*')
    .single();

  if (result.error) {
    throw result.error;
  }

  return mapSupabaseProduct(result.data as Record<string, unknown>);
}

export async function uploadProductImage(userId: string, uri: string): Promise<string> {
  if (!supabase) {
    return uri;
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  const extension = uri.split('.').pop() ?? 'jpg';
  const fileName = `${userId}/${Date.now()}.${extension}`;
  const result = await supabase.storage.from('product-images').upload(fileName, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: true,
  });

  if (result.error) {
    throw result.error;
  }

  const publicUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
  return publicUrl;
}

export function subscribeToProductRealtime(onChange: () => void): RealtimeChannel | null {
  if (!supabase) {
    return null;
  }

  return supabase
    .channel('products-stock')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, onChange)
    .subscribe();
}

export function subscribeToNotifications(userId: string, onMessage: (payload: { title: string; body: string }) => void): RealtimeChannel | null {
  if (!supabase) {
    return null;
  }

  return supabase
    .channel('user-notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        const next = payload.new as Record<string, string>;
        onMessage({ title: next.title, body: next.body });
      },
    )
    .subscribe();
}

export async function updateProfilePushToken(userId: string, token: string | null) {
  if (!supabase) {
    return;
  }

  await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
}
