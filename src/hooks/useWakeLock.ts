import { useEffect } from "react";
import { Screen } from "../types";

export function useWakeLock(currentScreen: Screen, isAudioActive: boolean) {
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Ignore wake lock errors
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    if (currentScreen === 'reading' || currentScreen === 'audio_reading' || isAudioActive) {
      requestWakeLock();
    } else if (wakeLock) {
      wakeLock.release().then(() => wakeLock = null).catch(() => {});
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [currentScreen, isAudioActive]);
}
