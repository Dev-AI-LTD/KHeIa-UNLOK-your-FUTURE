/**
 * @kinde/js-utils loads ExpoSecureStore via dynamic import(), which Metro/RN
 * often resolves to undefined. Use AsyncStorage instead (no native secure-store).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExpoSecureStore as kindeExpoSecureStoreExport,
  SessionBase,
  StorageKeys,
  splitString,
  storageSettings,
} from '@kinde/js-utils';

class KindeAsyncStorage extends SessionBase {
  asyncStore = true;

  private key(itemKey: string, index: number) {
    return `${storageSettings.keyPrefix}${itemKey}${index}`;
  }

  async destroySession(): Promise<void> {
    const keys = Object.values(StorageKeys);
    await Promise.all(keys.map((key) => this.removeSessionItem(key)));
    this.notifyListeners();
  }

  async setSessionItem(itemKey: string, itemValue: unknown): Promise<void> {
    if (typeof itemValue !== 'string') {
      throw new Error('Item value must be a string');
    }
    await this.removeSessionItem(itemKey);
    const chunks = splitString(itemValue, Math.min(storageSettings.maxLength, 2048));
    await Promise.all(
      chunks.map((chunk, index) => AsyncStorage.setItem(this.key(itemKey, index), chunk)),
    );
    this.notifyListeners();
  }

  async getSessionItem(itemKey: string): Promise<string | null> {
    const chunks: string[] = [];
    let index = 0;
    let chunk = await AsyncStorage.getItem(this.key(String(itemKey), index));
    while (chunk) {
      chunks.push(chunk);
      index += 1;
      chunk = await AsyncStorage.getItem(this.key(String(itemKey), index));
    }
    return chunks.join('') || null;
  }

  async removeSessionItem(itemKey: string): Promise<void> {
    let index = 0;
    let chunk = await AsyncStorage.getItem(this.key(String(itemKey), index));
    while (chunk) {
      await AsyncStorage.removeItem(this.key(String(itemKey), index));
      index += 1;
      chunk = await AsyncStorage.getItem(this.key(String(itemKey), index));
    }
    this.notifyListeners();
  }
}

if (kindeExpoSecureStoreExport?.default) {
  kindeExpoSecureStoreExport.default = async () => KindeAsyncStorage;
}
