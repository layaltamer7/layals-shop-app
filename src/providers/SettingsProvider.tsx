import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getLocales } from 'expo-localization';

import { translations, type TranslationKey } from '../localization';
import { colors } from '../theme';
import type { ThemePreference } from '../types';

const SETTINGS_KEY = 'shop-app:settings';

type SettingsContextValue = {
  locale: string;
  language: 'en' | 'ar';
  currencyCode: string;
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => Promise<void>;
  isDark: boolean;
  palette: typeof colors.light;
  t: (key: TranslationKey) => string;
  formatCurrency: (value: number, currencyCode?: string) => string;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();
  const localeInfo = getLocales()[0];
  const locale = localeInfo?.languageTag ?? 'en-EG';
  const language = locale.startsWith('ar') ? 'ar' : 'en';
  const currencyCode = 'EGP';
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((value) => {
        if (!value) {
          return;
        }

        const parsed = JSON.parse(value) as { themePreference?: ThemePreference };
        if (parsed.themePreference) {
          setThemePreferenceState(parsed.themePreference);
        }
      })
      .catch(() => undefined);
  }, []);

  const setThemePreference = async (value: ThemePreference) => {
    setThemePreferenceState(value);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ themePreference: value }));
  };

  const isDark = themePreference === 'system' ? deviceScheme === 'dark' : themePreference === 'dark';
  const palette = isDark ? colors.dark : colors.light;

  const contextValue = useMemo<SettingsContextValue>(
    () => ({
      locale,
      language,
      currencyCode,
      themePreference,
      setThemePreference,
      isDark,
      palette,
      t: (key) => translations[language][key] ?? translations.en[key],
      formatCurrency: (value, currency = currencyCode) =>
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        }).format(value),
    }),
    [currencyCode, isDark, language, locale, palette, themePreference],
  );

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }

  return context;
}
