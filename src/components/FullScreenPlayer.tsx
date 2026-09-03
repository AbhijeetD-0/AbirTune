import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  ListMusic,
  Mic2,
  Disc,
  Equal,
  BookmarkPlus,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Track, RepeatMode, PlayerViewTab } from '../types';
import { audioEngine } from '../audio/audioEngine';
import { getLyrics } from '../services/api';

interface FullScreenPlayerProps {
  isOpen: boolean;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  queue: Track[];
  repeatMode: RepeatMode;
  isShuffle: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (trackId: string) => void;
  onSelectTrackFromQueue: (track: Track) => void;
  onOpenSongMenu: (track: Track) => void;
}

interface QueueItemRowProps {
  item: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  onSelect: (track: Track) => void;
}

const QueueItemRow = React.memo<QueueItemRowProps>(
  ({ item, isCurrent, isPlaying, onSelect }) => {
    return (
      <div
        id={`queue-item-${item.id}`}
        onClick={() => onSelect(item)}
        className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors duration-150 border ${
          isCurrent
            ? 'bg-[#ff2d55]/15 border-[#ff2d55]/40 shadow-lg'
            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/10'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Small Album Thumbnail */}
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md">
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {isCurrent && isPlaying && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 bg-[#ff2d55] rounded-full wave-bar-1" />
                  <span className="w-0.5 bg-[#ff2d55] rounded-full wave-bar-2" />
                  <span className="w-0.5 bg-[#ff2d55] rounded-full wave-bar-3" />
                </div>
              </div>
            )}
          </div>

          {/* Track Title & Artist */}
          <div className="min-w-0 flex-1 pr-2">
            <p
              className={`text-xs font-bold truncate ${
                isCurrent ? 'text-[#ff2d55]' : 'text-zinc-100 group-hover:text-white'
              }`}
            >
              {item.title}
            </p>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {item.artist}
            </p>
          </div>
        </div>

        {/* 2-line Drag Handle Icon (Equal / Drag Handle) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400">
            {audioEngine.formatTime(item.duration)}
          </span>
          <div className="text-zinc-500 group-hover:text-zinc-300 p-1 cursor-grab">
            <Equal className="w-4 h-4 opacity-70 group-hover:opacity-100" />
          </div>
        </div>
      </div>
    );
  }
);

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  isOpen,
  track,
  isPlaying,
  currentTime,
  queue,
  repeatMode,
  isShuffle,
  onClose,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onSelectTrackFromQueue,
  onOpenSongMenu,
}) => {
  // 1. ALL HOOK DECLARATIONS AT THE TOP (Unconditional)
  const [activeTab, setActiveTab] = useState<PlayerViewTab>('player');
  const [isVinylMode, setIsVinylMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [dynamicLyrics, setDynamicLyrics] = useState<Array<{ time: number; text: string }> | null>(null);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Dynamically fetch lyrics whenever track changes
  useEffect(() => {
    if (!track) return;
    let isMounted = true;

    // Verify if track already contains valid, non-placeholder lyrics
    const hasValidLyrics =
      track.lyrics &&
      track.lyrics.length > 0 &&
      !track.lyrics.some((l) => l.text.includes('Listening to') || l.text.includes('Official YouTube'));

    if (hasValidLyrics) {
      setDynamicLyrics(track.lyrics!);
    } else {
      setDynamicLyrics(null);
      getLyrics(track.id, track.title, track.artist, track.duration)
        .then((fetched) => {
          if (isMounted && fetched && fetched.length > 0) {
            setDynamicLyrics(fetched);
          }
        })
        .catch((err) => {
          console.warn('Dynamic lyrics fetch warning:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [track?.id, track?.title, track?.artist]);

  const effectiveLyrics =
    dynamicLyrics ||
    (track?.lyrics && !track.lyrics.some((l) => l.text.includes('Listening to')) ? track.lyrics : []);

  // Compute active lyric index safely
  const displayTime = isDragging ? dragTime : currentTime;
  const currentLyricIndex =
    effectiveLyrics.length > 0
      ? effectiveLyrics.reduce((acc, curr, idx) => {
          if (displayTime >= curr.time) return idx;
          return acc;
        }, 0)
      : -1;

  // Auto scroll lyrics smoothly to active line
  useEffect(() => {
    if (isOpen && activeTab === 'lyrics' && lyricsContainerRef.current && currentLyricIndex >= 0) {
      const activeEl = lyricsContainerRef.current.children[currentLyricIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen, activeTab, currentLyricIndex]);

  // Keyboard shortcut listener (Escape to dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (activeTab === 'queue') {
          setActiveTab('player');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, onClose]);

  const handleSaveQueue = () => {
    setIsSavedToLibrary(true);
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 2500);
  };

  // EARLY RETURN AFTER ALL HOOKS
  if (!isOpen || !track) {
    return null;
  }

  const duration = track.duration || 180;
  const remainingTime = Math.max(0, duration - displayTime);
  const progressPercent = Math.min(100, Math.max(0, (displayTime / duration) * 100));

  // Seekbar handlers
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setDragTime(newTime);
    setIsDragging(true);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
    onSeek(dragTime);
  };

  return (
    <div
      id="fullscreen-player-overlay"
      className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-between bg-[#050505] text-white animate-in slide-in-from-bottom duration-300 ease-out"
    >
      {/* Dynamic Ambient Glowing Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-[140px] opacity-40 transition-colors duration-1000"
          style={{ backgroundColor: track.accentColor || '#ff2d55' }}
        />
        <div
          className="absolute top-1/3 -right-24 w-[30rem] h-[30rem] rounded-full blur-[140px] opacity-30 transition-colors duration-1000"
          style={{ backgroundColor: track.secondaryColor || '#9254de' }}
        />
        <div
          className="absolute -bottom-24 left-1/4 w-[32rem] h-[32rem] rounded-full blur-[150px] opacity-35 transition-colors duration-1000"
          style={{ backgroundColor: track.accentColor || '#ff2d55' }}
        />
        <div className="absolute inset-0 bg-[#050505]/85 backdrop-blur-3xl" />
      </div>

      {/* Main Content Layout Stack */}
      <div className="relative flex-1 flex flex-col max-w-md w-full mx-auto px-6 pt-3 pb-5 justify-between overflow-hidden">
        {/* 1. TOP BAR: Chevron Down (dismiss), Context Info, 3-Dot Menu */}
        <div className="flex items-center justify-between py-1 shrink-0">
          <button
            id="player-collapse-btn"
            onClick={onClose}
            aria-label="Dismiss full-screen player"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white backdrop-blur-xl border border-white/10 transition-all duration-200"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* Current Song Title */}
          <div
            className="flex flex-col items-center text-center cursor-pointer max-w-[240px] px-2"
            onClick={() => onOpenSongMenu(track)}
          >
            <span className="text-sm font-bold text-zinc-100 truncate w-full tracking-tight">
              {track.title}
            </span>
          </div>

          <button
            id="player-menu-btn"
            onClick={() => onOpenSongMenu(track)}
            aria-label="More options"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-zinc-200 hover:text-white backdrop-blur-xl border border-white/10 transition-all duration-200"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* 2. CENTRAL VISUAL AREA (Artwork Canvas / Lyrics) */}
        <div className="flex-1 flex flex-col justify-center items-center py-2 min-h-0 relative">
          {/* TAB 1: Canvas / Artwork View */}
          {activeTab !== 'lyrics' ? (
            <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-300 my-auto">
              <div className="relative mx-auto w-full aspect-square max-w-[270px] max-h-[270px] flex items-center justify-center">
                {/* Dynamic Glow Halo behind Artwork */}
                <div
                  className="absolute inset-2 rounded-3xl blur-2xl opacity-60 transition-all duration-700 pointer-events-none"
                  style={{
                    backgroundColor: track.accentColor || '#ff2d55',
                    transform: isPlaying ? 'scale(1.08)' : 'scale(0.95)',
                  }}
                />

                {isVinylMode ? (
                  /* Vinyl Disc Mode */
                  <div
                    className={`relative w-full h-full rounded-full bg-black p-3 shadow-2xl border-4 border-zinc-800 flex items-center justify-center ${
                      isPlaying ? 'animate-spin-slow' : 'paused'
                    }`}
                    style={{
                      boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 40px ${track.accentColor || '#ff2d55'}40`,
                    }}
                  >
                    <div className="w-full h-full rounded-full border border-zinc-800/80 p-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-24 h-24 rounded-full object-cover shadow-inner border-2 border-white/20"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute w-5 h-5 rounded-full bg-[#050505] border-2 border-white/40 shadow-inner" />
                    </div>
                  </div>
                ) : (
                  /* Modern Rounded 3D Artwork */
                  <div
                    className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/15 transition-transform duration-500 ${
                      isPlaying ? 'scale-100 shadow-2xl' : 'scale-95 opacity-90'
                    }`}
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                  </div>
                )}

                {/* Toggle Vinyl / Sleeve View Pill */}
                <button
                  id="toggle-vinyl-btn"
                  onClick={() => setIsVinylMode(!isVinylMode)}
                  className="absolute -bottom-2.5 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-zinc-200 hover:text-white flex items-center gap-1 shadow-lg active:scale-95 transition-transform"
                >
                  <Disc className="w-3 h-3 text-[#ff2d55]" />
                  <span>{isVinylMode ? 'Cover' : 'Vinyl'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: Live Synced Auto-Scrolling Lyrics View */
            <div className="w-full flex-1 flex flex-col justify-between py-1 min-h-[260px] max-h-[320px] animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-[#ff2d55]">
                  <Mic2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">
                    Live Synced Lyrics
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Tap line to jump
                </span>
              </div>

              {/* Time-Synced Scrolling Lyrics Container */}
              <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-3 py-4 text-center rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-white/10 shadow-2xl"
              >
                {effectiveLyrics.length > 0 ? (
                  effectiveLyrics.map((line, idx) => {
                    const isActive = idx === currentLyricIndex;
                    const isPast = idx < currentLyricIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => onSeek(line.time)}
                        className={`cursor-pointer transition-all duration-300 py-2 px-3 rounded-2xl ${
                          isActive
                            ? 'text-white text-base font-black scale-105 bg-[#ff2d55]/30 border border-[#ff2d55]/50 shadow-xl'
                            : isPast
                            ? 'text-zinc-500 text-xs font-medium hover:text-zinc-400'
                            : 'text-zinc-300 text-xs font-medium hover:text-white'
                        }`}
                      >
                        {line.text}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-zinc-400 text-xs flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#ff2d55] animate-spin" />
                    <span className="text-zinc-200 font-medium text-sm">Loading synchronized lyrics...</span>
                    {track && (
                      <span className="text-[11px] text-zinc-500 max-w-[240px] truncate">
                        {track.title} • {track.artist}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. LOWER CONTROLS STACK (Directly anchored with structured spacing) */}
        <div className="space-y-3.5 pt-1 shrink-0">
          {/* Track Metadata Row (Title, Artist, Dolby Badge & Interactive Heart) */}
          <div className="flex items-center justify-between gap-3 px-0.5">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="relative overflow-hidden whitespace-nowrap">
                <h2
                  className={`text-lg font-black text-white tracking-tight ${
                    track.title.length > 25 ? 'animate-marquee inline-block' : 'truncate'
                  }`}
                >
                  {track.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[#ff2d55] text-xs font-semibold truncate">
                  {track.artist}
                </p>
                <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                <span
                  id="fullscreen-dolby-badge"
                  className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 tracking-wider uppercase shrink-0"
                >
                  Dolby Audio
                </span>
              </div>
            </div>

            {/* Interactive Animated Heart (Like) Button */}
            <button
              id="player-like-btn"
              onClick={() => onToggleLike(track.id)}
              aria-label="Toggle favorite"
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 active:scale-90 ${
                track.isLiked
                  ? 'bg-[#ff2d55]/20 border-[#ff2d55]/40 text-[#ff2d55] shadow-lg shadow-[#ff2d55]/20'
                  : 'bg-white/10 border-white/15 text-zinc-300 hover:text-white hover:bg-white/15'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-300 ${
                  track.isLiked ? 'fill-[#ff2d55] scale-110' : 'scale-100'
                }`}
              />
            </button>
          </div>

          {/* 4. Timeline Progress Seekbar */}
          <div className="space-y-1">
            <div className="relative group flex items-center cursor-pointer">
              <input
                id="player-timeline-slider"
                type="range"
                min={0}
                max={duration}
                step={0.5}
                value={displayTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                aria-label="Seek track position"
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ff2d55] group-hover:h-1.5 transition-all duration-200"
                style={{
                  background: `linear-gradient(to right, #ff2d55 0%, #ff2d55 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 px-0.5">
              <span>{audioEngine.formatTime(displayTime)}</span>
              <span>-{audioEngine.formatTime(remainingTime)}</span>
            </div>
          </div>

          {/* 5. Playback Transport Controls */}
          <div className="flex items-center justify-between px-1">
            {/* Shuffle */}
            <button
              id="player-shuffle-btn"
              onClick={onToggleShuffle}
              aria-label="Shuffle"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isShuffle
                  ? 'text-[#ff2d55] bg-[#ff2d55]/20 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
              id="player-prev-btn"
              onClick={onPrevTrack}
              aria-label="Previous track"
              className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            {/* Central Play/Pause Button */}
            <button
              id="player-play-pause-btn"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="relative w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
              style={{
                boxShadow: `0 0 30px ${track.accentColor || '#ff2d55'}80`,
              }}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            {/* Next */}
            <button
              id="player-next-btn"
              onClick={onNextTrack}
              aria-label="Next track"
              className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            {/* Repeat */}
            <button
              id="player-repeat-btn"
              onClick={onToggleRepeat}
              aria-label="Repeat"
              className={`w-10 h-10 rounded-full flex items-center justify-center relative transition-all ${
                repeatMode !== 'off'
                  ? 'text-[#ff2d55] bg-[#ff2d55]/20 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Repeat className="w-5 h-5" />
              {repeatMode === 'one' && (
                <span className="absolute text-[9px] font-extrabold -top-0.5 right-1 text-[#ff2d55]">
                  1
                </span>
              )}
            </button>
          </div>

          {/* 6. BOTTOM CAPSULE BAR: [Canvas | Lyrics | Up Next] */}
          <div className="flex items-center justify-center pt-0.5">
            <div className="inline-flex p-1 rounded-full backdrop-blur-2xl bg-black/50 border border-white/10 px-2 py-1 text-xs shadow-xl gap-1">
              <button
                id="tab-btn-player"
                onClick={() => setActiveTab('player')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'player'
                    ? 'bg-white text-black shadow-md scale-100'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Canvas</span>
              </button>

              <button
                id="tab-btn-lyrics"
                onClick={() => setActiveTab('lyrics')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'lyrics'
                    ? 'bg-white text-black shadow-md scale-100'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5" />
                <span>Lyrics</span>
              </button>

              <button
                id="tab-btn-queue"
                onClick={() => setActiveTab(activeTab === 'queue' ? 'player' : 'queue')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'queue'
                    ? 'bg-white text-black shadow-md scale-100'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Up Next</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. SLIDE-UP "UP NEXT" QUEUE FROSTED OVERLAY PANEL */}
      <div
        id="queue-overlay-panel"
        className={`fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto transition-transform duration-300 ease-out flex flex-col ${
          activeTab === 'queue' ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{ height: '78vh' }}
      >
        <div className="flex-1 w-full bg-[#0c0c12]/95 backdrop-blur-2xl border-t border-white/15 rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden text-white">
          {/* Drag Handle to Collapse Queue */}
          <div
            onClick={() => setActiveTab('player')}
            className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-pointer group"
          >
            <div className="w-12 h-1.5 rounded-full bg-white/25 group-hover:bg-white/40 transition-colors" />
          </div>

          {/* Subheader: Queue context + Save Button */}
          <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/10">
            <div className="min-w-0 flex-1 pr-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff2d55]">
                UP NEXT QUEUE
              </span>
              <p className="text-sm font-bold text-white truncate">
                {track.title}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="queue-save-btn"
                onClick={handleSaveQueue}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isSavedToLibrary
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15 active:scale-95'
                }`}
              >
                {isSavedToLibrary ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5 text-[#ff2d55]" />
                    <span>+ Save</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveTab('player')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white"
                aria-label="Close queue"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Queue Count & Shuffle Sub-bar */}
          <div className="px-5 py-2 flex items-center justify-between text-xs text-zinc-400 bg-white/[0.02]">
            <span className="font-semibold text-zinc-300">
              Up Next • {queue.length} Tracks
            </span>
            <button
              onClick={onToggleShuffle}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                isShuffle
                  ? 'bg-[#ff2d55]/20 text-[#ff2d55] border-[#ff2d55]/40'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              <Shuffle className="w-3 h-3" />
              <span>{isShuffle ? 'Shuffled' : 'Shuffle'}</span>
            </button>
          </div>

          {/* Scrollable Tracklist */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-1.5">
            {queue.map((t, idx) => (
              <QueueItemRow
                key={`${t.id}-${idx}`}
                item={t}
                isCurrent={track?.id === t.id || Boolean(track?.videoId && t.videoId && track.videoId === t.videoId)}
                isPlaying={isPlaying}
                onSelect={onSelectTrackFromQueue}
              />
            ))}
          </div>

          {/* Toast Notification when Saved */}
          {showSaveToast && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/90 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom duration-200">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Queue saved to your Library!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
