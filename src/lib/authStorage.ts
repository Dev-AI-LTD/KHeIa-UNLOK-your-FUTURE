import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function isNative(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function webStorage(): AsyncStorageLike {
  return {
    getItem: async (key) => {
      try {
        return globalThis?.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        globalThis?.localStorage?.setItem(key, value);
      } catch {
        // ignore
      }
    },
    removeItem: async (key) => {
      try {
        globalThis?.localStorage?.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Storage pentru sesiuni/token-uri (Supabase/Kinde).
 * - iOS/Android: SecureStore (Keychain/Keystore)
 * - Web: localStorage fallback
 */
export const authStorage: AsyncStorageLike = isNative()
  ? {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    }
  : webStorage();

