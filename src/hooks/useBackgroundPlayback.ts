import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { audioEngine } from '../audio/audioEngine';

/**
 * Hook to enforce continuous, uninterrupted background playback in Capacitor native builds and mobile browsers.
 * 
 * Includes comprehensive strategies:
 * 1. Overriding the Page Visibility API and document.hasFocus to keep the YouTube IFrame active.
 * 2. Intercepting visibilitychange, pagehide, and freeze events in the capture phase.
 * 3. Capacitor Native App state listener to maintain active audio pipeline when minimized or locked.
 * 4. Screen Wake Lock API to prevent device CPU sleep during active sessions.
 * 5. Capacitor Background Mode plugin integration.
 */
export function useBackgroundPlayback() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // --- Strategy 1: Page Visibility & Focus Override ---
    // YouTube Iframe API actively listens to visibilitychange, document.hidden, and document.hasFocus()
    // to pause playback when the app goes into the background.
    const safelyDefineProperty = (target: any, prop: string, getter: () => any): boolean => {
      try {
        if (!target) return false;
        try {
          if (prop === 'hidden' && target.hidden === false) return true;
          if (prop === 'visibilityState' && target.visibilityState === 'visible') return true;
        } catch {
          // ignore getter read error
        }

        const desc = Object.getOwnPropertyDescriptor(target, prop);
        if (desc && !desc.configurable) {
          return false;
        }

        Object.defineProperty(target, prop, {
          get: getter,
          configurable: true,
          enumerable: true,
        });
        return true;
      } catch {
        return false;
      }
    };

    // Override on Document.prototype and document instance
    const protoOverridden =
      typeof Document !== 'undefined' && Document.prototype
        ? safelyDefineProperty(Document.prototype, 'hidden', () => false) &&
          safelyDefineProperty(Document.prototype, 'visibilityState', () => 'visible')
        : false;

    if (!protoOverridden) {
      safelyDefineProperty(document, 'hidden', () => false);
      safelyDefineProperty(document, 'visibilityState', () => 'visible');
    }

    // Override document.hasFocus to always return true for background YouTube playback
    try {
      document.hasFocus = () => true;
    } catch {}

    // Block events that trigger auto-suspension in WebViews
    const blockSuspensionEvents = (e: Event) => {
      try {
        e.stopImmediatePropagation();
        e.stopPropagation();
      } catch {
        // ignore
      }
    };

    try {
      document.addEventListener('visibilitychange', blockSuspensionEvents, true);
      document.addEventListener('webkitvisibilitychange', blockSuspensionEvents, true);
      window.addEventListener('pagehide', blockSuspensionEvents, true);
      document.addEventListener('freeze', blockSuspensionEvents, true);
    } catch {
      // ignore
    }

    // --- Strategy 2: Screen Wake Lock API ---
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };

    requestWakeLock();

    // Re-acquire wake lock if page becomes active again
    const onVisibilityWakeLockCheck = () => {
      if (document.visibilityState === 'visible' && !wakeLockSentinel) {
        requestWakeLock();
      }
    };
    window.addEventListener('focus', onVisibilityWakeLockCheck);

    // --- Strategy 3: Capacitor Native Background Audio Handling ---
    let capAppListenerHandle: any = null;

    const setupCapacitor = async () => {
      try {
        // 3a. Native App plugin lifecycle monitoring
        if (CapApp && typeof CapApp.addListener === 'function') {
          capAppListenerHandle = await CapApp.addListener('appStateChange', (state) => {
            if (!state.isActive) {
              console.log('[Background Mode] App minimized / screen locked, ensuring audio continuity');
              if (audioEngine.getIsPlaying()) {
                audioEngine.initSilentCarrierAudio();
              }
            }
          });
        }

        // 3b. Capacitor Background Mode plugin (if installed)
        if (typeof window !== 'undefined' && (window as any).Capacitor) {
          const Capacitor = (window as any).Capacitor;
          
          if (Capacitor.Plugins.BackgroundMode) {
            await Capacitor.Plugins.BackgroundMode.enable();
            
            // On Android, disable webview optimizations when in background
            if (Capacitor.Plugins.BackgroundMode.setSettings) {
              await Capacitor.Plugins.BackgroundMode.setSettings({
                silent: true,
                title: 'AbirTune',
                text: 'Playing music in background',
                webviewAllowBackgroundVideoPlayback: true,
              });
            }
          }
        }
      } catch (err) {
        console.log('[Background Mode] Capacitor background configuration notice:', err);
      }
    };
    
    setupCapacitor();

    return () => {
      try {
        document.removeEventListener('visibilitychange', blockSuspensionEvents, true);
        document.removeEventListener('webkitvisibilitychange', blockSuspensionEvents, true);
        window.removeEventListener('pagehide', blockSuspensionEvents, true);
        document.removeEventListener('freeze', blockSuspensionEvents, true);
        window.removeEventListener('focus', onVisibilityWakeLockCheck);
        if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
          wakeLockSentinel.release().catch(() => {});
        }
        if (capAppListenerHandle && typeof capAppListenerHandle.remove === 'function') {
          capAppListenerHandle.remove();
        }
      } catch {
        // ignore
      }
    };
  }, []);
}
