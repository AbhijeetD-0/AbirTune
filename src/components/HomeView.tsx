import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import {
  Sparkles,
  Play,
  Flame,
  Radio,
  TrendingUp,
  Music2,
  ChevronRight,
  ChevronLeft,
  Pin,
  Clock,
  Volume2,
  Loader2,
  Disc,
  RotateCw,
} from 'lucide-react';
import { Track, CuratedMix, Artist, Album } from '../types';
import { TrackCard } from './TrackCard';
import { PullToRefresh } from './PullToRefresh';
import { ExpandedBrowseView } from './ExpandedBrowseView';
import { LongFormSection } from './LongFormSection';
import { handleImageError } from '../data/imageFallback';
import { checkDevotionalHabits, ALL_DEVOTIONAL_TRACKS, isDevotionalTrack } from '../data/devotionalData';
import {
  searchTracks,
  getTrendingMusic,
  isStandardSingleTrack,
  fetchMoodTracks,
  fetchMixPlaylistTracks,
} from '../services/api';

interface HomeViewProps {
  currentCategory: string;
  mixes: CuratedMix[];
  quickPicks?: Track[];
  recentTracks: Track[];
  pinnedTracks?: Track[];
  artists: Artist[];
  albums: Album[];
  currentTrack: Track | null;
  isPlaying: boolean;
  pinnedIds?: Record<string, boolean>;
  onTogglePin?: (trackId: string, e?: React.MouseEvent, track?: Track) => void;
  onPlayTrack: (track: Track, newQueue?: Track[], fromQueue?: boolean, isRadioMode?: boolean) => void;
  onPlayMix: (mix: CuratedMix) => void;
  onSelectMix?: (mix: CuratedMix, preloadedTracks?: Track[]) => void;
  onSelectArtist: (artist: Artist) => void;
  onSelectAlbum: (album: Album) => void;
  onToggleLike: (trackId: string, e: React.MouseEvent) => void;
  onOpenMenu: (track: Track, e: React.MouseEvent) => void;
  onViewAllPicks?: () => void;
}

