/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TabType, Track, RepeatMode, Playlist, CuratedMix, Artist, Album } from './types';
import { CURATED_MIXES, TOP_ARTISTS, ALBUMS } from './data/mockMusic';
import { audioEngine } from './audio/audioEngine';
import {
  getAudioStream,
  getLyrics,
  getTrendingMusic,
  searchTracks,
  getSmartRecommendations,
  isStandardSingleTrack,
  fetchMixPlaylistTracks,
  recordSessionTrack,
  recordSessionTracks,
  isTrackDuplicate,
  getFreshTrendingBatch,
  findEmbeddableAlternative,
  markVideoEmbedRestricted,
} from './services/api';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { MiniPlayer } from './components/MiniPlayer';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { ExploreView } from './components/ExploreView';
import { LibraryView } from './components/LibraryView';
import { SongMenuModal } from './components/SongMenuModal';
import { PlaylistDetailModal } from './components/PlaylistDetailModal';
import { ArtistDetailModal } from './components/ArtistDetailModal';
import { SplashScreen } from './components/SplashScreen';
import { Capacitor } from '@capacitor/core';
import { CapacitorMusicControls } from 'capacitor-music-controls-plugin';

const DEFAULT_RECENTLY_PLAYED: Track[] = [];
const DEFAULT_LIKED_TRACK_IDS: string[] = [];
const DEFAULT_PINNED_TRACK_IDS: Record<string, boolean> = {};

import { useBackgroundPlayback } from './hooks/useBackgroundPlayback';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';

