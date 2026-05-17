import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChapterAudioPlayer,
  type ChapterAudioProgress,
  type TheorySection,
} from '@/services/chapterAudio.service';
import {
  canStartTtsListening,
  recordTtsListeningSeconds,
} from '@/services/ttsQuota.service';

type StartListeningOptions = {
  isPremium?: boolean;
  onQuotaExceeded?: () => void;
};

export function useChapterAudio() {
  const playerRef = useRef<ChapterAudioPlayer | null>(null);
  const listenSessionRef = useRef(0);
  const quotaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPremiumRef = useRef(false);
  const onQuotaExceededRef = useRef<(() => void) | undefined>(undefined);
  const [progress, setProgress] = useState<ChapterAudioProgress | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearQuotaInterval = useCallback(() => {
    if (quotaIntervalRef.current) {
      clearInterval(quotaIntervalRef.current);
      quotaIntervalRef.current = null;
    }
  }, []);

  const getPlayer = useCallback(() => {
    if (!playerRef.current) {
      playerRef.current = new ChapterAudioPlayer();
    }
    return playerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      clearQuotaInterval();
      void playerRef.current?.stop();
    };
  }, [clearQuotaInterval]);

  useEffect(() => {
    if (!isActive || isPaused || isPremiumRef.current) {
      clearQuotaInterval();
      return;
    }

    quotaIntervalRef.current = setInterval(() => {
      void recordTtsListeningSeconds(1, false).then(({ allowed }) => {
        if (!allowed) {
          clearQuotaInterval();
          void playerRef.current?.stop();
          setIsActive(false);
          setIsPaused(false);
          setProgress(null);
          setError('Ai folosit cele 5 minute gratuite de ascultare pentru azi.');
          onQuotaExceededRef.current?.();
        }
      });
    }, 1000);

    return () => clearQuotaInterval();
  }, [isActive, isPaused, clearQuotaInterval]);

  const stop = useCallback(async () => {
    listenSessionRef.current += 1;
    clearQuotaInterval();
    await playerRef.current?.stop();
    setIsActive(false);
    setIsPaused(false);
    setProgress(null);
    setError(null);
  }, [clearQuotaInterval]);

  const startListening = useCallback(
    async (
      chapterId: string,
      sections: TheorySection[],
      options: StartListeningOptions = {},
    ) => {
      const isPremium = options.isPremium ?? false;
      isPremiumRef.current = isPremium;
      onQuotaExceededRef.current = options.onQuotaExceeded;

      if (!isPremium) {
        const allowed = await canStartTtsListening(false);
        if (!allowed) {
          setError('Ai folosit cele 5 minute gratuite de ascultare pentru azi.');
          options.onQuotaExceeded?.();
          return;
        }
      }

      const session = listenSessionRef.current + 1;
      listenSessionRef.current = session;

      setError(null);
      setIsActive(true);
      setIsPaused(false);
      const player = getPlayer();
      const callbacks = {
        onProgress: (p: ChapterAudioProgress) => {
          if (listenSessionRef.current !== session) return;
          setProgress(p);
        },
        onError: (e: Error) => {
          if (listenSessionRef.current !== session) return;
          setError(e.message);
          setIsActive(false);
          clearQuotaInterval();
        },
        onComplete: () => {
          if (listenSessionRef.current !== session) return;
          setIsActive(false);
          setIsPaused(false);
          setProgress(null);
          clearQuotaInterval();
        },
      };

      try {
        await player.prepare(chapterId, sections, callbacks);
        if (listenSessionRef.current !== session) return;
        await player.play(callbacks);
      } catch (e) {
        if (listenSessionRef.current !== session) return;
        const message = e instanceof Error ? e.message : 'Nu s-a putut porni redarea.';
        setError(message);
        setIsActive(false);
        clearQuotaInterval();
      }
    },
    [getPlayer, clearQuotaInterval],
  );

  const togglePause = useCallback(async () => {
    const player = getPlayer();
    if (isPaused) {
      setIsPaused(false);
      await player.resume({
        onProgress: (p) => setProgress(p),
        onComplete: () => {
          setIsActive(false);
          setIsPaused(false);
          setProgress(null);
          clearQuotaInterval();
        },
      });
    } else {
      setIsPaused(true);
      await player.pause();
    }
  }, [isPaused, getPlayer, clearQuotaInterval]);

  const stopOrPause = useCallback(async () => {
    if (progress?.loading) {
      await stop();
      return;
    }
    await togglePause();
  }, [progress?.loading, stop, togglePause]);

  return {
    progress,
    isActive,
    isPaused,
    error,
    startListening,
    togglePause,
    stopOrPause,
    stop,
  };
}
