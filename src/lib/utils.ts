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

export const getSearchSkeleton = (text: string): string => {
  if (!text) return "";
  
  // 1. Map Hindi to Latin basic equivalents
  const charMap: Record<string, string> = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy',
    'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f',
    'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'e', 'ओ': 'o', 'औ': 'o',
    'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri', 'े': 'e', 'ै': 'e', 'ो': 'o', 'ौ': 'o', 'ं': 'n', 'ः': 'h', '्': '', '़': '', 'ँ': 'n'
  };

  let latinized = '';
  for (let char of text.toLowerCase()) {
    if (charMap[char] !== undefined) {
      latinized += charMap[char];
    } else {
      latinized += char;
    }
  }

  // 2. Normalize English phonetics
  latinized = latinized
    .replace(/ph/g, 'f')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/jh/g, 'j')
    .replace(/ch/g, 'c')
    .replace(/sh/g, 's')
    .replace(/v/g, 'b') // v and b are often interchanged in Hindi
    .replace(/w/g, 'b')
    .replace(/z/g, 'j');

  // 3. Remove all English vowels and punctuation, BUT preserve spaces to prevent cross-word false matches
  return latinized
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/[aeiouy_]/g, '') // remove vowels
    .replace(/\s+/g, ' ') // normalize spaces
    .trim();
};

export const getTransliteratedSearch = (text: string): string => {
  if (!text) return "";
  
  // 1. Map Hindi to Latin basic equivalents
  const charMap: Record<string, string> = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy',
    'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f',
    'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'e', 'ओ': 'o', 'औ': 'o',
    'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri', 'े': 'e', 'ै': 'e', 'ो': 'o', 'ौ': 'o', 'ं': 'n', 'ः': 'h', '्': '', '़': '', 'ँ': 'n'
  };

  let latinized = '';
  for (let char of text.toLowerCase()) {
    if (charMap[char] !== undefined) {
      latinized += charMap[char];
    } else {
      latinized += char;
    }
  }

  // 2. Normalize English phonetics
  latinized = latinized
    .replace(/ph/g, 'f')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/jh/g, 'j')
    .replace(/ch/g, 'c')
    .replace(/sh/g, 's')
    .replace(/v/g, 'b')
    .replace(/w/g, 'b')
    .replace(/z/g, 'j');

  // 3. Keep vowels but normalize them (e.g. aa -> a, ee -> i, oo -> u)
  return latinized
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/aa+/g, 'a')
    .replace(/ee+/g, 'i')
    .replace(/oo+/g, 'u')
    .replace(/au/g, 'o')
    .replace(/ai/g, 'e')
    .replace(/_+/g, '')
    .replace(/\s+/g, ' ') // normalize spaces
    .trim();
};