export default function App() {
  useBackgroundPlayback();

  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentCategory, setCurrentCategory] = useState('All');

  // Persistent storage hooks with strictly empty defaults
  const [recentlyPlayed, setRecentlyPlayed] = useLocalStorage<Track[]>(
    'abirtune_recently_played',
    DEFAULT_RECENTLY_PLAYED
  );

  const [likedTrackIds, setLikedTrackIds] = useLocalStorage<string[]>(
    'abirtune_liked_tracks',
    DEFAULT_LIKED_TRACK_IDS
  );

  const [pinnedTrackIds, setPinnedTrackIds] = useLocalStorage<Record<string, boolean>>(
    'abirtune_pinned_tracks',
    DEFAULT_PINNED_TRACK_IDS
  );

  const [pinnedTracks, setPinnedTracks] = useLocalStorage<Track[]>(
    'abirtune_pinned_tracks_data',
    []
  );

  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>(
    'abirtune_custom_playlists',
    []
  );

  // Clean out any legacy dummy tracks from stored state on initial mount
  useEffect(() => {
    setRecentlyPlayed((prev) =>
      Array.isArray(prev)
        ? prev.filter((t) => t && t.id && !t.id.startsWith('track-') && t.title !== 'Mindful Soundscapes' && t.title !== 'Tera Yun')
        : []
    );
    setPlaylists((prev) => {
      if (!Array.isArray(prev)) return [];
      const seenIds = new Set<string>();
      const seenTitles = new Set<string>();
      const deduplicated: Playlist[] = [];

      for (const p of prev) {
        if (!p || !p.id) continue;
        const normalizedTitle = (p.title || '').trim().toLowerCase();
        // Skip duplicate IDs or duplicate playlist names
        if (seenIds.has(p.id) || (normalizedTitle && seenTitles.has(normalizedTitle))) {
          continue;
        }
        seenIds.add(p.id);
        if (normalizedTitle) seenTitles.add(normalizedTitle);

        deduplicated.push({
          ...p,
          tracks: (p.tracks || []).filter(
            (t) => t && t.id && !t.id.startsWith('track-') && t.title !== 'Mindful Soundscapes' && t.title !== 'Tera Yun'
          ),
        });
      }
      return deduplicated.filter((p) => p.isCustom || p.tracks.length > 0);
    });

    // Clean out any legacy dummy tracks from persistent pinnedTracks
    setPinnedTracks((prev) => {
      const safePrev = Array.isArray(prev)
        ? prev.filter((t) => t && t.id && !t.id.startsWith('track-') && t.title !== 'Mindful Soundscapes' && t.title !== 'Tera Yun')
        : [];

      // Auto-backfill from stored pinnedTrackIds if pinnedTracks was empty
      const existingIds = new Set(safePrev.map((t) => t.id));
      const storedIdsStr = typeof window !== 'undefined' ? window.localStorage.getItem('abirtune_pinned_tracks') : null;
      if (storedIdsStr) {
        try {
          const parsedIds: Record<string, boolean> = JSON.parse(storedIdsStr);
          const activeKeys = Object.keys(parsedIds).filter((k) => parsedIds[k] && !existingIds.has(k));
          if (activeKeys.length > 0) {
            const recovered: Track[] = [];
            activeKeys.forEach((k) => {
              const inRecent = DEFAULT_RECENTLY_PLAYED.find((t) => t.id === k);
              if (inRecent && !existingIds.has(inRecent.id)) {
                recovered.push(inRecent);
                existingIds.add(inRecent.id);
                return;
              }
              for (const mix of CURATED_MIXES) {
                const inMix = mix.tracks?.find((t) => t.id === k);
                if (inMix && !existingIds.has(inMix.id)) {
                  recovered.push(inMix);
                  existingIds.add(inMix.id);
                  return;
                }
              }
            });
            if (recovered.length > 0) {
              return [...safePrev, ...recovered];
            }
          }
        } catch {
          // ignore
        }
      }
      return safePrev;
    });

    // Ensure pinnedTrackIds includes all tracks in pinnedTracks
    setPinnedTrackIds((prev) => {
      const storedDataStr = typeof window !== 'undefined' ? window.localStorage.getItem('abirtune_pinned_tracks_data') : null;
      if (!storedDataStr) return prev;
      try {
        const parsedList = JSON.parse(storedDataStr);
        if (Array.isArray(parsedList) && parsedList.length > 0) {
          const updated = { ...prev };
          let changed = false;
          parsedList.forEach((t: Track) => {
            if (t && t.id && !updated[t.id]) {
              updated[t.id] = true;
              changed = true;
            }
          });
          return changed ? updated : prev;
        }
      } catch {
        // ignore
      }
      return prev;
    });
  }, []);

  // App Initialization Simulation
  useEffect(() => {
    let isMounted = true;

    const readyTimer = setTimeout(() => {
      setIsAppReady(true);
      const removeSplashTimer = setTimeout(() => {
        setShowSplash(false);
      }, 500);
      return () => clearTimeout(removeSplashTimer);
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(readyTimer);
    };
  }, []);

  // Audio Playback State (Initial queue MUST be strictly an empty array [])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  // Modals and Overlays
  const [isFullScreenOpen, setIsFullScreenOpen] = useState<boolean>(false);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Task 1: Intercept Android hardware & gesture back button navigation
  useAndroidBackButton({
    isFullScreenOpen,
    onCloseFullScreen: () => setIsFullScreenOpen(false),
    menuTrack,
    onCloseMenuTrack: () => setMenuTrack(null),
    selectedPlaylist,
    onClosePlaylist: () => setSelectedPlaylist(null),
    selectedArtist,
    onCloseArtist: () => setSelectedArtist(null),
    activeTab,
    onGoHome: () => setActiveTab('home'),
  });

  // Queue and Track Refs for reliable callbacks
  const queueRef = useRef<Track[]>(queue);
  queueRef.current = queue;

  const currentTrackRef = useRef<Track | null>(currentTrack);
  currentTrackRef.current = currentTrack;

  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;

  const isShuffleRef = useRef<boolean>(isShuffle);
  isShuffleRef.current = isShuffle;

  const currentTimeRef = useRef<number>(currentTime);
  currentTimeRef.current = currentTime;

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const handleNextTrackRef = useRef<() => void>(() => {});
  const handlePrevTrackRef = useRef<() => void>(() => {});

  const playSessionCounterRef = useRef<number>(0);

  // Playback History Ref: maintains rolling session history of all played tracks
  const playbackHistoryRef = useRef<Track[]>([]);

  // Guard flag for proactive queue replenishment when approaching end of queue
  const isReplenishingQueueRef = useRef<boolean>(false);

  // Synchronize playbackHistoryRef and session rolling history with persisted recently played
  useEffect(() => {
    if (Array.isArray(recentlyPlayed) && recentlyPlayed.length > 0) {
      playbackHistoryRef.current = [...recentlyPlayed];
      recordSessionTracks(recentlyPlayed);
    }
  }, []);

  // Filter Liked Tracks (combining queue & recently played)
  const allKnownTracks = useMemo(
    () => Array.from(new Map([...recentlyPlayed, ...queue].map((t) => [t.id, t])).values()),
    [recentlyPlayed, queue]
  );
  const likedTracks = useMemo(
    () => allKnownTracks.filter((t) => likedTrackIds.includes(t.id)),
    [allKnownTracks, likedTrackIds]
  );

  // Toggle Like Status with Persistence
  const handleToggleLike = useCallback(
    (trackId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setLikedTrackIds((prev) => {
        if (prev.includes(trackId)) {
          return prev.filter((id) => id !== trackId);
        } else {
          return [trackId, ...prev];
        }
      });

      setCurrentTrack((prev) => {
        if (prev && prev.id === trackId) {
          return { ...prev, isLiked: !prev.isLiked };
        }
        return prev;
      });
    },
    [setLikedTrackIds]
  );

  // Toggle Pin on Speed Dial with permanent localStorage synchronization
  const handleTogglePin = useCallback(
    (trackId: string, e?: React.MouseEvent, trackObj?: Track) => {
      e?.stopPropagation();

      const resolvedTrack =
        trackObj ||
        (menuTrack?.id === trackId ? menuTrack : null) ||
        (currentTrack?.id === trackId ? currentTrack : null) ||
        pinnedTracks.find((t) => t.id === trackId) ||
        recentlyPlayed.find((t) => t.id === trackId) ||
        DEFAULT_RECENTLY_PLAYED.find((t) => t.id === trackId);

      setPinnedTrackIds((prev) => {
        const isCurrentlyPinned = !!prev[trackId];
        const nextPinned = !isCurrentlyPinned;

        // Persist full Track object to abirtune_pinned_tracks_data in localStorage
        setPinnedTracks((prevTracks) => {
          const safeTracks = Array.isArray(prevTracks) ? prevTracks : [];
          if (nextPinned) {
            // Pin: add track to pinned array if not already present
            if (safeTracks.some((t) => t.id === trackId)) {
              return safeTracks;
            }
            if (resolvedTrack) {
              return [resolvedTrack, ...safeTracks];
            }
            return safeTracks;
          } else {
            // Unpin: remove track from pinned array
            return safeTracks.filter((t) => t.id !== trackId);
          }
        });

        return {
          ...prev,
          [trackId]: nextPinned,
        };
      });
    },
    [menuTrack, currentTrack, pinnedTracks, recentlyPlayed, setPinnedTrackIds, setPinnedTracks]
  );

  // Play Specific Track (with complete queue reset & endless radio recommendation fetching)
  const handlePlayTrack = useCallback(
    async (
      track: Track,
      customQueue?: Track[],
      fromQueue: boolean = false,
      isRadioMode: boolean = false
    ) => {
      const isSameTrack = currentTrackRef.current?.id === track.id;

      if (isSameTrack && !isRadioMode) {
        if (audioEngine.getCurrentTime() > 0) {
          if (isPlaying) {
            audioEngine.pause();
            setIsPlaying(false);
          } else {
            audioEngine.resume();
            setIsPlaying(true);
          }
          return;
        }
      }

      const updatedTrack: Track = {
        ...track,
        isLiked: likedTrackIds.includes(track.id),
      };

      setCurrentTrack(updatedTrack);
      currentTrackRef.current = updatedTrack;
      setCurrentTime(0);
      setIsPlaying(true);

      // Queue management:
      // If Radio Mode (e.g. from Search Results, Home Speed Dial, Quick Picks) or standalone track play:
      // Immediately set clicked track as active track at position 0, then smoothly fetch clean, relevant recommendations
      if (isRadioMode || (!customQueue && !fromQueue)) {
        setQueue([updatedTrack]);

        const currentSessionId = ++playSessionCounterRef.current;

        const activeIds = new Set<string>();
        if (updatedTrack.id) activeIds.add(updatedTrack.id);
        if (updatedTrack.videoId) activeIds.add(updatedTrack.videoId);

        getSmartRecommendations(updatedTrack, activeIds)
          .then((recommended) => {
            if (playSessionCounterRef.current !== currentSessionId) return;

            if (recommended && recommended.length > 0) {
              const seen = new Set<string>();
              if (updatedTrack.id) seen.add(updatedTrack.id);
              if (updatedTrack.videoId) seen.add(updatedTrack.videoId);

              const valid: Track[] = [];
              for (const t of recommended) {
                if (!isStandardSingleTrack(t)) continue;
                const vId = t.videoId || t.id;
                if (!seen.has(t.id) && !seen.has(vId)) {
                  seen.add(t.id);
                  seen.add(vId);
                  valid.push(t);
                }
              }

              if (valid.length > 0) {
                recordSessionTracks(valid);
                setQueue([updatedTrack, ...valid]);
              }
            }
          })
          .catch((err) => {
            console.warn('Smart recommendation generation warning:', err);
          });
      } else if (customQueue && customQueue.length > 0) {
        // Explicit multi-track queue (e.g. playlist or curated mix)
        setQueue(customQueue);
        recordSessionTracks(customQueue);
      } else if (fromQueue) {
        // Track picked from within active queue -> keep queue intact
        setQueue((prev) => {
          if (!prev.some((t) => t.id === track.id || (t.videoId && track.videoId && t.videoId === track.videoId))) {
            return [...prev, updatedTrack];
          }
          return prev;
        });
      }

      // Update session playback history ref (rolling history of all played songs in session, max 100)
      playbackHistoryRef.current = [
        updatedTrack,
        ...playbackHistoryRef.current.filter(
          (t) => t.id !== track.id && (!t.videoId || t.videoId !== track.videoId)
        ),
      ].slice(0, 100);

      // Record track in session rolling history to prevent premature looping
      recordSessionTrack(updatedTrack);

      // Recently Played persistence (instantly unshift newly playing track to index 0, deduplicate, max 20)
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id && (!t.videoId || t.videoId !== track.videoId));
        return [updatedTrack, ...filtered].slice(0, 20);
      });

      // Video ID resolution for official YouTube background playback
      const targetVideoId = track.videoId || track.id;

      // Fetch lyrics if missing
      if (!track.lyrics || track.lyrics.length === 0) {
        getLyrics(track.id, track.title, track.artist, track.duration)
          .then((lyrics) => {
            if (lyrics && lyrics.length > 0) {
              setCurrentTrack((prev) => (prev?.id === track.id ? { ...prev, lyrics } : prev));
            }
          })
          .catch(() => {});
      }

      // Start YouTube IFrame Audio Engine playback with stream URL & metadata fallback
      audioEngine.unlockAudio();
      audioEngine.playTrack(
        targetVideoId,
        track.duration || 210,
        track.bpm || 100,
        0,
        track.audioUrl,
        {
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          moodCategory: track.moodCategory,
        }
      );

      // Native CapacitorMusicControls for Android background execution and lock screen notifications
      if (Capacitor.isNativePlatform()) {
        try {
          CapacitorMusicControls.create({
            track: track.title || 'Playing Song',
            artist: track.artist || 'AbirTune',
            cover:
              track.coverUrl && !track.coverUrl.startsWith('data:image/svg')
                ? track.coverUrl
                : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
            isPlaying: true,
            dismissable: false,
            hasPrev: true,
            hasNext: true,
            hasClose: true,
            playIcon: 'media_play',
            pauseIcon: 'media_pause',
            prevIcon: 'media_prev',
            nextIcon: 'media_next',
            closeIcon: 'media_close',
            notificationIcon: 'notification',
          }).catch((err: any) => {
            console.warn('CapacitorMusicControls create error:', err);
          });
        } catch (e) {
          console.warn('CapacitorMusicControls create exception:', e);
        }
      }

      // Web Lock Screen & Notifications via MediaSession API
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title || 'Playing Song',
            artist: track.artist || 'AbirTune',
            album: track.album || 'Music',
            artwork: [
              {
                src:
                  track.coverUrl && !track.coverUrl.startsWith('data:image/svg')
                    ? track.coverUrl
                    : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
                sizes: '512x512',
                type: 'image/jpeg',
              },
            ],
          });

          navigator.mediaSession.setActionHandler('play', () => {
            audioEngine.resume();
            setIsPlaying(true);
          });
          navigator.mediaSession.setActionHandler('pause', () => {
            audioEngine.pause();
            setIsPlaying(false);
          });
          navigator.mediaSession.setActionHandler('previoustrack', () => {
            handlePrevTrackRef.current();
          });
          navigator.mediaSession.setActionHandler('nexttrack', () => {
            handleNextTrackRef.current();
          });
        } catch (e) {
          console.warn('MediaSession error:', e);
        }
      }
    },
    [isPlaying, likedTrackIds, setRecentlyPlayed, recentlyPlayed]
  );

  // Next Track Logic with Dynamic Recommendations (Endless Radio)
  const handleNextTrack = useCallback(() => {
    const curr = currentTrackRef.current;
    const currentQueue = queueRef.current;
    const repeat = repeatModeRef.current;
    const isShuff = isShuffleRef.current;

    if (!curr || currentQueue.length === 0) return;

    if (repeat === 'one') {
      audioEngine.seek(0);
      setCurrentTime(0);
      handlePlayTrack(curr, undefined, true);
      return;
    }

    const currentIndex = currentQueue.findIndex(
      (t) => t.id === curr.id || (t.videoId && curr.videoId && t.videoId === curr.videoId)
    );
    let nextIndex = currentIndex + 1;

    if (isShuff) {
      nextIndex = Math.floor(Math.random() * currentQueue.length);
    } else if (nextIndex >= currentQueue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        // Dynamic Up-Next: Fetch clean similar songs based on current artist/title/mood and append
        const existingIds = new Set<string>();
        queueRef.current.forEach((t) => {
          if (t.id) existingIds.add(t.id);
          if (t.videoId) existingIds.add(t.videoId);
        });

        getSmartRecommendations(curr, existingIds)
          .then((freshRecommendations) => {
            const valid = freshRecommendations
              .filter((track) => isStandardSingleTrack(track, true))
              .filter((t) => !existingIds.has(t.id) && (!t.videoId || !existingIds.has(t.videoId)));

            if (valid.length > 0) {
              recordSessionTracks(valid);
              setQueue((prev) => {
                const prevIds = new Set<string>();
                prev.forEach((t) => {
                  if (t.id) prevIds.add(t.id);
                  if (t.videoId) prevIds.add(t.videoId);
                });
                const fresh = valid.filter(
                  (t) => !prevIds.has(t.id) && (!t.videoId || !prevIds.has(t.videoId))
                );
                return fresh.length > 0 ? [...prev, ...fresh] : prev;
              });
              handlePlayTrack(valid[0], undefined, true);
            } else {
              getTrendingMusic('IN').then((fallbackTracks) => {
                const fallbackFresh = fallbackTracks
                  .filter((track) => isStandardSingleTrack(track, true))
                  .filter((t) => !existingIds.has(t.id) && (!t.videoId || !existingIds.has(t.videoId)));
                if (fallbackFresh.length > 0) {
                  recordSessionTracks(fallbackFresh);
                  setQueue((prev) => {
                    const prevIds = new Set<string>();
                    prev.forEach((t) => {
                      if (t.id) prevIds.add(t.id);
                      if (t.videoId) prevIds.add(t.videoId);
                    });
                    const fresh = fallbackFresh.filter(
                      (t) => !prevIds.has(t.id) && (!t.videoId || !prevIds.has(t.videoId))
                    );
                    return fresh.length > 0 ? [...prev, ...fresh] : prev;
                  });
                  handlePlayTrack(fallbackFresh[0], undefined, true);
                } else if (currentQueue.length > 0) {
                  handlePlayTrack(currentQueue[0], undefined, true);
                }
              });
            }
          })
          .catch(() => {
            if (currentQueue.length > 0) {
              handlePlayTrack(currentQueue[0], undefined, true);
            }
          });
        return;
      }
    }

    const nextTrack = currentQueue[nextIndex];
    if (nextTrack) {
      handlePlayTrack(nextTrack, undefined, true);
    }
  }, [handlePlayTrack, recentlyPlayed]);

  // Proactive Queue Replenishment: smoothly appends fresh recommendations as the user approaches end of queue
  useEffect(() => {
    const track = currentTrack;
    if (!track || isReplenishingQueueRef.current) return;
    if (queue.length <= 2) return;

    const currentIdx = queue.findIndex(
      (t) => t.id === track.id || (t.videoId && track.videoId && t.videoId === track.videoId)
    );
    const remainingInQueue = queue.length - 1 - (currentIdx >= 0 ? currentIdx : 0);

    if (remainingInQueue <= 2) {
      isReplenishingQueueRef.current = true;
      const currentExcludedIds = new Set<string>();
      queueRef.current.forEach((t) => {
        if (t.id) currentExcludedIds.add(t.id);
        if (t.videoId) currentExcludedIds.add(t.videoId);
      });

      getSmartRecommendations(track, currentExcludedIds)
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            const valid = fetched
              .filter((track) => isStandardSingleTrack(track, true))
              .filter((t) => !currentExcludedIds.has(t.id) && (!t.videoId || !currentExcludedIds.has(t.videoId)));

            if (valid.length > 0) {
              recordSessionTracks(valid);
              setQueue((prev) => {
                const existingIds = new Set<string>();
                prev.forEach((t) => {
                  if (t.id) existingIds.add(t.id);
                  if (t.videoId) existingIds.add(t.videoId);
                });
                const fresh = valid.filter(
                  (t) => !existingIds.has(t.id) && (!t.videoId || !existingIds.has(t.videoId))
                );
                return fresh.length > 0 ? [...prev, ...fresh] : prev;
              });
            }
          }
        })
        .catch((err) => {
          console.warn('Proactive queue replenishment warning:', err);
        })
        .finally(() => {
          setTimeout(() => {
            isReplenishingQueueRef.current = false;
          }, 1500);
        });
    }
  }, [currentTrack, queue, recentlyPlayed]);

  // Previous Track Logic
  const handlePrevTrack = useCallback(() => {
    const curr = currentTrackRef.current;
    const currentQueue = queueRef.current;
    const time = currentTimeRef.current;

    if (!curr || currentQueue.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (time > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }

    const currentIndex = currentQueue.findIndex(
      (t) => t.id === curr.id || (t.videoId && curr.videoId && t.videoId === curr.videoId)
    );
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentQueue.length - 1;
    const prevTrack = currentQueue[prevIndex];

    if (prevTrack) {
      handlePlayTrack(prevTrack, undefined, true);
    }
  }, [handlePlayTrack]);

  handleNextTrackRef.current = handleNextTrack;
  handlePrevTrackRef.current = handlePrevTrack;

  // Native Music Controls Event Subscription (Native only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleAction = (action: any) => {
      const message = typeof action === 'string' ? action : action?.message || action;
      switch (message) {
        case 'music-controls-play':
          audioEngine.resume();
          setIsPlaying(true);
          try {
            CapacitorMusicControls.updateIsPlaying({ isPlaying: true });
          } catch {}
          break;
        case 'music-controls-pause':
          audioEngine.pause();
          setIsPlaying(false);
          try {
            CapacitorMusicControls.updateIsPlaying({ isPlaying: false });
          } catch {}
          break;
        case 'music-controls-next':
          handleNextTrackRef.current();
          break;
        case 'music-controls-previous':
          handlePrevTrackRef.current();
          break;
        case 'music-controls-destroy':
          audioEngine.pause();
          setIsPlaying(false);
          break;
        default:
          break;
      }
    };

    try {
      if (typeof CapacitorMusicControls.addListener === 'function') {
        CapacitorMusicControls.addListener('controlsNotification', handleAction);
      }
      if (typeof document !== 'undefined') {
        document.addEventListener('controlsNotification', (e: any) => {
          handleAction(e?.detail?.message || e?.message || e?.action || e);
        });
      }
    } catch (err) {
      console.warn('CapacitorMusicControls subscription error:', err);
    }
  }, []);

  // Setup Audio Engine Callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      (time) => {
        setCurrentTime(time);
      },
      () => {
        handleNextTrack();
      },
      undefined,
      async (err) => {
        console.warn('Audio Engine error notification:', err);
        const curr = currentTrackRef.current;
        const errCode = typeof err === 'object' ? err?.code : err;

        // If error code is 150/101 (embed restricted by copyright owner),
        // attempt to find and play an embeddable audio/lyric version of this track
        if (curr && (errCode === 150 || errCode === 101 || errCode === 100 || errCode === 2)) {
          try {
            markVideoEmbedRestricted(curr.videoId || curr.id);
            const altId = await findEmbeddableAlternative(curr.title, curr.artist, curr.videoId || curr.id);
            if (altId && altId !== curr.videoId && altId !== curr.id) {
              console.log('Switching to embeddable audio version:', altId);
              audioEngine.playTrack(
                altId,
                curr.duration || 210,
                curr.bpm || 100,
                audioEngine.getCurrentTime(),
                curr.audioUrl,
                {
                  title: curr.title,
                  artist: curr.artist,
                  genre: curr.genre,
                  moodCategory: curr.moodCategory,
                }
              );
              return;
            }
          } catch (e) {
            console.warn('Alternative video search error:', e);
          }

          // Fallback: If no embeddable alternative is found, advance to the next track so playback never breaks
          console.warn('Embed restricted video has no alternative, advancing to next track');
          handleNextTrack();
        }
      }
    );
  }, [handleNextTrack]);

  // Resume Playback
  const handleResume = useCallback(() => {
    audioEngine.unlockAudio();
    const curr = currentTrackRef.current;
    if (!curr) {
      const q = queueRef.current;
      if (q.length > 0) {
        handlePlayTrack(q[0]);
      }
      return;
    }
    const time = currentTimeRef.current;
    if (time >= (curr.duration || 180)) {
      setCurrentTime(0);
      handlePlayTrack(curr);
    } else {
      audioEngine.resume();
      setIsPlaying(true);
      isPlayingRef.current = true;
      if (Capacitor.isNativePlatform()) {
        try {
          CapacitorMusicControls.updateIsPlaying({ isPlaying: true });
        } catch {}
      }
    }
  }, [handlePlayTrack]);

  // Pause Playback
  const handlePause = useCallback(() => {
    audioEngine.pause();
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (Capacitor.isNativePlatform()) {
      try {
        CapacitorMusicControls.updateIsPlaying({ isPlaying: false });
      } catch {}
    }
  }, []);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      audioEngine.unlockAudio();
      if (isPlayingRef.current) {
        handlePause();
      } else {
        handleResume();
      }
    },
    [handlePause, handleResume]
  );

  // --- Bluetooth Headset & Remote Media Controls Integration ---
  // Tracks single, double, and triple presses from Bluetooth headset hardware buttons
  const headsetPressCountRef = useRef<number>(0);
  const headsetPressTimerRef = useRef<any>(null);

  // Remote Skip Next (Headset double-press or AVRCP next button)
  const handleRemoteNext = useCallback(() => {
    headsetPressCountRef.current = 0;
    if (headsetPressTimerRef.current) {
      clearTimeout(headsetPressTimerRef.current);
      headsetPressTimerRef.current = null;
    }
    console.log('[Remote Headset] Skip Next');
    handleNextTrack();
  }, [handleNextTrack]);

  // Remote Skip Previous (Headset triple-press or AVRCP prev button)
  const handleRemotePrev = useCallback(() => {
    headsetPressCountRef.current = 0;
    if (headsetPressTimerRef.current) {
      clearTimeout(headsetPressTimerRef.current);
      headsetPressTimerRef.current = null;
    }
    console.log('[Remote Headset] Skip Previous');
    handlePrevTrack();
  }, [handlePrevTrack]);

  // Unified Bluetooth Headset Play/Pause Remote Multi-Press Processor
  // Single press: Play/Pause
  // Double press: Skip to next track
  // Triple press: Skip to previous track
  const handleRemotePlayPausePress = useCallback(
    (forcedAction?: 'play' | 'pause') => {
      headsetPressCountRef.current += 1;
      const currentCount = headsetPressCountRef.current;

      if (headsetPressTimerRef.current) {
        clearTimeout(headsetPressTimerRef.current);
        headsetPressTimerRef.current = null;
      }

      if (currentCount === 2) {
        // Double press: next track
        headsetPressTimerRef.current = setTimeout(() => {
          headsetPressCountRef.current = 0;
          headsetPressTimerRef.current = null;
          console.log('[Remote Headset] Double Press detected: Next Track');
          handleNextTrack();
        }, 280);
      } else if (currentCount >= 3) {
        // Triple press: previous track
        headsetPressCountRef.current = 0;
        if (headsetPressTimerRef.current) {
          clearTimeout(headsetPressTimerRef.current);
          headsetPressTimerRef.current = null;
        }
        console.log('[Remote Headset] Triple Press detected: Previous Track');
        handlePrevTrack();
      } else {
        // Single press: wait 280ms debouncing window for possible consecutive presses
        headsetPressTimerRef.current = setTimeout(() => {
          headsetPressCountRef.current = 0;
          headsetPressTimerRef.current = null;
          console.log('[Remote Headset] Single Press confirmed: Play/Pause');
          if (forcedAction === 'play') {
            handleResume();
          } else if (forcedAction === 'pause') {
            handlePause();
          } else {
            handleTogglePlay();
          }
        }, 280);
      }
    },
    [handleNextTrack, handlePrevTrack, handleResume, handlePause, handleTogglePlay]
  );

  // Seek
  const handleSeek = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  }, []);

  // Toggle Shuffle
  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  // Toggle Repeat (off -> all -> one -> off)
  const handleToggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  // Play Curated Mix with vibrant multi-genre queue
  const handlePlayMix = useCallback(
    async (mix: CuratedMix) => {
      try {
        let mixTracks = mix.tracks;
        if (!mixTracks || mixTracks.length === 0) {
          mixTracks = await fetchMixPlaylistTracks(mix.id, mix.title, 'IN');
        }
        const valid = (mixTracks || []).filter((track) => isStandardSingleTrack(track, true));
        if (valid.length > 0) {
          handlePlayTrack(valid[0], valid, false, true);
        }
      } catch (err) {
        console.warn('Error playing curated mix:', err);
      }
    },
    [handlePlayTrack]
  );

  // Open Curated Mix in dedicated track list view with dynamic endless radio transition
  const handleSelectMix = useCallback(
    async (mix: CuratedMix, preloadedTracks?: Track[]) => {
      let mixTracks = preloadedTracks && preloadedTracks.length > 0 ? preloadedTracks : mix.tracks || [];
      const mixPlaylist: Playlist = {
        id: mix.id,
        title: mix.title,
        description: `${mix.subtitle} • Curated by ${mix.curator}`,
        coverUrl: mix.coverUrl,
        tracks: mixTracks,
        gradient: mix.gradient,
        createdAt: mix.tag || 'CURATED MIX',
      };
      setSelectedPlaylist(mixPlaylist);

      if (mixTracks.length === 0) {
        try {
          const fetched = await fetchMixPlaylistTracks(mix.id, mix.title, 'IN');
          const valid = fetched.filter((track) => isStandardSingleTrack(track, true));
          setSelectedPlaylist((prev) =>
            prev && prev.id === mix.id ? { ...prev, tracks: valid } : prev
          );
        } catch (err) {
          console.warn('Error fetching curated mix tracks:', err);
        }
      }
    },
    []
  );

  // Open Album in dedicated track list view
  const handleSelectAlbum = useCallback(
    async (album: Album) => {
      const albumTracks = album.tracks && album.tracks.length > 0 ? album.tracks : [];
      const albumPlaylist: Playlist = {
        id: album.id,
        title: album.title,
        description: `${album.artist} • ${album.year}`,
        coverUrl: album.coverUrl,
        tracks: albumTracks,
        gradient: 'from-amber-950/60 to-zinc-950',
        createdAt: 'ALBUM',
      };
      setSelectedPlaylist(albumPlaylist);

      if (albumTracks.length > 0) {
        recordSessionTracks(albumTracks);
        return;
      }

      try {
        let tracks = await searchTracks(`${album.title} songs`, 'IN');
        if (tracks.length < 3) {
          const altTracks = await searchTracks(`${album.title} ${album.artist}`, 'IN');
          if (altTracks.length > tracks.length) tracks = altTracks;
        }
        const valid = tracks.filter((track) => isStandardSingleTrack(track, true));
        const finalTracks = valid.length >= 3 ? valid : (tracks.length > 0 ? tracks : valid);
        recordSessionTracks(finalTracks);
        setSelectedPlaylist((prev) =>
          prev && prev.id === album.id ? { ...prev, tracks: finalTracks } : prev
        );
      } catch (err) {
        console.warn('Error loading album tracks:', err);
      }
    },
    []
  );

  // Open Artist / Actor Profile in dedicated profile view with full discography
  const handleSelectArtist = useCallback(
    (artist: Artist) => {
      setSelectedArtist(artist);
      if (artist.tracks && artist.tracks.length > 0) {
        recordSessionTracks(artist.tracks);
      }
    },
    []
  );

  // Shuffle Play a set of tracks
  const handleShufflePlay = useCallback(
    (trackList: Track[]) => {
      if (trackList.length === 0) return;
      const shuffled = [...trackList].sort(() => Math.random() - 0.5);
      setIsShuffle(true);
      handlePlayTrack(shuffled[0], shuffled, false, true);
    },
    [handlePlayTrack]
  );

  // Create New Custom Playlist
  const handleCreatePlaylist = useCallback(
    (title: string, description: string, initialTrack?: Track) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      setPlaylists((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        // Strict duplicate check: prevent creating playlist if one with the exact same name already exists
        const alreadyExists = safePrev.some(
          (p) => p.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
        );
        if (alreadyExists) {
          return safePrev;
        }

        // Strictly unique ID: crypto.randomUUID() with timestamp & random fallback
        const uniqueId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `playlist-custom-${crypto.randomUUID()}`
            : `playlist-custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        const targetTrack = initialTrack || currentTrack;
        const newPlaylist: Playlist = {
          id: uniqueId,
          title: trimmedTitle,
          description: description.trim() || 'Custom playlist created on AbirTune',
          coverUrl:
            targetTrack?.coverUrl ||
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
          tracks: targetTrack ? [targetTrack] : [],
          isCustom: true,
          createdAt: 'Just now',
          gradient: 'from-purple-900/80 to-indigo-950',
        };
        return [newPlaylist, ...safePrev];
      });
    },
    [currentTrack, setPlaylists]
  );

  // Add Track to an Existing Custom Playlist
  const handleAddTrackToPlaylist = useCallback(
    (playlistId: string, track: Track) => {
      if (!track || !playlistId) return;

      setPlaylists((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          const exists = pl.tracks.some((t) => t.id === track.id);
          if (exists) return pl;
          return {
            ...pl,
            tracks: [...pl.tracks, track],
            coverUrl: pl.coverUrl || track.coverUrl,
          };
        });
      });

      setSelectedPlaylist((prev) => {
        if (!prev || prev.id !== playlistId) return prev;
        const exists = prev.tracks.some((t) => t.id === track.id);
        if (exists) return prev;
        return {
          ...prev,
          tracks: [...prev.tracks, track],
          coverUrl: prev.coverUrl || track.coverUrl,
        };
      });
    },
    [setPlaylists]
  );

  // Open Context Menu for Track
  const handleOpenMenu = useCallback((track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuTrack(track);
  }, []);

  // Add to Up Next Queue
  const handleAddToQueue = useCallback((track: Track) => {
    recordSessionTrack(track);
    setQueue((prev) => {
      const exists = prev.some(
        (t) => t.id === track.id || (t.videoId && track.videoId && t.videoId === track.videoId)
      );
      return exists ? prev : [...prev, track];
    });
  }, []);

  // Play Next
  const handlePlayNext = useCallback(
    (track: Track) => {
      recordSessionTrack(track);
      if (!currentTrack) {
        handlePlayTrack(track);
        return;
      }
      const filtered = queue.filter(
        (t) => t.id !== track.id && (!t.videoId || !track.videoId || t.videoId !== track.videoId)
      );
      const currIdx = filtered.findIndex((t) => t.id === currentTrack.id);
      const updated = [...filtered];
      updated.splice(currIdx + 1, 0, track);
      setQueue(updated);
    },
    [currentTrack, queue, handlePlayTrack]
  );

  // Helper to ensure media notification and lock screen receive valid, high-resolution raster artwork
  const getMediaSessionArtwork = useCallback((track: Track | null): MediaImage[] => {
    if (!track) return [];
    let cover = track.coverUrl || '';

    // Android MediaSessionCompat drops SVG data URIs; resolve to valid high-res raster JPEG/PNG
    if (!cover || cover.startsWith('data:image/svg')) {
      const vId = track.videoId || track.id;
      if (vId && vId.length === 11 && !vId.startsWith('yt-')) {
        cover = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
      } else {
        cover = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=512&auto=format&fit=crop&q=80';
      }
    }

    if (cover.startsWith('/')) {
      cover = window.location.origin + cover;
    }

    return [
      { src: cover, sizes: '96x96', type: 'image/jpeg' },
      { src: cover, sizes: '128x128', type: 'image/jpeg' },
      { src: cover, sizes: '192x192', type: 'image/jpeg' },
      { src: cover, sizes: '256x256', type: 'image/jpeg' },
      { src: cover, sizes: '384x384', type: 'image/jpeg' },
      { src: cover, sizes: '512x512', type: 'image/jpeg' },
    ];
  }, []);

  // Media Session API Setup for System Media Notification Controls & Lock Screen
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album || 'AbirTune Music',
          artwork: getMediaSessionArtwork(currentTrack),
        });
      } catch (e) {
        console.warn('MediaSession metadata assignment error:', e);
      }
    }

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {}

    try {
      // Direct remote hardware & notification action mappings
      navigator.mediaSession.setActionHandler('play', () => handleRemotePlayPausePress('play'));
      navigator.mediaSession.setActionHandler('pause', () => handleRemotePlayPausePress('pause'));
      navigator.mediaSession.setActionHandler('previoustrack', () => handleRemotePrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleRemoteNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          handleSeek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        handleSeek(currentTimeRef.current + (details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        handleSeek(Math.max(0, currentTimeRef.current - (details.seekOffset || 10)));
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        handlePause();
      });
    } catch {
      // Some actions might be unsupported by specific browser engines
    }
  }, [
    currentTrack,
    isPlaying,
    getMediaSessionArtwork,
    handleRemotePlayPausePress,
    handleRemotePrev,
    handleRemoteNext,
    handleSeek,
    handlePause,
  ]);

  // Hardware Media Remote Keys & Capacitor Bluetooth Headset Button Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const keyCode = e.keyCode || e.which;

      if (
        key === 'MediaTrackNext' ||
        keyCode === 87 || // Android KEYCODE_MEDIA_NEXT
        keyCode === 176
      ) {
        e.preventDefault();
        handleRemoteNext();
      } else if (
        key === 'MediaTrackPrevious' ||
        keyCode === 88 || // Android KEYCODE_MEDIA_PREVIOUS
        keyCode === 177
      ) {
        e.preventDefault();
        handleRemotePrev();
      } else if (
        key === 'MediaPlayPause' ||
        keyCode === 85 || // Android KEYCODE_MEDIA_PLAY_PAUSE
        keyCode === 79 || // Android KEYCODE_HEADSETHOOK
        keyCode === 179
      ) {
        e.preventDefault();
        handleRemotePlayPausePress();
      } else if (key === 'MediaPlay' || keyCode === 126) {
        e.preventDefault();
        handleRemotePlayPausePress('play');
      } else if (key === 'MediaPause' || keyCode === 127) {
        e.preventDefault();
        handleRemotePlayPausePress('pause');
      } else if (key === 'MediaStop' || keyCode === 178) {
        e.preventDefault();
        handlePause();
      }
    };

    // Capacitor native document media button events
    const onHeadsetButton = (e: any) => {
      try {
        e?.preventDefault?.();
      } catch {}
      handleRemotePlayPausePress();
    };

    const onMediaButton = (e: any) => {
      try {
        e?.preventDefault?.();
      } catch {}
      const buttonType = e?.button || e?.detail?.button;
      if (buttonType === 'next' || buttonType === 'fastforward') {
        handleRemoteNext();
      } else if (buttonType === 'previous' || buttonType === 'rewind') {
        handleRemotePrev();
      } else {
        handleRemotePlayPausePress();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('headsetbutton', onHeadsetButton as any, true);
    document.addEventListener('mediabutton', onMediaButton as any, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('headsetbutton', onHeadsetButton as any, true);
      document.removeEventListener('mediabutton', onMediaButton as any, true);
    };
  }, [handleRemoteNext, handleRemotePrev, handleRemotePlayPausePress, handlePause]);

  // Sync position state to MediaSession
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!currentTrack || typeof navigator.mediaSession.setPositionState !== 'function') return;

    try {
      const dur = currentTrack.duration || 210;
      if (dur > 0 && currentTime >= 0 && currentTime <= dur) {
        navigator.mediaSession.setPositionState({
          duration: dur,
          playbackRate: 1,
          position: currentTime,
        });
      }
    } catch {}
  }, [currentTime, currentTrack]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-[#ff2d55] selection:text-white relative overflow-x-hidden">
      {/* Dynamic Ambient Mesh Glow */}
      <div
        className="fixed top-0 left-0 w-full h-full opacity-30 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, #ff2d55 0%, transparent 40%), radial-gradient(circle at 20% 80%, #9254de 0%, transparent 40%)',
          filter: 'blur(120px)',
        }}
      />

      {/* Top Header with YouTube Music Minimal Branding & Horizontal Mood Pills */}
      <Header
        currentCategory={currentCategory}
        onSelectCategory={setCurrentCategory}
      />

      {/* Main Tab Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto relative z-10">
        {activeTab === 'home' && (
          <HomeView
            currentCategory={currentCategory}
            mixes={CURATED_MIXES}
            recentTracks={recentlyPlayed}
            pinnedTracks={pinnedTracks}
            artists={TOP_ARTISTS}
            albums={ALBUMS}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            pinnedIds={pinnedTrackIds}
            onTogglePin={handleTogglePin}
            onPlayTrack={handlePlayTrack}
            onPlayMix={handlePlayMix}
            onSelectMix={handleSelectMix}
            onSelectArtist={handleSelectArtist}
            onSelectAlbum={handleSelectAlbum}
            onToggleLike={handleToggleLike}
            onOpenMenu={handleOpenMenu}
          />
        )}

        {activeTab === 'search' && (
          <SearchView
            tracks={queue}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onToggleLike={handleToggleLike}
            onOpenMenu={handleOpenMenu}
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={handleSelectArtist}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreView
            tracks={queue}
            mixes={CURATED_MIXES}
            albums={ALBUMS}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onPlayMix={handleSelectMix}
            onSelectAlbum={handleSelectAlbum}
            onToggleLike={handleToggleLike}
            onOpenMenu={handleOpenMenu}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            playlists={playlists}
            likedTracks={likedTracks}
            artists={TOP_ARTISTS}
            albums={ALBUMS}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onShufflePlay={handleShufflePlay}
            onSelectPlaylist={(pl) => setSelectedPlaylist(pl)}
            onCreatePlaylist={handleCreatePlaylist}
            onToggleLike={handleToggleLike}
            onOpenMenu={handleOpenMenu}
            onSelectArtist={handleSelectArtist}
            onSelectAlbum={handleSelectAlbum}
          />
        )}
      </main>

      {/* Docked YouTube Music Style Mini Player */}
      <MiniPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onTogglePlay={handleTogglePlay}
        onNextTrack={(e) => {
          e.stopPropagation();
          handleNextTrack();
        }}
        onToggleLike={(id, e) => handleToggleLike(id, e)}
        onExpandPlayer={() => setIsFullScreenOpen(true)}
      />

      {/* Floating 4-Tab Apple-Style Docked Navbar: [Home, Search, Explore, Library] */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Full-Screen Immersive Player */}
      <FullScreenPlayer
        isOpen={isFullScreenOpen}
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        queue={queue}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        onClose={() => setIsFullScreenOpen(false)}
        onTogglePlay={() => handleTogglePlay()}
        onPrevTrack={handlePrevTrack}
        onNextTrack={handleNextTrack}
        onSeek={handleSeek}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleLike={(id) => handleToggleLike(id)}
        onSelectTrackFromQueue={(t) => handlePlayTrack(t, undefined, true)}
        onOpenSongMenu={(t) => setMenuTrack(t)}
      />

      {/* Song Context Actions Modal */}
      <SongMenuModal
        track={menuTrack}
        isOpen={!!menuTrack}
        onClose={() => setMenuTrack(null)}
        onToggleLike={(id) => handleToggleLike(id)}
        onTogglePin={(id, trk) => handleTogglePin(id, undefined, trk || menuTrack || undefined)}
        isPinned={!!menuTrack && (!!pinnedTrackIds[menuTrack.id] || pinnedTracks.some((t) => t.id === menuTrack.id))}
        onAddToQueue={handleAddToQueue}
        onPlayNext={handlePlayNext}
        playlists={playlists}
        onAddToPlaylist={handleAddTrackToPlaylist}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Playlist Detail View */}
      <PlaylistDetailModal
        playlist={selectedPlaylist}
        isOpen={!!selectedPlaylist}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onClose={() => setSelectedPlaylist(null)}
        onPlayTrack={(track) => handlePlayTrack(track, undefined, false, true)}
        onShufflePlay={handleShufflePlay}
        onToggleLike={handleToggleLike}
        onOpenMenu={handleOpenMenu}
      />

      {/* Artist & Actor Detail Profile Modal */}
      <ArtistDetailModal
        artist={selectedArtist}
        isOpen={!!selectedArtist}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onClose={() => setSelectedArtist(null)}
        onPlayTrack={(track, customQueue) => handlePlayTrack(track, customQueue, false, true)}
        onShufflePlay={handleShufflePlay}
        onToggleLike={handleToggleLike}
        onOpenMenu={handleOpenMenu}
      />

      {/* Initial App Splash Screen */}
      {showSplash && <SplashScreen isFadingOut={isAppReady} />}
    </div>
  );
}
