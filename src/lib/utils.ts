import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export const checkIsOnline = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch (e) {
      return navigator.onLine;
    }
  }
  
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    await fetch("https://1.1.1.1/cdn-cgi/trace", { 
      mode: "no-cors", 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
};

export const vibrate = (pattern: number | number[] = 50) => {
  if (Capacitor.isNativePlatform()) {
    // Use setTimeout to ensure it doesn't block native callbacks and runs on main thread
    setTimeout(async () => {
      try {
        // Check if app is in foreground before vibrating to prevent background crashes
        const { App } = await import('@capacitor/app');
        const state = await App.getState();
        if (!state.isActive) return;

        // Use Haptics for native feel
        if (typeof pattern === 'number') {
          if (pattern <= 10) {
            await Haptics.impact({ style: ImpactStyle.Light });
          } else if (pattern <= 30) {
            await Haptics.impact({ style: ImpactStyle.Medium });
          } else {
            await Haptics.impact({ style: ImpactStyle.Heavy });
          }
        } else {
          await Haptics.vibrate();
        }
      } catch (e) {
        // Fallback to web vibrate
        if (typeof window !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(pattern);
          } catch (err) {}
        }
      }
    }, 0);
    return;
  }

  if (typeof window !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore
    }
  }
};
