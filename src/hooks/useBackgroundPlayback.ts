import { useEffect } from 'react';

/**
 * Hook to enforce continuous background playback in Capacitor and mobile browsers.
 * 
 * Includes strategies:
 * 1. Overriding the Page Visibility API to trick the YouTube Iframe into thinking it is always in the foreground.
 * 2. Capacitor background mode integration.
 */
export function useBackgroundPlayback() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // --- Strategy 1: Page Visibility Override ---
    // YouTube Iframe API actively listens to visibilitychange and document.hidden
    // to pause playback when the app goes into the background.
    try {
      Object.defineProperty(document, 'hidden', {
        get: () => false,
      });

      Object.defineProperty(document, 'visibilityState', {
        get: () => 'visible',
      });

      const blockVisibilityChange = (e: Event) => {
        e.stopImmediatePropagation();
        e.stopPropagation();
      };

      document.addEventListener('visibilitychange', blockVisibilityChange, true);
      document.addEventListener('webkitvisibilitychange', blockVisibilityChange, true);
    } catch (err) {
      console.warn('Could not override Page Visibility API:', err);
    }

    // --- Strategy 2: Capacitor Background Mode (if installed) ---
    // To use this, run: npm install @capgo/capacitor-background-task
    // or: npm install @capacitor-community/background-mode
    const setupCapacitor = async () => {
      try {
        // We use dynamic require/import to prevent breaking the web build if plugins are missing.
        if (typeof window !== 'undefined' && (window as any).Capacitor) {
          const Capacitor = (window as any).Capacitor;
          
          // Attempt Background Mode (capgo or community)
          if (Capacitor.Plugins.BackgroundMode) {
            await Capacitor.Plugins.BackgroundMode.enable();
            
            // On Android, we disable webview optimizations when in background
            if (Capacitor.Plugins.BackgroundMode.setSettings) {
              await Capacitor.Plugins.BackgroundMode.setSettings({
                webviewAllowBackgroundVideoPlayback: true,
              });
            }
          }
        }
      } catch (err) {
        console.log('Capacitor background mode not initialized (plugin may not be installed):', err);
      }
    };
    
    setupCapacitor();

  }, []);
}
