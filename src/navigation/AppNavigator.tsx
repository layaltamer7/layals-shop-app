import { NavigationContainer, DefaultTheme, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { AuthScreen } from '../screens/AuthScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { CartScreen } from '../screens/CartScreen';
import { CatalogScreen } from '../screens/CatalogScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { StoresScreen } from '../screens/StoresScreen';
import { VendorUploadScreen } from '../screens/VendorUploadScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../providers/SettingsProvider';
import type {
  AccountStackParamList,
  MainTabParamList,
  OrdersStackParamList,
  RootStackParamList,
  ShopStackParamList,
} from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ShopStack = createNativeStackNavigator<ShopStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'shopapp://', 'https://shopapp.local'],
  config: {
    screens: {
      Auth: 'auth',
      Main: {
        screens: {
          Shop: {
            screens: {
              Catalog: 'shop',
              ProductDetail: 'product/:productId',
              Cart: 'cart',
              Checkout: 'checkout',
            },
          },
          Scanner: 'scanner',
          Stores: 'stores',
          Wishlist: 'wishlist',
          Orders: {
            screens: {
              OrdersList: 'orders',
              OrderDetail: 'orders/:orderId',
            },
          },
          Account: {
            screens: {
              AccountHome: 'account',
              VendorUpload: 'vendor-upload',
            },
          },
        },
      },
    },
  },
};

function ShopStackNavigator() {
  return (
    <ShopStack.Navigator screenOptions={{ headerShown: false }}>
      <ShopStack.Screen name="Catalog" component={CatalogScreen} />
      <ShopStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <ShopStack.Screen name="Cart" component={CartScreen} />
      <ShopStack.Screen name="Checkout" component={CheckoutScreen} />
    </ShopStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList" component={OrdersScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStack.Navigator>
  );
}

function AccountStackNavigator() {
  return (
    <AccountStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountStack.Screen name="AccountHome" component={AccountScreen} />
      <AccountStack.Screen name="VendorUpload" component={VendorUploadScreen} />
    </AccountStack.Navigator>
  );
}

function MainTabs() {
  const { palette } = useSettings();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedText,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: 'transparent',
          height: 78,
          paddingBottom: 10,
          paddingTop: 10,
          borderRadius: 28,
          marginHorizontal: 14,
          marginBottom: 12,
          position: 'absolute',
          elevation: 0,
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Shop: 'bag-handle',
            Scanner: 'scan',
            Stores: 'location',
            Wishlist: 'heart',
            Orders: 'receipt',
            Account: 'person-circle',
          };

          return <Ionicons name={iconMap[route.name]} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Shop" component={ShopStackNavigator} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Stores" component={StoresScreen} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Orders" component={OrdersStackNavigator} />
      <Tab.Screen name="Account" component={AccountStackNavigator} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { loading, profile } = useAuth();
  const { isDark, palette } = useSettings();

  if (loading) {
    return null;
  }

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: palette.background,
          card: palette.card,
          text: palette.text,
          border: palette.border,
          primary: palette.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: palette.background,
          card: palette.card,
          text: palette.text,
          border: palette.border,
          primary: palette.primary,
        },
      };

  return (
    <NavigationContainer linking={linking} theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {profile ? <RootStack.Screen name="Main" component={MainTabs} /> : <RootStack.Screen name="Auth" component={AuthScreen} />}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