const HomeViewComponent: React.FC<HomeViewProps> = ({
  currentCategory,
  mixes,
  quickPicks = [],
  recentTracks,
  pinnedTracks = [],
  artists,
  albums,
  currentTrack,
  isPlaying,
  pinnedIds: externalPinnedIds,
  onTogglePin,
  onPlayTrack,
  onPlayMix,
  onSelectMix,
  onSelectArtist,
  onSelectAlbum,
  onToggleLike,
  onOpenMenu,
}) => {
  // Live fetched tracks from YouTube/Piped API for trending home
  const [liveTrendingTracks, setLiveTrendingTracks] = useState<Track[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);

  // Dynamic category tracks cache map (e.g. 'sad', 'romance', 'relax', 'feel good', 'podcasts')
  const [categoryTracksMap, setCategoryTracksMap] = useState<Record<string, Track[]>>({});
  const [isLoadingCategory, setIsLoadingCategory] = useState<boolean>(false);

  // Dynamic curated mix tracks cache map & loading indicator
  const [mixTracksMap, setMixTracksMap] = useState<Record<string, Track[]>>({});
  const [loadingMixId, setLoadingMixId] = useState<string | null>(null);

  // Track cache store to look up pinned tracks even across category switches
  const allTracksRegistryRef = useRef<Map<string, Track>>(new Map());

  // Dedicated expanded view state ('artists' | 'albums' | null)
  const [expandedSection, setExpandedSection] = useState<'artists' | 'albums' | null>(null);

  // Speed Dial tracks with local pin fallback if not provided
  const [internalPinnedIds, setInternalPinnedIds] = useState<Record<string, boolean>>({});
  const pinnedIds = externalPinnedIds || internalPinnedIds;

  // Cache any incoming tracks for fast lookup
  const registerTracks = (tracksList: Track[]) => {
    tracksList.forEach((t) => {
      if (t && t.id) {
        allTracksRegistryRef.current.set(t.id, t);
      }
    });
  };

  useEffect(() => {
    registerTracks(recentTracks);
    registerTracks(pinnedTracks);
  }, [recentTracks, pinnedTracks]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshRevision, setRefreshRevision] = useState(0);

  // Dynamic refresh helper to fetch and shuffle a completely fresh batch of tracks
  const handleRefreshHome = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const startTime = Date.now();
    const norm = currentCategory.toLowerCase().trim();
    try {
      if (norm === 'all') {
        const freshTracks = await getTrendingMusic('IN', true);
        const validTracks = freshTracks.filter((track) => isStandardSingleTrack(track, true));
        if (validTracks.length > 0) {
          setLiveTrendingTracks([...validTracks]);
          registerTracks(validTracks);
          setRefreshRevision((r) => r + 1);
        }
      } else {
        const freshMood = await fetchMoodTracks(currentCategory, 'IN', true);
        const validTracks = freshMood.filter((track) => isStandardSingleTrack(track, true));
        if (validTracks.length > 0) {
          setCategoryTracksMap((prev) => ({
            ...prev,
            [norm]: [...validTracks],
          }));
          registerTracks(validTracks);
          setRefreshRevision((r) => r + 1);
        }
      }
    } catch (err) {
      console.warn('Manual refresh error:', err);
    } finally {
      // Ensure at least 500ms so pull-to-refresh animation completes fluidly
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }
      setIsRefreshing(false);
    }
  };

  // On initial mount / app refresh: query Official YouTube API for a freshly shuffled dynamic batch
  useEffect(() => {
    let isMounted = true;
    setIsLoadingLive(true);

    const loadInitialTrending = async () => {
      try {
        // Force fresh batch on every app load/refresh
        const trendingTracks = await getTrendingMusic('IN', true);
        const validTracks = trendingTracks.filter((track) => isStandardSingleTrack(track, true));
        if (isMounted && validTracks.length > 0) {
          setLiveTrendingTracks(validTracks);
          registerTracks(validTracks);
        }
      } catch (err) {
        console.warn('Initial trending fetch error:', err);
      } finally {
        if (isMounted) {
          setIsLoadingLive(false);
        }
      }
    };

    loadInitialTrending();

    return () => {
      isMounted = false;
    };
  }, [refreshRevision]);

  // Watch currentCategory: dynamically fetch YouTube music for the selected mood
  useEffect(() => {
    let isMounted = true;
    const norm = currentCategory.toLowerCase().trim();

    if (norm === 'all') {
      setIsLoadingCategory(false);
      return;
    }

    if (categoryTracksMap[norm] && categoryTracksMap[norm].length > 0) {
      setIsLoadingCategory(false);
      return;
    }

    setIsLoadingCategory(true);
    fetchMoodTracks(currentCategory, 'IN')
      .then((tracks) => {
        if (isMounted) {
          const valid = tracks.filter((track) => isStandardSingleTrack(track, true));
          setCategoryTracksMap((prev) => ({
            ...prev,
            [norm]: valid,
          }));
          registerTracks(valid);
        }
      })
      .catch((err) => {
        console.warn(`Error loading mood tracks for ${currentCategory}:`, err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategory(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentCategory]);

  // Pre-load top curated mixes ('Latest Bollywood Hits' and 'Trending Hindi Charts')
  useEffect(() => {
    let isMounted = true;
    const preloadMixes = async () => {
      const topMixes = [
        { id: 'mix-latest-bollywood', title: 'Latest Bollywood Hits' },
        { id: 'mix-trending-hindi', title: 'Trending Hindi Charts' },
      ];
      for (const mixItem of topMixes) {
        try {
          const tracks = await fetchMixPlaylistTracks(mixItem.id, mixItem.title, 'IN');
          if (isMounted && tracks.length > 0) {
            setMixTracksMap((prev) => ({ ...prev, [mixItem.id]: tracks }));
            registerTracks(tracks);
          }
        } catch (e) {
          // ignore
        }
      }
    };
    preloadMixes();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTogglePin = (trackId: string, e?: React.MouseEvent, trackObj?: Track) => {
    if (onTogglePin) {
      onTogglePin(trackId, e, trackObj);
    } else {
      e?.stopPropagation();
      setInternalPinnedIds((prev) => ({
        ...prev,
        [trackId]: !prev[trackId],
      }));
    }
  };

  // Active category tracks pool: dynamically updates when mood/category is selected
  const isAllCategory = currentCategory.toLowerCase() === 'all';
  const normCategory = currentCategory.toLowerCase().trim();
  const activeCategoryTracks = categoryTracksMap[normCategory] || [];

  // Dynamically evaluate user listening habits for Devotional (Bhaktigeeti) music
  const devotionalHabit = useMemo(() => {
    return checkDevotionalHabits(recentTracks, Object.keys(pinnedIds || {}));
  }, [recentTracks, pinnedIds]);

  // Active Quick Picks list: for 'All', uses clean mainstream liveTrendingTracks. For moods, uses activeCategoryTracks.
  // Devotional/Bhakti tracks are strictly reserved for when the user selects the Bhakti category.
  const activeTracks = useMemo(() => {
    let baseList: Track[] = [];
    if (normCategory === 'bhakti' || normCategory === 'devotional') {
      baseList = activeCategoryTracks.length > 0 ? activeCategoryTracks : ALL_DEVOTIONAL_TRACKS;
    } else if (isAllCategory) {
      // Mainstream popular hits for default homepage view
      baseList = liveTrendingTracks.length > 0 ? liveTrendingTracks : (quickPicks.length > 0 ? quickPicks : []);
    } else {
      baseList = activeCategoryTracks.length > 0 ? activeCategoryTracks : liveTrendingTracks;
    }

    // Exclude any YouTube Shorts, unofficial reel mixes, non-music user uploads, and devotional over-blending on 'All'
    return baseList.filter((track) => {
      if (!isStandardSingleTrack(track, true)) return false;
      if (isAllCategory && isDevotionalTrack(track)) return false;
      return true;
    });
  }, [isAllCategory, normCategory, liveTrendingTracks, quickPicks, activeCategoryTracks, refreshRevision]);

  // Task 1: Quick Picks Carousel - dynamically calculated sets based on actual loaded tracks
  // The first 3 tracks are featured as the top visual spotlight cards.
  // The remaining loaded tracks populate the horizontal carousel sets.
  const carouselTracks = useMemo(() => {
    if (activeTracks.length > 3) {
      return activeTracks.slice(3);
    }
    return activeTracks;
  }, [activeTracks]);

  // Task 1: Calculate sets dynamically with consistent 4-track chunks
  const trackSets = useMemo(() => {
    if (carouselTracks.length === 0) return [];
    const sets: Track[][] = [];
    const chunkSize = 4;
    for (let i = 0; i < carouselTracks.length; i += chunkSize) {
      const chunk = carouselTracks.slice(i, i + chunkSize);
      // Ensure sets are substantive (either complete 4-track set, or last set with at least 2 tracks, or the only set)
      if (chunk.length >= 2 || sets.length === 0) {
        sets.push(chunk);
      }
    }
    return sets;
  }, [carouselTracks]);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Synchronize active set index when trackSets changes (e.g. category switch or refresh)
  useEffect(() => {
    setActiveSetIndex((prev) => {
      if (trackSets.length === 0) return 0;
      return Math.min(prev, Math.max(0, trackSets.length - 1));
    });
  }, [trackSets.length]);

  // Task 1: Dynamically calculate visible set index accurately across all screen sizes
  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current || trackSets.length <= 1) {
      if (activeSetIndex !== 0) setActiveSetIndex(0);
      return;
    }
    const container = carouselRef.current;
    const { scrollLeft, clientWidth, scrollWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 5) {
      setActiveSetIndex(0);
      return;
    }

    // Boundaries: strictly first or last set
    if (scrollLeft <= 8) {
      setActiveSetIndex(0);
      return;
    }
    if (scrollLeft >= maxScroll - 12) {
      setActiveSetIndex(trackSets.length - 1);
      return;
    }

    // Dynamic child measurement: find the column whose relative offset is closest to scrollLeft
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length > 0) {
      let closestIdx = 0;
      let minDistance = Infinity;
      const containerLeft = container.offsetLeft;

      children.forEach((child, idx) => {
        const childLeft = child.offsetLeft - containerLeft;
        const distance = Math.abs(childLeft - scrollLeft);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      });
      setActiveSetIndex(Math.max(0, Math.min(closestIdx, trackSets.length - 1)));
    }
  }, [trackSets.length, activeSetIndex]);

  // ResizeObserver to dynamically update active set on device rotation or responsive screen resize
  useEffect(() => {
    if (!carouselRef.current) return;
    const observer = new ResizeObserver(() => {
      handleCarouselScroll();
    });
    observer.observe(carouselRef.current);
    return () => observer.disconnect();
  }, [handleCarouselScroll]);

  const scrollToSet = (direction: 'next' | 'prev') => {
    if (!carouselRef.current || trackSets.length <= 1) return;
    const container = carouselRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const containerLeft = container.offsetLeft;

    let targetIndex = direction === 'next' ? activeSetIndex + 1 : activeSetIndex - 1;
    targetIndex = Math.max(0, Math.min(targetIndex, trackSets.length - 1));

    if (children[targetIndex]) {
      const targetLeft = children[targetIndex].offsetLeft - containerLeft;
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    } else {
      const slide = container.firstElementChild as HTMLElement | null;
      const slideWidth = slide ? slide.offsetWidth + 14 : container.clientWidth * 0.88;
      const targetScroll =
        direction === 'next'
          ? container.scrollLeft + slideWidth
          : container.scrollLeft - slideWidth;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  const scrollToSetIndex = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const containerLeft = container.offsetLeft;

    const safeIndex = Math.max(0, Math.min(index, trackSets.length - 1));
    if (children[safeIndex]) {
      const targetLeft = children[safeIndex].offsetLeft - containerLeft;
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  };

  // Curated mixes for active category
  const activeMixes = useMemo(() => {
    const isAll = currentCategory.toLowerCase() === 'all';
    let base = mixes;
    if (!isAll) {
      const norm = currentCategory.toLowerCase();
      const matching = mixes.filter(
        (m) => m.moodCategory?.toLowerCase() === norm || m.title.toLowerCase().includes(norm)
      );
      const nonMatching = mixes.filter(
        (m) => m.moodCategory?.toLowerCase() !== norm && !m.title.toLowerCase().includes(norm)
      );
      base = [...matching, ...nonMatching];
    }
    if (refreshRevision > 0 && base.length > 0) {
      const shift = refreshRevision % base.length;
      return [...base.slice(shift), ...base.slice(0, shift)];
    }
    return base;
  }, [mixes, currentCategory, refreshRevision]);

  // Stable 3x3 Speed Dial calculation:
  // Guaranteed:
  // 1. Pinned tracks ALWAYS appear first in a fixed slot order and are permanently stored in localStorage.
  // 2. Remaining slots up to 9 are filled with freshly loaded/refreshed trending & mood tracks.
  // 3. Updates dynamically on manual Home Refresh.
  const speedDialTracks = useMemo(() => {
    const pinned: Track[] = [];
    const unpinned: Track[] = [];
    const seenIds = new Set<string>();

    // 1. Collect all pinned tracks first:
    // (a) From the dedicated persistent pinnedTracks list
    pinnedTracks.forEach((t) => {
      if (t && t.id && pinnedIds[t.id] !== false && !seenIds.has(t.id)) {
        pinned.push(t);
        seenIds.add(t.id);
      }
    });

    // (b) From pinnedIds map looking up in allTracksRegistryRef
    Object.keys(pinnedIds).forEach((id) => {
      if (pinnedIds[id] && !seenIds.has(id)) {
        const found = allTracksRegistryRef.current.get(id);
        if (found && !seenIds.has(found.id)) {
          pinned.push(found);
          seenIds.add(found.id);
        }
      }
    });

    // 2. Candidate unpinned tracks: freshly loaded tracks appear first so Refresh changes them immediately!
    const rawCandidates: Track[] = isAllCategory
      ? [...liveTrendingTracks, ...recentTracks]
      : [...activeCategoryTracks, ...liveTrendingTracks, ...recentTracks];
    // Filter out shorts, non-music uploads, and prevent devotional tracks from bleeding into the 'All' speed dial
    const candidates = rawCandidates.filter((t) => {
      if (!isStandardSingleTrack(t, true)) return false;
      if (isAllCategory && isDevotionalTrack(t)) return false;
      return true;
    });

    for (const trk of candidates) {
      if (!seenIds.has(trk.id)) {
        unpinned.push(trk);
        seenIds.add(trk.id);
      }
      if (pinned.length + unpinned.length >= 9) break;
    }

    return [...pinned, ...unpinned].slice(0, 9);
  }, [isAllCategory, activeCategoryTracks, liveTrendingTracks, pinnedIds, pinnedTracks, recentTracks, refreshRevision]);

  // Handler for clicking Curated Mix cards: opens dedicated track list view
  const handleMixClick = (mix: CuratedMix) => {
    const preloaded = mixTracksMap[mix.id] || mix.tracks || [];
    if (onSelectMix) {
      onSelectMix(mix, preloaded);
    } else {
      onPlayMix(mix);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefreshHome} isRefreshing={isRefreshing}>
      <div id="home-view" className="space-y-7 pb-44 pt-2 px-1">
        {/* YouTube Music "Speed Dial" (3x3 Grid of 9 Quick Items) */}
        <section id="speed-dial-section" className="space-y-2.5 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ff2d55]" />
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentCategory === 'All' ? 'Speed Dial' : `${currentCategory} Speed Dial`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-medium hidden xs:inline">
                {currentCategory === 'All' ? 'Listen again & Quick picks' : `Top ${currentCategory} picks`}
              </span>
            </div>
          </div>

        {/* 3 Rows x 3 Columns Scrollable Grid */}
        <div
          id="speed-dial-grid"
          className="grid grid-rows-3 grid-flow-col gap-2 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 snap-x"
        >
          {speedDialTracks.map((track, idx) => {
            const isThisTrackPlaying = currentTrack?.id === track.id && isPlaying;
            const isPinned =
              pinnedIds[track.id] === true ||
              (pinnedIds[track.id] !== false && pinnedTracks.some((p) => p.id === track.id));

            return (
              <div
                key={`speed-dial-${track.id}-${idx}`}
                id={`speed-dial-item-${track.id}`}
                onClick={() => onPlayTrack(track, undefined, false, true)}
                className={`group flex items-center justify-between w-[240px] xs:w-[260px] p-2 rounded-xl transition-all duration-200 cursor-pointer snap-start border ${
                  isThisTrackPlaying
                    ? 'bg-white/15 border-[#ff2d55]/60 shadow-lg shadow-[#ff2d55]/10'
                    : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-md">
                    <img
                      src={
                        track.coverUrl ||
                        track.thumbnail ||
                        track.thumbnailUrl ||
                        track.artwork ||
                        track.imageUrl ||
                        (track.videoId ? `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg` : '') ||
                        (track.id && !track.id.startsWith('album-') && !track.id.startsWith('local-') && !track.id.startsWith('mix-')
                          ? `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`
                          : '')
                      }
                      alt={track.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, 'track', track.title)}
                    />
                    {isThisTrackPlaying && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-[#ff2d55] animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4
                      className={`text-xs font-semibold truncate ${
                        isThisTrackPlaying
                          ? 'text-[#ff2d55]'
                          : 'text-white group-hover:text-rose-200'
                      }`}
                    >
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Actions: Pin button and Quick Play */}
                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                  <button
                    id={`pin-btn-${track.id}`}
                    onClick={(e) => handleTogglePin(track.id, e, track)}
                    title={isPinned ? 'Pinned to Speed Dial' : 'Pin to Speed Dial'}
                    className={`p-1.5 rounded-full transition-colors ${
                      isPinned
                        ? 'text-[#ff2d55] bg-[#ff2d55]/15'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                  </button>

                  <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-[#ff2d55] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Curated Mixes Carousel - White Highlight & Dynamic Rich Multi-genre Playlists */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Curated Mixes</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                Live
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">Tailored multi-genre mixes & charts</p>
          </div>
          <span className="text-[11px] text-white/90 font-bold uppercase tracking-wider">
            Daily Mixes
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-3 pt-1">
          {activeMixes.map((mix, idx) => {
            const loadedTracks = mixTracksMap[mix.id] || mix.tracks;
            const trackCount = loadedTracks?.length || (mix.trackIds?.length > 0 ? mix.trackIds.length : 20);
            const isThisMixLoading = loadingMixId === mix.id;

            return (
              <div
                key={`${mix.id}-${idx}`}
                id={`curated-mix-${mix.id}`}
                onClick={() => handleMixClick(mix)}
                className={`group relative flex-shrink-0 w-72 rounded-3xl overflow-hidden cursor-pointer p-5 flex flex-col justify-between border shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-[#050505]/90 ${
                  mix.isPinned || mix.id.includes('bollywood') || mix.id.includes('trending')
                    ? 'border-white/30 hover:border-white ring-1 ring-white/20 hover:ring-white/40 shadow-xl shadow-white/5'
                    : 'border-white/15 hover:border-white/40'
                }`}
              >
                {/* Cover Background with Glass Blur */}
                <img
                  src={mix.coverUrl}
                  alt={mix.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${mix.gradient} opacity-80`} />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/25 text-white backdrop-blur-md border border-white/40 shadow-sm">
                    {mix.tag}
                  </span>
                  <span className="text-[11px] text-zinc-300 font-medium">
                    {mix.curator}
                  </span>
                </div>

                <div className="relative z-10 pt-10">
                  <h3 className="text-xl font-extrabold text-white group-hover:text-rose-100 transition-colors leading-tight drop-shadow-md">
                    {mix.title}
                  </h3>
                  <p className="text-xs text-zinc-300 font-medium mt-1 line-clamp-1">
                    {mix.subtitle}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-200 font-medium bg-black/30 px-2 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                      <Music2 className="w-3.5 h-3.5 text-[#ff2d55]" />
                      <span>{trackCount} tracks</span>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#ff2d55] group-hover:text-white transition-all duration-300">
                      {isThisMixLoading ? (
                        <Loader2 className="w-4 h-4 text-zinc-900 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Picks - 3 Visual Cards + List */}
      <section className="space-y-3 px-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentCategory === 'All' ? 'Quick Picks' : `${currentCategory} Picks`}
              </h3>
              {(normCategory === 'bhakti' || normCategory === 'devotional') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Bhakti &amp; Devotional
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {currentCategory === 'All'
                ? 'Instant hits & trending tracks'
                : `Popular & trending in ${currentCategory}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {trackSets.length > 1 && (
              <div className="flex items-center gap-0.5 bg-white/5 rounded-full p-0.5 border border-white/10">
                <button
                  onClick={() => scrollToSet('prev')}
                  disabled={activeSetIndex === 0}
                  aria-label="Previous set"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 disabled:hover:text-white/80 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-semibold text-zinc-400 px-1 select-none">
                  {activeSetIndex + 1}/{trackSets.length}
                </span>
                <button
                  onClick={() => scrollToSet('next')}
                  disabled={activeSetIndex >= trackSets.length - 1}
                  aria-label="Next set"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 disabled:hover:text-white/80 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {activeTracks.length > 0 && (
              <button
                onClick={() => onPlayTrack(activeTracks[0], activeTracks, false, false)}
                className="text-xs font-bold text-[#ff2d55] hover:text-white flex items-center gap-1 transition-colors uppercase tracking-wider"
              >
                <span>Play all</span>
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>
        </div>

        {/* 3 Square Visual Cards */}
        <div className="grid grid-cols-3 gap-3">
          {activeTracks.slice(0, 3).map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => onPlayTrack(track, undefined, false, true)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer transition-all duration-300 hover:border-white/20 active:scale-95 shadow-lg"
            >
              <img
                src={
                  track.coverUrl ||
                  track.thumbnail ||
                  track.thumbnailUrl ||
                  track.artwork ||
                  track.imageUrl ||
                  (track.videoId ? `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg` : '') ||
                  (track.id && !track.id.startsWith('album-') && !track.id.startsWith('local-') && !track.id.startsWith('mix-')
                    ? `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`
                    : '')
                }
                alt={track.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, 'track', track.title)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                <p className="font-bold text-xs text-white truncate group-hover:text-[#ff2d55] transition-colors">
                  {track.title}
                </p>
                <p className="text-[10px] text-white/60 truncate">
                  {track.artist}
                </p>
              </div>
              {currentTrack?.id === track.id && isPlaying && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#ff2d55] flex items-center justify-center shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Smooth Horizontal Scrollable Carousel (Right-to-Left Slide Sets) */}
        {trackSets.length > 0 && (
          <div className="relative pt-1 space-y-2">
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory -mx-3 px-3 py-1"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              {trackSets.map((set, setIdx) => (
                <div
                  key={`quick-pick-set-${setIdx}`}
                  className="w-[88vw] sm:w-[360px] max-w-[390px] flex-shrink-0 snap-start flex flex-col gap-2.5"
                >
                  {set.map((track, idx) => (
                    <TrackCard
                      key={`carousel-track-${track.id}-${setIdx}-${idx}`}
                      track={track}
                      variant="quick-pick"
                      isCurrentTrack={currentTrack?.id === track.id}
                      isPlaying={isPlaying}
                      onPlay={(t) => onPlayTrack(t, undefined, false, true)}
                      onToggleLike={onToggleLike}
                      onOpenMenu={onOpenMenu}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Carousel Pagination Dots */}
            {trackSets.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {trackSets.map((_, idx) => (
                  <button
                    key={`carousel-dot-${idx}`}
                    onClick={() => scrollToSetIndex(idx)}
                    aria-label={`Go to set ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeSetIndex === idx ? 'w-5 bg-[#ff2d55]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Featured Artists Horizon */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-3">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Top Artists</span>
            <TrendingUp className="w-4 h-4 text-[#9254de]" />
          </h3>
          <button
            id="view-more-artists-btn"
            onClick={() => setExpandedSection('artists')}
            className="text-xs font-bold text-[#ff2d55] hover:text-white flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <span>View More</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-3">
          {artists.map((artist, idx) => (
            <div
              key={`${artist.id}-${idx}`}
              id={`artist-card-${artist.id}`}
              onClick={() => onSelectArtist(artist)}
              className="group flex-shrink-0 flex flex-col items-center cursor-pointer w-24 text-center"
            >
              <div className="relative w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#ff2d55] to-[#9254de] group-hover:scale-105 transition-transform duration-300 shadow-xl">
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  loading="lazy"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, 'artist', artist.name)}
                />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate w-full mt-2">
                {artist.name}
              </span>
              <span className="text-[10px] text-zinc-400 truncate w-full">
                {artist.monthlyListeners}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Albums Horizon */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-3">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Featured Albums</span>
            <Disc className="w-4 h-4 text-[#ff2d55]" />
          </h3>
          <button
            id="view-more-albums-btn"
            onClick={() => setExpandedSection('albums')}
            className="text-xs font-bold text-[#ff2d55] hover:text-white flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <span>View More</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-3">
          {albums.map((album, idx) => (
            <div
              key={`${album.id}-${idx}`}
              id={`album-card-${album.id}`}
              onClick={() => onSelectAlbum(album)}
              className="group flex-shrink-0 w-36 cursor-pointer"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-white/25 transition-all duration-300 shadow-lg mb-2">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, 'album', album.title)}
                />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate">
                {album.title}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                {album.artist} • {album.year}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Long-form Audio/Video Section (30-minute to 1-hour continuous mixes, discourses & musical journeys) */}
      <section className="px-3">
        <LongFormSection
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={(track, queue) => onPlayTrack(track, queue, false, false)}
          onTogglePlay={() => {
            if (currentTrack) {
              onPlayTrack(currentTrack);
            }
          }}
        />
      </section>

      {/* Dedicated Expanded View for Top Artists & Featured Albums */}
      {expandedSection && (
        <ExpandedBrowseView
          initialType={expandedSection}
          artists={artists}
          albums={albums}
          onClose={() => setExpandedSection(null)}
          onSelectArtist={(artist) => {
            setExpandedSection(null);
            onSelectArtist(artist);
          }}
          onSelectAlbum={(album) => {
            setExpandedSection(null);
            onSelectAlbum(album);
          }}
        />
      )}
    </div>
    </PullToRefresh>
  );
};

export const HomeView = memo(HomeViewComponent);
HomeView.displayName = 'HomeView';


