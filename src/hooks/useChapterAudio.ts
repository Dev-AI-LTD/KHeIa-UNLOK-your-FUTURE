import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChapterAudioPlayer,
  type ChapterAudioProgress,
  type TheorySection,
} from '@/services/chapterAudio.service';

export function useChapterAudio() {
  const playerRef = useRef<ChapterAudioPlayer | null>(null);
  const [progress, setProgress] = useState<ChapterAudioProgress | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlayer = useCallback(() => {
    if (!playerRef.current) {
      playerRef.current = new ChapterAudioPlayer();
    }
    return playerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      void playerRef.current?.stop();
    };
  }, []);

  const stop = useCallback(async () => {
    await playerRef.current?.stop();
    setIsActive(false);
    setIsPaused(false);
    setProgress(null);
    setError(null);
  }, []);

  const startListening = useCallback(
    async (chapterId: string, sections: TheorySection[]) => {
      setError(null);
      setIsActive(true);
      setIsPaused(false);
      const player = getPlayer();
      const callbacks = {
        onProgress: (p: ChapterAudioProgress) => setProgress(p),
        onError: (e: Error) => {
          setError(e.message);
          setIsActive(false);
        },
        onComplete: () => {
          setIsActive(false);
          setIsPaused(false);
          setProgress(null);
        },
      };

      try {
        await player.prepare(chapterId, sections, callbacks);
        await player.play(callbacks);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Nu s-a putut porni redarea.';
        setError(message);
        setIsActive(false);
      }
    },
    [getPlayer],
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
        },
      });
    } else {
      setIsPaused(true);
      await player.pause();
    }
  }, [isPaused, getPlayer]);

  return {
    progress,
    isActive,
    isPaused,
    error,
    startListening,
    togglePause,
    stop,
  };
}
