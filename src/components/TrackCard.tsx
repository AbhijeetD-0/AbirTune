import React, { memo } from 'react';
import { Play, Pause, Heart, MoreVertical } from 'lucide-react';
import { Track } from '../types';
import { handleImageError } from '../data/imageFallback';

interface TrackCardProps {
  track: Track;
  variant?: 'horizontal' | 'quick-pick' | 'list-row';
  isPlaying?: boolean;
  isCurrentTrack?: boolean;
  index?: number;
  onPlay: (track: Track) => void;
  onToggleLike?: (trackId: string, e: React.MouseEvent) => void;
  onOpenMenu?: (track: Track, e: React.MouseEvent) => void;
}

const TrackCardComponent: React.FC<TrackCardProps> = ({
  track,
  variant = 'quick-pick',
  isPlaying = false,
  isCurrentTrack = false,
  index,
  onPlay,
  onToggleLike,
  onOpenMenu,
}) => {
  const isThisPlaying = isCurrentTrack && isPlaying;

  if (variant === 'horizontal') {
    return (
      <div
        id={`track-card-hero-${track.id}`}
        onClick={() => onPlay(track)}
        className="group relative flex-shrink-0 w-72 h-44 rounded-3xl overflow-hidden cursor-pointer p-4 flex flex-col justify-between border border-white/10 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${track.accentColor}99 0%, ${track.secondaryColor}66 60%, #050505 100%)`,
        }}
      >
        <img
          src={track.coverUrl}
          alt={track.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50 group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={(e) => handleImageError(e, 'track', track.title)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top tag */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
            {track.genre.split('/')[0]}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.(track.id, e);
            }}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-[#ff2d55] transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${track.isLiked ? 'fill-[#ff2d55] text-[#ff2d55]' : ''}`}
            />
          </button>
        </div>

        {/* Bottom details & play button */}
        <div className="relative z-10 flex items-end justify-between">
          <div className="pr-3">
            <h4 className="text-white font-bold text-base leading-snug line-clamp-1 group-hover:text-[#ff2d55] transition-colors">
              {track.title}
            </h4>
            <p className="text-zinc-300 text-xs line-clamp-1 mt-0.5">
              {track.artist}
            </p>
          </div>

          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${
              isThisPlaying
                ? 'bg-[#ff2d55] text-white scale-105'
                : 'bg-white text-black group-hover:scale-110'
            }`}
          >
            {isThisPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'quick-pick') {
    return (
      <div
        id={`track-quick-pick-${track.id}`}
        onClick={() => onPlay(track)}
        className={`group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
          isCurrentTrack
            ? 'bg-white/10 border-white/20 shadow-lg'
            : 'bg-white/5 hover:bg-white/10 active:bg-white/15 border-white/5'
        }`}
      >
        {/* Cover with overlay play */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          <img
            src={track.coverUrl}
            alt={track.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e, 'track', track.title)}
          />
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
              isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isThisPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 bg-white rounded-full wave-bar-1" />
                <span className="w-1 bg-white rounded-full wave-bar-2" />
                <span className="w-1 bg-white rounded-full wave-bar-3" />
              </div>
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4
              className={`text-sm font-semibold truncate ${
                isCurrentTrack ? 'text-[#ff2d55] font-bold' : 'text-zinc-100'
              }`}
            >
              {track.title}
            </h4>
          </div>
          <p className="text-xs text-white/50 truncate mt-0.5">{track.artist}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/40 font-medium">
              {track.plays} plays
            </span>
            <span className="text-white/20 text-[10px]">•</span>
            <span className="text-[10px] text-white/50">{track.genre.split('/')[0]}</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.(track.id, e);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-[#ff2d55] transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${track.isLiked ? 'fill-[#ff2d55] text-[#ff2d55]' : ''}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu?.(track, e);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Variant === 'list-row' (Used in Library, Queue, and Search results)
  return (
    <div
      id={`track-list-row-${track.id}`}
      onClick={() => onPlay(track)}
      className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isCurrentTrack
          ? 'bg-white/10 border-white/20'
          : 'bg-transparent hover:bg-white/[0.06] active:bg-white/[0.1] border-transparent'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {typeof index === 'number' && (
          <span
            className={`w-5 text-center text-xs font-semibold ${
              isCurrentTrack ? 'text-[#ff2d55]' : 'text-white/40'
            }`}
          >
            {isThisPlaying ? (
              <span className="inline-flex items-end gap-0.5 h-3 justify-center">
                <span className="w-0.5 bg-[#ff2d55] rounded-full wave-bar-1" />
                <span className="w-0.5 bg-[#ff2d55] rounded-full wave-bar-2" />
                <span className="w-0.5 bg-[#ff2d55] rounded-full wave-bar-3" />
              </span>
            ) : (
              index + 1
            )}
          </span>
        )}

        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={track.coverUrl}
            alt={track.title}
            loading="lazy"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e, 'track', track.title)}
          />
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
              isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isThisPlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <h4
            className={`text-sm font-semibold truncate ${
              isCurrentTrack ? 'text-[#ff2d55] font-bold' : 'text-zinc-100'
            }`}
          >
            {track.title}
          </h4>
          <p className="text-xs text-white/40 truncate mt-0.5">
            {track.artist} <span className="text-white/20">•</span> {track.album}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike?.(track.id, e);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-[#ff2d55] transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${track.isLiked ? 'fill-[#ff2d55] text-[#ff2d55]' : ''}`}
          />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu?.(track, e);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const TrackCard = memo(TrackCardComponent);
TrackCard.displayName = 'TrackCard';
