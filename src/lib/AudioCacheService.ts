import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export class AudioCacheService {
  private static CACHE_DIR = 'audio_cache';
  private static isGeneratingCache = false;

  private static async initCacheDir() {
    try {
      if (this.isGeneratingCache) return;
      this.isGeneratingCache = true;
      await Filesystem.mkdir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
        recursive: true
      });
    } catch (e) {
      // Directory usually already exists
    } finally {
      this.isGeneratingCache = false;
    }
  }

  public static async getCacheStatus(url: string): Promise<boolean> {
    if (!url || !url.startsWith('http')) return true; // Local file or empty is "cached"
    try {
      const filename = this.getFileName(url);
      const stat = await Filesystem.stat({
        path: `${this.CACHE_DIR}/${filename}`,
        directory: Directory.Data
      });
      return stat.size > 0;
    } catch {
      return false;
    }
  }

  public static async getLocalUrl(url: string): Promise<string> {
    if (!url || !url.startsWith('http')) return url;
    try {
      const filename = this.getFileName(url);
      const path = `${this.CACHE_DIR}/${filename}`;
      
      const stat = await Filesystem.stat({ path, directory: Directory.Data });
      
      if (stat && stat.size > 0) {
        const uriResult = await Filesystem.getUri({ path, directory: Directory.Data });
        // Native player (ExoPlayer) requires the real `file:///...` path, NOT the capacitor proxy path.
        return uriResult.uri;
      }
    } catch (e) {
      // File not cached yet
    }
    return url; // Fallback to remote streaming
  }

  public static async downloadToCache(url: string): Promise<void> {
    if (!url || !url.startsWith('http')) return;
    if (!Capacitor.isNativePlatform()) return; // Skip caching on web
    
    try {
      await this.initCacheDir();
      
      const isCached = await this.getCacheStatus(url);
      if (isCached) return; // Already cached
      
      const filename = this.getFileName(url);
      const path = `${this.CACHE_DIR}/${filename}`;
      
      // Native download
      await Filesystem.downloadFile({
        url: url,
        path: path,
        directory: Directory.Data
      });
      
    } catch (err) {
      console.warn("Audio cache download failed:", err);
    }
  }

  private static getFileName(url: string): string {
    try {
        const urlObj = new URL(url);
        let name = urlObj.pathname.split('/').pop() || '';
        name = name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        return name || `audio_${Date.now()}.mp3`;
    } catch (e) {
        return `audio_${Date.now()}.mp3`;
    }
  }
}
