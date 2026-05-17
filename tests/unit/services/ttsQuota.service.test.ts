jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FREE_TTS_DAILY_SECONDS,
  canStartTtsListening,
  formatTtsRemaining,
  recordTtsListeningSeconds,
} from '@/services/ttsQuota.service';

describe('ttsQuota.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('formatTtsRemaining formats mm:ss', () => {
    expect(formatTtsRemaining(125)).toBe('2:05');
    expect(formatTtsRemaining(0)).toBe('0:00');
  });

  it('premium users can always start', async () => {
    expect(await canStartTtsListening(true)).toBe(true);
  });

  it('records seconds until daily cap', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(FREE_TTS_DAILY_SECONDS - 1));
    const result = await recordTtsListeningSeconds(1, false);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
