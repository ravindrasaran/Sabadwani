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

    let updateListener: any = null;

    const performAppUpdate = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Request notification permissions for Android 13+
          const perm = await LocalNotifications.checkPermissions();
          if (perm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }

          // Register flexible update state listener to auto-install when ready
          updateListener = await AppUpdate.addListener('onFlexibleUpdateStateChange', (state) => {
            if (state.installStatus === 11) { // DOWNLOADED
              showToast("नया अपडेट डाउनलोड हो गया है! ऐप को अपडेट करने के लिए रीस्टार्ट किया जा रहा है...");
              setTimeout(async () => {
                try {
                  await AppUpdate.completeFlexibleUpdate();
                } catch (err) {
                  console.error("Failed to complete flexible update:", err);
                }
              }, 2000);
            }
          });

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
      if (updateListener) {
        updateListener.remove();
      }
    };
  }, [paymentIntentPending, showToast, setupGlobalMediaSessionListener]);
};
