import type { NavigatorScreenParams } from '@react-navigation/native';

export type UserRole = 'customer' | 'vendor';
export type ThemePreference = 'system' | 'light' | 'dark';
export type OrderStatus = 'pending' | 'paid' | 'packing' | 'shipped' | 'delivered';

export interface AppProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  preferredLocale: string;
  currencyCode: string;
  themePreference: ThemePreference;
  expoPushToken?: string | null;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currencyCode: string;
  imageUrl: string;
  imagePath?: string | null;
  barcode: string;
  stock: number;
  featured: boolean;
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  currencyCode: string;
  shippingAddress: string;
  paymentLast4: string;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
}

export interface CheckoutInput {
  userId: string;
  items: CartItem[];
  shippingAddress: string;
  paymentLast4: string;
  currencyCode: string;
}

export interface ProductDraft {
  title: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  barcode: string;
  imageUri?: string;
}

export type ShopStackParamList = {
  Catalog: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
};

export type AccountStackParamList = {
  AccountHome: undefined;
  VendorUpload: undefined;
};

export type MainTabParamList = {
  Shop: NavigatorScreenParams<ShopStackParamList>;
  Scanner: undefined;
  Stores: undefined;
  Wishlist: undefined;
  Orders: NavigatorScreenParams<OrdersStackParamList>;
  Account: NavigatorScreenParams<AccountStackParamList>;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};
