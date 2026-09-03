import React, { useState, useEffect } from 'react';
import {
  Play,
  Shuffle,
  ArrowLeft,
  Heart,
  Music2,
  Radio,
  Loader2,
  Sparkles,
  CheckCircle2,
  Film,
  Mic2,
} from 'lucide-react';
import { Artist, Track } from '../types';
import { handleImageError } from '../data/imageFallback';
import { TrackCard } from './TrackCard';
import { searchTracks, isStandardSingleTrack } from '../services/api';

interface ArtistDetailModalProps {
  artist: Artist | null;
  isOpen: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track, queue?: Track[], fromQueue?: boolean, isRadioMode?: boolean) => void;
  onShufflePlay: (tracks: Track[]) => void;
  onToggleLike: (trackId: string, e: React.MouseEvent) => void;
  onOpenMenu: (track: Track, e: React.MouseEvent) => void;
}

export const ArtistDetailModal: React.FC<ArtistDetailModalProps> = ({
  artist,
  isOpen,
  currentTrack,
  isPlaying,
  onClose,
  onPlayTrack,
  onShufflePlay,
  onToggleLike,
  onOpenMenu,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!artist) {
      setTracks([]);
      return;
    }

    // 1. Immediately seed with artist's pre-curated signature tracks if available
    const initialTracks = artist.tracks && artist.tracks.length > 0 ? [...artist.tracks] : [];
    setTracks(initialTracks);

    // 2. Dynamically fetch additional tracks from YouTube for a comprehensive discography
    let isCancelled = false;
    setIsLoadingMore(true);

    const query = artist.isActor
      ? `${artist.name} best hit songs`
      : `${artist.name} top songs`;

    searchTracks(query, 'IN')
      .then((fetched) => {
        if (isCancelled) return;
        const valid = fetched.filter((track) => isStandardSingleTrack(track, true));

        setTracks((prev) => {
          const existingIds = new Set<string>();
          prev.forEach((t) => {
            if (t.id) existingIds.add(t.id);
            if (t.videoId) existingIds.add(t.videoId);
            existingIds.add(t.title.toLowerCase().trim());
          });

          const fresh = valid.filter(
            (t) =>
              !existingIds.has(t.id) &&
              (!t.videoId || !existingIds.has(t.videoId)) &&
              !existingIds.has(t.title.toLowerCase().trim())
          );

          return [...prev, ...fresh];
        });
      })
      .catch((err) => {
        console.warn('Error fetching dynamic artist tracks:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingMore(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [artist]);

  if (!isOpen || !artist) return null;

  return (
    <div
      id="artist-detail-view"
      className="fixed inset-0 z-40 bg-[#050505] overflow-y-auto no-scrollbar pb-40 text-white animate-fadeIn"
    >
      {/* Top Banner Header with Artist Imagery */}
      <div className="relative pt-4 px-4 pb-6 overflow-hidden">
        {/* Ambient Gradient Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff2d55]/25 via-[#9254de]/20 to-[#050505] opacity-90" />

        {/* Back navigation button */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <button
            id="artist-modal-back-btn"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            {artist.isActor ? (
              <Film className="w-3.5 h-3.5 text-[#ff2d55]" />
            ) : (
              <Mic2 className="w-3.5 h-3.5 text-[#9254de]" />
            )}
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
              {artist.isActor ? 'Actor Profile' : 'Artist Profile'}
            </span>
          </div>
          <div className="w-10" />
        </div>

        {/* Artist Portrait & Metadata */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
          {/* Circular Portrait with Glow Ring */}
          <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-[#ff2d55] via-[#9254de] to-[#3B82F6] shadow-2xl mb-3">
            <img
              src={artist.avatarUrl}
              alt={artist.name}
              className="w-full h-full rounded-full object-cover shadow-inner"
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, 'artist', artist.name)}
            />
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#3B82F6] border-2 border-black flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {artist.name}
            </h2>
          </div>

          <p className="text-xs text-rose-300/90 font-semibold mt-0.5">
            {artist.role || (artist.isActor ? 'Bollywood Star' : 'Playback Artist')}
          </p>

          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 max-w-xs">
            {artist.genre}
          </p>

          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-300 font-medium">
            <span>{artist.monthlyListeners}</span>
            {artist.language && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold">
                  {artist.language}
                </span>
              </>
            )}
          </div>

          {/* Endless Radio Tag */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#ff2d55] bg-[#ff2d55]/10 px-3 py-1 rounded-full border border-[#ff2d55]/20 mt-3 font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Select any track for non-stop streaming</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-5 w-full">
            <button
              onClick={() => tracks.length > 0 && onPlayTrack(tracks[0], tracks, false, true)}
              disabled={tracks.length === 0}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#ff2d55] hover:bg-[#ff2d55]/90 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ff2d55]/30 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play All</span>
            </button>

            <button
              onClick={() => onShufflePlay(tracks)}
              disabled={tracks.length === 0}
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5 text-[#ff2d55]" />
            <span>Popular Songs ({tracks.length})</span>
          </h3>
          {isLoadingMore && (
            <div className="flex items-center gap-1 text-[11px] text-[#ff2d55]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
        </div>

        {tracks.length === 0 && isLoadingMore ? (
          <div className="py-14 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-7 h-7 text-[#ff2d55] animate-spin" />
            <p className="text-xs font-medium">Fetching tracks for {artist.name}...</p>
          </div>
        ) : (
          tracks.map((track, idx) => (
            <TrackCard
              key={`${track.id}-${idx}`}
              track={track}
              variant="list-row"
              index={idx}
              isCurrentTrack={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              onPlay={(t) => onPlayTrack(t, tracks, false, true)}
              onToggleLike={onToggleLike}
              onOpenMenu={onOpenMenu}
            />
          ))
        )}
      </div>
    </div>
  );
};
