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

import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'duckOthers',
  });
  audioModeReady = true;
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
    root.create({ intermediates: true, idempotent: true });
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
    dir.create({ intermediates: true, idempotent: true });
  }

  file.create({ overwrite: true, idempotent: true });
  file.write(new Uint8Array(buffer));

  if (!file.exists) {
    throw new Error('Nu s-a putut salva fișierul audio pe dispozitiv.');
  }

  const saved = await file.bytes();
  if (saved.byteLength < 100) {
    file.delete();
    throw new Error('Audio invalid după descărcare. Încearcă din nou.');
  }

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

export class ChapterAudioPlayer {
  private player: AudioPlayer | null = null;

  private playbackListener: { remove: () => void } | null = null;

  private stopped = false;

  private paused = false;

  /** Incremented on stop() to cancel in-flight prepare / playSectionAt chains. */
  private sessionId = 0;

  private sectionPaths: string[] = [];

  private currentIndex = 0;

  private isSessionCurrent(session: number): boolean {
    return !this.stopped && session === this.sessionId;
  }

  async prepare(
    chapterId: string,
    sections: TheorySection[],
    callbacks: ChapterAudioPlayerCallbacks = {},
  ): Promise<void> {
    if (sections.length === 0) {
      throw new Error('Nu există text de ascultat pentru acest capitol.');
    }

    await ensureAudioMode();

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
    const session = this.sessionId;
    for (let i = 0; i < sections.length; i += 1) {
      if (!this.isSessionCurrent(session)) return;
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
    this.sessionId += 1;
    const session = this.sessionId;
    this.currentIndex = 0;
    await this.playSectionAt(this.currentIndex, callbacks, session);
  }

  private async playSectionAt(
    index: number,
    callbacks: ChapterAudioPlayerCallbacks,
    session: number,
  ): Promise<void> {
    if (!this.isSessionCurrent(session) || index >= this.sectionPaths.length) {
      if (session === this.sessionId) {
        this.releasePlayer();
        if (!this.stopped && index >= this.sectionPaths.length) {
          callbacks.onComplete?.();
        }
      }
      return;
    }

    this.currentIndex = index;
    callbacks.onProgress?.({
      sectionIndex: index,
      totalSections: this.sectionPaths.length,
      loading: false,
      fromCache: true,
    });

    this.releasePlayer();

    const uri = this.sectionPaths[index];
    try {
      await ensureAudioMode();
      if (!this.isSessionCurrent(session)) return;

      const player = createAudioPlayer({ uri }, { downloadFirst: false });
      if (!this.isSessionCurrent(session)) {
        this.disposePlayer(player);
        return;
      }

      this.player = player;

      this.playbackListener = player.addListener(
        'playbackStatusUpdate',
        (status: AudioStatus) => {
          if (!this.isSessionCurrent(session) || this.paused) return;
          if (status.didJustFinish) {
            void this.playSectionAt(index + 1, callbacks, session);
          }
        },
      );

      if (!this.isSessionCurrent(session) || this.paused) {
        this.releasePlayer();
        return;
      }

      player.play();
    } catch (e) {
      if (!this.isSessionCurrent(session)) return;
      const message = e instanceof Error ? e.message : 'Nu s-a putut reda secțiunea audio.';
      callbacks.onError?.(new Error(message));
      throw new Error(message);
    }
  }

  async pause(): Promise<void> {
    this.paused = true;
    try {
      this.player?.pause();
    } catch {
      // ignore
    }
  }

  async resume(callbacks: ChapterAudioPlayerCallbacks = {}): Promise<void> {
    if (this.stopped) return;
    this.paused = false;
    const session = this.sessionId;
    if (this.player) {
      try {
        this.player.play();
      } catch {
        await this.playSectionAt(this.currentIndex, callbacks, session);
      }
      return;
    }
    await this.playSectionAt(this.currentIndex, callbacks, session);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.paused = false;
    this.sessionId += 1;
    this.releasePlayer();
  }

  private disposePlayer(player: AudioPlayer): void {
    try {
      player.pause();
    } catch {
      // ignore
    }
    try {
      player.remove();
    } catch {
      // ignore
    }
  }

  private releasePlayer(): void {
    this.playbackListener?.remove();
    this.playbackListener = null;
    if (this.player) {
      this.disposePlayer(this.player);
      this.player = null;
    }
  }
}
