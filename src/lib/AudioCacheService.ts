import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export class AudioCacheService {
  private static CACHE_DIR = 'audio_cache';
  // BUG FIX: Old code used `isGeneratingCache` as a mutex that was never released
  // if mkdir threw an unexpected error, permanently blocking all future cache ops.
  // Replaced with a Promise-based singleton so parallel callers await the same init.
  private static _initPromise: Promise<void> | null = null;

  private static initCacheDir(): Promise<void> {
    if (!this._initPromise) {
      this._initPromise = Filesystem.mkdir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
        recursive: true,
      }).catch(() => {
        // Directory already exists — not an error
      });
    }
    return this._initPromise;
  }

  public static async getCacheStatus(url: string): Promise<boolean> {
    if (!url || !url.startsWith('http')) return true;
    try {
      const stat = await Filesystem.stat({
        path: `${this.CACHE_DIR}/${this.getFileName(url)}`,
        directory: Directory.Data,
      });
      return stat.size > 0;
    } catch {
      return false;
    }
  }

  public static async getLocalUrl(url: string): Promise<string> {
    if (!url || !url.startsWith('http')) return url;
    try {
      const path = `${this.CACHE_DIR}/${this.getFileName(url)}`;
      const stat = await Filesystem.stat({ path, directory: Directory.Data });
      if (stat && stat.size > 0) {
        const uriResult = await Filesystem.getUri({ path, directory: Directory.Data });
        // Native player (ExoPlayer) requires the real file:/// path, NOT the Capacitor proxy
        return uriResult.uri;
      }
    } catch {
      // Not cached yet — fall through
    }
    return url;
  }

  public static async downloadToCache(url: string): Promise<void> {
    if (!url || !url.startsWith('http')) return;
    if (!Capacitor.isNativePlatform()) return;

    try {
      await this.initCacheDir();

      const isCached = await this.getCacheStatus(url);
      if (isCached) return;

      await Filesystem.downloadFile({
        url,
        path: `${this.CACHE_DIR}/${this.getFileName(url)}`,
        directory: Directory.Data,
      });
    } catch (err) {
      console.warn('[AudioCacheService] download failed:', err);
    }
  }

  private static getFileName(url: string): string {
    try {
      const urlObj = new URL(url);
      const raw = urlObj.pathname.split('/').pop() || '';
      const clean = raw.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      return clean || `audio_${Date.now()}.mp3`;
    } catch {
      return `audio_${Date.now()}.mp3`;
    }
  }
}
