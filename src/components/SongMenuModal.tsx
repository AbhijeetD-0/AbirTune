import React, { useState } from 'react';
import {
  ListPlus,
  Play,
  Heart,
  Pin,
  Share2,
  Moon,
  Info,
  Radio,
  X,
  Check,
  Sparkles
} from 'lucide-react';
import { Track } from '../types';

interface SongMenuModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleLike: (trackId: string) => void;
  onTogglePin?: (trackId: string, track?: Track) => void;
  isPinned?: boolean;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
}

export const SongMenuModal: React.FC<SongMenuModalProps> = ({
  track,
  isOpen,
  onClose,
  onToggleLike,
  onTogglePin,
  isPinned = false,
  onAddToQueue,
  onPlayNext,
}) => {
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  if (!isOpen || !track) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText?.(`Listen to ${track.title} by ${track.artist} on AbirTune!`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetTimer = (minutes: number) => {
    setSleepTimer(minutes);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      id="song-menu-overlay"
      className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#050505] rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Track Header */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-white/10">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-14 h-14 rounded-2xl object-cover shadow-md"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-base text-white truncate">
              {track.title}
            </h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {track.artist} • {track.album}
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-[#ff2d55]">
              Lossless ALAC 24-bit/192kHz
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="space-y-1">
          <button
            onClick={() => {
              onToggleLike(track.id);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/10 active:bg-white/15 text-left text-zinc-200 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${track.isLiked ? 'fill-[#ff2d55] text-[#ff2d55]' : 'text-zinc-400'}`}
            />
            <span className="text-sm font-semibold">
              {track.isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
            </span>
          </button>

          <button
            onClick={() => {
              onPlayNext(track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/10 active:bg-white/15 text-left text-zinc-200 transition-colors"
          >
            <Play className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-semibold">Play Next</span>
          </button>

          <button
            onClick={() => {
              onAddToQueue(track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/10 active:bg-white/15 text-left text-zinc-200 transition-colors"
          >
            <ListPlus className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-semibold">Add to Up Next Queue</span>
          </button>

          <button
            onClick={() => {
              onTogglePin?.(track.id, track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/10 active:bg-white/15 text-left text-zinc-200 transition-colors"
          >
            <Pin
              className={`w-5 h-5 ${isPinned ? 'fill-[#ff2d55] text-[#ff2d55]' : 'text-zinc-400'}`}
            />
            <span className="text-sm font-semibold">
              {isPinned ? 'Unpin from Speed Dial' : 'Pin to Home'}
            </span>
          </button>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 active:bg-white/15 text-left text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Share2 className="w-5 h-5 text-zinc-400" />
              <span className="text-sm font-semibold">Share Track Link</span>
            </div>
            {copied && <span className="text-xs text-emerald-400 font-bold">Copied!</span>}
          </button>
        </div>

        {/* Sleep Timer Quick Select */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-[#9254de]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Sleep Timer
              </span>
            </div>
            {sleepTimer && (
              <span className="text-[11px] text-[#9254de] font-semibold">
                Set for {sleepTimer}m
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSetTimer(mins)}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  sleepTimer === mins
                    ? 'bg-[#9254de] text-white border-[#9254de]'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Lossless Audio Specs */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2 text-zinc-200 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#ff2d55]" />
            <span>Audio Master Quality</span>
          </div>
          <p className="text-[11px]">
            Mastered for AbirTune in Apple Lossless Audio Codec (ALAC) up to 24-bit/192 kHz with Ultra-wide Dynamic Range.
          </p>
        </div>
      </div>
    </div>
  );
};
