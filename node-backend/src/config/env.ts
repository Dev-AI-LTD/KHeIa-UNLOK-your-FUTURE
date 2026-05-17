type EnvConfig = {
  openAiKey: string;
  geminiKey: string;
  ttsVoice: string;
};

/**
 * Reads required environment variables.
 */
export const getEnv = (): EnvConfig => ({
  openAiKey: process.env.OPENAI_API_KEY ?? '',
  geminiKey: process.env.GEMINI_API_KEY ?? '',
  ttsVoice: (process.env.TTS_VOICE ?? 'nova').trim().toLowerCase(),
});
