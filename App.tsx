import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/providers/AuthProvider';
import { SettingsProvider, useSettings } from './src/providers/SettingsProvider';

function AppContent() {
  const { isDark } = useSettings();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
