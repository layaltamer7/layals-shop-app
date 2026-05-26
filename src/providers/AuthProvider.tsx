import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { getLocales } from 'expo-localization';
import type { Session, User } from '@supabase/supabase-js';

import { demoProfile } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { updateProfilePushToken } from '../services/shopService';
import type { AppProfile, UserRole } from '../types';

const DEMO_PROFILE_KEY = 'shop-app:demo-profile';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: AppProfile | null;
  loading: boolean;
  usingDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string; role: UserRole }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  savePushToken: (token: string | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadOrCreateProfile(user: User): Promise<AppProfile> {
  if (!supabase) {
    return demoProfile;
  }

  const existing = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (existing.data) {
    return {
      id: existing.data.id,
      email: existing.data.email,
      fullName: existing.data.full_name,
      role: existing.data.role,
      preferredLocale: existing.data.preferred_locale ?? 'en-EG',
      currencyCode: 'EGP',
      themePreference: existing.data.theme_preference,
      expoPushToken: existing.data.expo_push_token,
    };
  }

  const locale = getLocales()[0];
  const profile: AppProfile = {
    id: user.id,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string) ?? 'New Shopper',
    role: (user.user_metadata?.role as UserRole) ?? 'customer',
    preferredLocale: locale?.languageTag ?? 'en-EG',
    currencyCode: 'EGP',
    themePreference: 'system',
    expoPushToken: null,
  };

  const result = await supabase.from('profiles').upsert({
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    role: profile.role,
    preferred_locale: profile.preferredLocale,
    currency_code: profile.currencyCode,
    theme_preference: profile.themePreference,
    expo_push_token: null,
  });

  if (result.error) {
    throw result.error;
  }

  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const usingDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    if (!supabase) {
      AsyncStorage.removeItem(DEMO_PROFILE_KEY).finally(() => setLoading(false));
      return;
    }

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          setProfile(await loadOrCreateProfile(data.session.user));
        }
      })
      .finally(() => setLoading(false));

    const subscription = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        setProfile(await loadOrCreateProfile(nextSession.user));
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      const mock = {
        ...demoProfile,
        email,
        fullName: email.split('@')[0] || demoProfile.fullName,
      };
      setProfile(mock);
      return;
    }

    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      throw result.error;
    }
  };

  const signUp = async ({
    email,
    password,
    fullName,
    role,
  }: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  }) => {
    if (!supabase) {
      const mock = {
        ...demoProfile,
        email,
        fullName,
        role,
      };
      setProfile(mock);
      return;
    }

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (result.error) {
      throw result.error;
    }

    if (!result.data.session) {
      Alert.alert('Verify email', 'Supabase sign-up succeeded. Verify your email, then sign in.');
    }
  };

  const signOut = async () => {
    if (!supabase) {
      await AsyncStorage.removeItem(DEMO_PROFILE_KEY);
      setProfile(null);
      return;
    }

    const result = await supabase.auth.signOut();
    if (result.error) {
      throw result.error;
    }
  };

  const refreshProfile = async () => {
    if (usingDemoMode || !user) {
      return;
    }

    setProfile(await loadOrCreateProfile(user));
  };

  const savePushToken = async (token: string | null) => {
    if (!profile) {
      return;
    }

    if (usingDemoMode) {
      const nextProfile = { ...profile, expoPushToken: token };
      setProfile(nextProfile);
      return;
    }

    await updateProfilePushToken(profile.id, token);
    setProfile({ ...profile, expoPushToken: token });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      usingDemoMode,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      savePushToken,
    }),
    [loading, profile, session, user, usingDemoMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
