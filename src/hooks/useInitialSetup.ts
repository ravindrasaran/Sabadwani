import { useEffect, MutableRefObject } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { ScreenOrientation } from '@capacitor/screen-orientation';

export const useInitialSetup = (
  paymentIntentPending: MutableRefObject<boolean>,
  showToast: (msg: string) => void,
  setupGlobalMediaSessionListener: () => void
) => {
  useEffect(() => {
    setupGlobalMediaSessionListener();

    // Web fallback for payment return message
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && paymentIntentPending.current) {
        paymentIntentPending.current = false;
        setTimeout(() => {
          showToast("सहयोग के प्रयास के लिए आपका बहुत-बहुत धन्यवाद! 🙏");
        }, 500);
      }
    };
    
    if (!Capacitor.isNativePlatform()) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    const performAppUpdate = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Request notification permissions for Android 13+
          const perm = await LocalNotifications.checkPermissions();
          if (perm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }

          const result = await AppUpdate.getAppUpdateInfo();
          if (result.updateAvailability === 2) { // UPDATE_AVAILABLE
            if (result.immediateUpdateAllowed) {
              await AppUpdate.performImmediateUpdate();
            } else if (result.flexibleUpdateAllowed) {
              await AppUpdate.startFlexibleUpdate();
            }
          }
        } catch (error) {
          console.error("App update check failed:", error);
        }
      }
    };

    performAppUpdate();

    // Lock screen orientation to portrait
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: 'portrait' }).catch(console.error);
    }

    return () => {
      if (!Capacitor.isNativePlatform()) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [paymentIntentPending, showToast, setupGlobalMediaSessionListener]);
};
