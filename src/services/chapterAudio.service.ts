import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { fetchChapterTtsAudio } from '@/services/tts.client';
import type { TheorySection } from '@/services/chapterAudio.utils';

export type { TheorySection } from '@/services/chapterAudio.utils';

export type ChapterAudioProgress = {
  sectionIndex: number;
  totalSections: number;
  loading: boolean;
  fromCache: boolean;
};

type AudioModule = typeof import('expo-av');

let audioModule: AudioModule | null = null;

async function getAudio(): Promise<AudioModule> {
  if (!audioModule) {
    audioModule = await import('expo-av');
  }
  return audioModule;
}

function audioRootDir(): Directory {
  return new Directory(Paths.document, 'audio');
}

function chapterCacheDir(chapterId: string, hash: string): Directory {
  return new Directory(audioRootDir(), `${chapterId}_${hash}`);
}

function sectionFile(chapterId: string, hash: string, index: number): File {
  return new File(chapterCacheDir(chapterId, hash), `section_${index}.mp3`);
}

function ensureAudioRoot(): void {
  const root = audioRootDir();
  if (!root.exists) {
    root.create({ intermediates: true });
  }
}

export async function getContentHash(chapterId: string, sections: TheorySection[]): Promise<string> {
  const payload = JSON.stringify({
    chapterId,
    sections: sections.map((s) => ({ title: s.title ?? '', text: s.text })),
  });
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
  return digest.slice(0, 16);
}

/** Removes cached audio folders for this chapter with a different content hash. */
export async function pruneOldChapterCaches(chapterId: string, currentHash: string): Promise<void> {
  ensureAudioRoot();
  const root = audioRootDir();
  if (!root.exists) return;

  const activeFolder = `${chapterId}_${currentHash}`;
  const prefix = `${chapterId}_`;

  for (const entry of root.list()) {
    if (!(entry instanceof Directory)) continue;
    if (entry.name.startsWith(prefix) && entry.name !== activeFolder) {
      entry.delete();
    }
  }
}

async function ensureSectionCached(
  chapterId: string,
  hash: string,
  index: number,
  text: string,
): Promise<string> {
  const file = sectionFile(chapterId, hash, index);
  if (file.exists) {
    return file.uri;
  }

  const buffer = await fetchChapterTtsAudio(text, chapterId);
  const dir = chapterCacheDir(chapterId, hash);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  if (!file.exists) {
    file.create();
  }
  file.write(new Uint8Array(buffer));

  return file.uri;
}

export async function getCachedSectionPaths(
  chapterId: string,
  hash: string,
  sectionCount: number,
): Promise<string[] | null> {
  const paths: string[] = [];
  for (let i = 0; i < sectionCount; i += 1) {
    const file = sectionFile(chapterId, hash, i);
    if (!file.exists) return null;
    paths.push(file.uri);
  }
  return paths;
}

export type ChapterAudioPlayerCallbacks = {
  onProgress?: (progress: ChapterAudioProgress) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
};

type SoundInstance = import('expo-av').Audio.Sound;

export class ChapterAudioPlayer {
  private sound: SoundInstance | null = null;

  private stopped = false;

  private paused = false;

  private sectionPaths: string[] = [];

  private currentIndex = 0;

  async prepare(
    chapterId: string,
    sections: TheorySection[],
    callbacks: ChapterAudioPlayerCallbacks = {},
  ): Promise<void> {
    if (sections.length === 0) {
      throw new Error('Nu există text de ascultat pentru acest capitol.');
    }

    const { Audio } = await getAudio();
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    const hash = await getContentHash(chapterId, sections);
    await pruneOldChapterCaches(chapterId, hash);

    const cached = await getCachedSectionPaths(chapterId, hash, sections.length);
    if (cached) {
      this.sectionPaths = cached;
      callbacks.onProgress?.({
        sectionIndex: 0,
        totalSections: sections.length,
        loading: false,
        fromCache: true,
      });
      return;
    }

    this.sectionPaths = [];
    for (let i = 0; i < sections.length; i += 1) {
      if (this.stopped) return;
      callbacks.onProgress?.({
        sectionIndex: i,
        totalSections: sections.length,
        loading: true,
        fromCache: false,
      });
      const path = await ensureSectionCached(chapterId, hash, i, sections[i].text);
      this.sectionPaths.push(path);
    }

    callbacks.onProgress?.({
      sectionIndex: 0,
      totalSections: sections.length,
      loading: false,
      fromCache: false,
    });
  }

  async play(callbacks: ChapterAudioPlayerCallbacks = {}): Promise<void> {
    this.stopped = false;
    this.paused = false;
    this.currentIndex = 0;
    await this.playSectionAt(this.currentIndex, callbacks);
  }

  private async playSectionAt(index: number, callbacks: ChapterAudioPlayerCallbacks): Promise<void> {
    if (this.stopped || index >= this.sectionPaths.length) {
      await this.unloadSound();
      callbacks.onComplete?.();
      return;
    }

    this.currentIndex = index;
    callbacks.onProgress?.({
      sectionIndex: index,
      totalSections: this.sectionPaths.length,
      loading: false,
      fromCache: true,
    });

    await this.unloadSound();
    const { Audio } = await getAudio();
    const { sound } = await Audio.Sound.createAsync(
      { uri: this.sectionPaths[index] },
      { shouldPlay: true },
    );
    this.sound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || this.stopped || this.paused) return;
      if (status.didJustFinish) {
        void this.playSectionAt(index + 1, callbacks);
      }
    });
  }

  async pause(): Promise<void> {
    this.paused = true;
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async resume(callbacks: ChapterAudioPlayerCallbacks = {}): Promise<void> {
    if (this.stopped) return;
    this.paused = false;
    if (this.sound) {
      await this.sound.playAsync();
      return;
    }
    await this.playSectionAt(this.currentIndex, callbacks);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.paused = false;
    await this.unloadSound();
  }

  private async unloadSound(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch {
        // ignore unload errors
      }
      this.sound = null;
    }
  }
}
