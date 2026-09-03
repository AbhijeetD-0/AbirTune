import React from 'react';
import { Play, Shuffle, ArrowLeft, Heart, Music, Sparkles, Clock, MoreVertical, Radio, Loader2 } from 'lucide-react';
import { Playlist, Track } from '../types';
import { handleImageError } from '../data/imageFallback';
import { TrackCard } from './TrackCard';

interface PlaylistDetailModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onShufflePlay: (tracks: Track[]) => void;
  onToggleLike: (trackId: string, e: React.MouseEvent) => void;
  onOpenMenu: (track: Track, e: React.MouseEvent) => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  isOpen,
  currentTrack,
  isPlaying,
  onClose,
  onPlayTrack,
  onShufflePlay,
  onToggleLike,
  onOpenMenu,
}) => {
  if (!isOpen || !playlist) return null;

  const totalDurationSeconds = playlist.tracks.reduce((sum, t) => sum + (t.duration || 180), 0);
  const totalMinutes = Math.round(totalDurationSeconds / 60);
  const isMix = playlist.id.startsWith('mix-') || playlist.createdAt?.toLowerCase().includes('mix');

  return (
    <div
      id="playlist-detail-view"
      className="fixed inset-0 z-40 bg-[#050505] overflow-y-auto no-scrollbar pb-40 text-white animate-fadeIn"
    >
      {/* Top Banner Header */}
      <div className="relative pt-4 px-4 pb-6 overflow-hidden">
        {/* Ambient Gradient Backdrop */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${playlist.gradient || 'from-[#ff2d55]/30 via-purple-950/20'} to-[#050505] opacity-90`}
        />

        {/* Back navigation button */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-[#ff2d55]">
            {playlist.createdAt || (isMix ? 'CURATED MIX' : 'PLAYLIST')}
          </span>
          <div className="w-10" />
        </div>

        {/* Cover & Info */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-xs mx-auto">
          <div className="relative w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-4">
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, 'album', playlist.title)}
            />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
            {playlist.title}
          </h2>
          <p className="text-xs text-zinc-300 mt-1 line-clamp-2">
            {playlist.description}
          </p>

          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 font-medium">
            <span>{playlist.tracks.length} songs</span>
            <span>•</span>
            <span>approx {totalMinutes} mins</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#ff2d55] bg-[#ff2d55]/10 px-3 py-1 rounded-full border border-[#ff2d55]/20 mt-2.5 font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Select any song for endless radio</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-5 w-full">
            <button
              onClick={() => playlist.tracks.length > 0 && onPlayTrack(playlist.tracks[0])}
              disabled={playlist.tracks.length === 0}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#ff2d55] hover:bg-[#ff2d55]/90 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ff2d55]/30 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play All</span>
            </button>

            <button
              onClick={() => onShufflePlay(playlist.tracks)}
              disabled={playlist.tracks.length === 0}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10 transition-all disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4 text-[#ff2d55]" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="px-4 space-y-2 max-w-md mx-auto">
        <div className="flex items-center justify-between px-1 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
            Tracklist
          </h3>
          <span className="text-[11px] text-zinc-500">Tap to start endless radio</span>
        </div>

        {playlist.tracks.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-7 h-7 text-[#ff2d55] animate-spin" />
            <p className="text-xs font-medium">Loading tracks from YouTube Music...</p>
          </div>
        ) : (
          playlist.tracks.map((track, idx) => (
            <TrackCard
              key={`${track.id}-${idx}`}
              track={track}
              variant="list-row"
              index={idx}
              isCurrentTrack={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              onPlay={onPlayTrack}
              onToggleLike={onToggleLike}
              onOpenMenu={onOpenMenu}
            />
          ))
        )}
      </div>
    </div>
  );
};

