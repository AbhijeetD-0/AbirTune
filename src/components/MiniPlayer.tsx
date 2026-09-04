import React, { memo } from 'react';
import { Play, Pause, SkipForward, Heart, ChevronUp } from 'lucide-react';
import { Track } from '../types';
import { handleImageError } from '../data/imageFallback';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: (e: React.MouseEvent) => void;
  onNextTrack: (e: React.MouseEvent) => void;
  onToggleLike: (trackId: string, e: React.MouseEvent) => void;
  onExpandPlayer: () => void;
}

const MiniPlayerComponent: React.FC<MiniPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  onTogglePlay,
  onNextTrack,
  onToggleLike,
  onExpandPlayer,
}) => {
  if (!track) return null;

  const progressPercent = Math.min(100, Math.max(0, (currentTime / (track.duration || 1)) * 100));

  const thumbnail =
    track.coverUrl ||
    track.thumbnail ||
    track.thumbnailUrl ||
    track.artwork ||
    track.imageUrl ||
    (track.videoId ? `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg` : '');

  return (
    <div
      id="mini-player-container"
      className="fixed bottom-[88px] left-0 right-0 z-30 px-3 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div
          id="mini-player"
          onClick={onExpandPlayer}
          role="button"
          tabIndex={0}
          aria-label={`Open now playing: ${track.title} by ${track.artist}`}
          className="relative overflow-hidden rounded-2xl bg-white/10 border border-white/10 shadow-2xl backdrop-blur-2xl cursor-pointer group transition-all duration-300 hover:border-white/20 active:scale-[0.99]"
          style={{
            boxShadow: `0 10px 30px -10px ${track.accentColor || '#ff2d55'}50`,
          }}
        >
          {/* Top Edge Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#ff2d55] to-[#9254de] transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Ambient Glow Accent on right side */}
          <div
            className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ backgroundColor: track.accentColor || '#ff2d55' }}
          />

          <div className="flex items-center justify-between p-2.5 pl-3">
            {/* Left: Thumbnail and Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-white/10">
                <img
                  src={thumbnail}
                  alt={track.title}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isPlaying ? 'scale-105' : ''
                  }`}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, 'track', track.title)}
                />
                {/* Playing animated wave indicator */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-3.5">
                      <span className="w-0.5 bg-white rounded-full wave-bar-1" />
                      <span className="w-0.5 bg-white rounded-full wave-bar-2" />
                      <span className="w-0.5 bg-white rounded-full wave-bar-3" />
                      <span className="w-0.5 bg-white rounded-full wave-bar-4" />
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <p className="text-sm font-bold text-white truncate group-hover:text-[#ff2d55] transition-colors">
                    {track.title}
                  </p>
                  <span
                    id="mini-dolby-badge"
                    className="shrink-0 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider rounded bg-white/10 text-white/90 border border-white/20"
                  >
                    Dolby Audio
                  </span>
                </div>
                <p className="text-xs text-white/50 truncate mt-0.5">
                  {track.artist}
                </p>
              </div>
            </div>

            {/* Right: Instant Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                id="mini-like-btn"
                onClick={(e) => onToggleLike(track.id, e)}
                aria-label="Like track"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-[#ff2d55] active:scale-90 transition-all"
              >
                <Heart
                  className={`w-4 h-4 ${track.isLiked ? 'fill-[#ff2d55] text-[#ff2d55]' : ''}`}
                />
              </button>

              <button
                id="mini-play-pause-btn"
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                id="mini-next-btn"
                onClick={onNextTrack}
                aria-label="Next track"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={onExpandPlayer}
                aria-label="Expand player"
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors md:flex hidden"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MiniPlayer = memo(MiniPlayerComponent);
MiniPlayer.displayName = 'MiniPlayer';
