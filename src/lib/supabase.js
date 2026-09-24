import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' &&
  supabasePublishableKey !== 'YOUR_SUPABASE_PUBLISHABLE_KEY' &&
  supabaseUrl.startsWith('http')
);

if (!isConfigured) {
  console.warn(
    '[Supabase Init Warning] EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not properly configured in .env.'
  );
}

// Safe storage wrapper around AsyncStorage to catch native module or legacy storage access issues gracefully
const safeAsyncStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('[Supabase Storage Warning] Could not retrieve item from storage:', error?.message || error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('[Supabase Storage Warning] Could not save item to storage:', error?.message || error);
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('[Supabase Storage Warning] Could not remove item from storage:', error?.message || error);
    }
  },
};

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabasePublishableKey : 'placeholder-key',
  {
    auth: {
      storage: safeAsyncStorage,
      autoRefreshToken: isConfigured,
      persistSession: isConfigured,
      detectSessionInUrl: false,
    },
  }
);

export const isSupabaseConfigured = () => isConfigured;
