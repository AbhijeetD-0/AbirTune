import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';

interface AndroidBackButtonOptions {
  isFullScreenOpen: boolean;
  onCloseFullScreen: () => void;
  menuTrack: any;
  onCloseMenuTrack: () => void;
  selectedPlaylist: any;
  onClosePlaylist: () => void;
  selectedArtist: any;
  onCloseArtist: () => void;
  activeTab: string;
  onGoHome: () => void;
}

/**
 * Custom hook to intercept Android hardware and gesture back button navigation.
 * 
 * Behavior:
 * 1. When the Full-Screen Player overlay is open, pressing the Android Back button
 *    minimizes the overlay (returns to main view) without closing the app.
 * 2. When any context modal (song menu, playlist detail, artist profile) is open,
 *    pressing Back closes that modal.
 * 3. When on a non-home tab (Search, Explore, Library), pressing Back navigates to Home.
 * 4. Intercepts via:
 *    - Official Capacitor App plugin (`CapApp.addListener('backButton')`)
 *    - Android Cordova/Capacitor document `backbutton` event
 *    - Browser / WebView History API `popstate` event
 */
export function useAndroidBackButton({
  isFullScreenOpen,
  onCloseFullScreen,
  menuTrack,
  onCloseMenuTrack,
  selectedPlaylist,
  onClosePlaylist,
  selectedArtist,
  onCloseArtist,
  activeTab,
  onGoHome,
}: AndroidBackButtonOptions) {
  // Use stable refs to access latest state without re-registering event listeners
  const isFullScreenOpenRef = useRef(isFullScreenOpen);
  isFullScreenOpenRef.current = isFullScreenOpen;

  const menuTrackRef = useRef(menuTrack);
  menuTrackRef.current = menuTrack;

  const selectedPlaylistRef = useRef(selectedPlaylist);
  selectedPlaylistRef.current = selectedPlaylist;

  const selectedArtistRef = useRef(selectedArtist);
  selectedArtistRef.current = selectedArtist;

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const onCloseFullScreenRef = useRef(onCloseFullScreen);
  onCloseFullScreenRef.current = onCloseFullScreen;

  const onCloseMenuTrackRef = useRef(onCloseMenuTrack);
  onCloseMenuTrackRef.current = onCloseMenuTrack;

  const onClosePlaylistRef = useRef(onClosePlaylist);
  onClosePlaylistRef.current = onClosePlaylist;

  const onCloseArtistRef = useRef(onCloseArtist);
  onCloseArtistRef.current = onCloseArtist;

  const onGoHomeRef = useRef(onGoHome);
  onGoHomeRef.current = onGoHome;

  // Track if a history entry was pushed for the full-screen player
  const historyPushedRef = useRef(false);

  // Synchronize Full-Screen Player with browser/webview history
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isFullScreenOpen) {
      if (!historyPushedRef.current && window.history) {
        window.history.pushState({ abirView: 'fullscreen-player' }, '');
        historyPushedRef.current = true;
      }
    } else {
      if (historyPushedRef.current) {
        historyPushedRef.current = false;
        if (window.history.state?.abirView === 'fullscreen-player') {
          window.history.back();
        }
      }
    }
  }, [isFullScreenOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // --- 1. Window PopState listener (Browser / WebView back button) ---
    const handlePopState = () => {
      if (isFullScreenOpenRef.current) {
        historyPushedRef.current = false;
        onCloseFullScreenRef.current();
        return;
      }
      if (menuTrackRef.current) {
        onCloseMenuTrackRef.current();
        return;
      }
      if (selectedPlaylistRef.current) {
        onClosePlaylistRef.current();
        return;
      }
      if (selectedArtistRef.current) {
        onCloseArtistRef.current();
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);

    // --- 2. Document 'backbutton' listener (Cordova / Capacitor Android bridge) ---
    const handleDocBackButton = (e: Event) => {
      if (isFullScreenOpenRef.current) {
        e.preventDefault();
        e.stopPropagation();
        historyPushedRef.current = false;
        onCloseFullScreenRef.current();
        return;
      }
      if (menuTrackRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onCloseMenuTrackRef.current();
        return;
      }
      if (selectedPlaylistRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onClosePlaylistRef.current();
        return;
      }
      if (selectedArtistRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onCloseArtistRef.current();
        return;
      }
      if (activeTabRef.current !== 'home') {
        e.preventDefault();
        e.stopPropagation();
        onGoHomeRef.current();
        return;
      }
    };

    document.addEventListener('backbutton', handleDocBackButton);

    // --- 3. Capacitor Native App plugin 'backButton' listener ---
    let listenerHandle: any = null;
    let isCleanedUp = false;

    const setupCapacitorAppListener = async () => {
      try {
        const appPlugin = CapApp || (window as any).Capacitor?.Plugins?.App;
        if (appPlugin && typeof appPlugin.addListener === 'function') {
          listenerHandle = await appPlugin.addListener(
            'backButton',
            ({ canGoBack }: { canGoBack: boolean }) => {
              if (isFullScreenOpenRef.current) {
                historyPushedRef.current = false;
                onCloseFullScreenRef.current();
                return;
              }

              if (menuTrackRef.current) {
                onCloseMenuTrackRef.current();
                return;
              }

              if (selectedPlaylistRef.current) {
                onClosePlaylistRef.current();
                return;
              }

              if (selectedArtistRef.current) {
                onCloseArtistRef.current();
                return;
              }

              if (activeTabRef.current !== 'home') {
                onGoHomeRef.current();
                return;
              }

              // When on Home with all modals closed:
              if (canGoBack) {
                window.history.back();
              } else if (typeof appPlugin.exitApp === 'function') {
                appPlugin.exitApp();
              }
            }
          );

          if (isCleanedUp && listenerHandle && typeof listenerHandle.remove === 'function') {
            listenerHandle.remove();
          }
        }
      } catch (err) {
        console.warn('Capacitor App backButton listener registration warning:', err);
      }
    };

    setupCapacitorAppListener();

    return () => {
      isCleanedUp = true;
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('backbutton', handleDocBackButton);
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, []);
}
