import React, { useState, useEffect } from 'react';
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
  Sparkles,
  FolderPlus,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { handleImageError } from '../data/imageFallback';

interface SongMenuModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleLike: (trackId: string) => void;
  onTogglePin?: (trackId: string, track?: Track) => void;
  isPinned?: boolean;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlistId: string, track: Track) => void;
  onCreatePlaylist?: (title: string, description: string, initialTrack?: Track) => void;
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
  playlists = [],
  onAddToPlaylist,
  onCreatePlaylist,
}) => {
  const [view, setView] = useState<'main' | 'playlists'>('main');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Reset view state when modal opens or active track changes
  useEffect(() => {
    if (isOpen) {
      setView('main');
      setIsCreatingNew(false);
      setNewTitle('');
      setNewDesc('');
      setFeedback(null);
      setJustAddedId(null);
    }
  }, [isOpen, track?.id]);

  if (!isOpen || !track) return null;

  const thumbnail =
    track.coverUrl ||
    track.thumbnail ||
    track.thumbnailUrl ||
    track.artwork ||
    track.imageUrl ||
    (track.videoId ? `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg` : '');

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
            src={thumbnail}
            alt={track.title}
            className="w-14 h-14 rounded-2xl object-cover shadow-md"
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e, 'track', track.title)}
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

        {/* View 1: Main Actions Menu */}
        {view === 'main' && (
          <>
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

              {/* Task 2: Fully functional Add to Playlist Option */}
              <button
                id="menu-add-to-playlist-btn"
                onClick={() => setView('playlists')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 active:bg-white/15 text-left text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <FolderPlus className="w-5 h-5 text-[#ff2d55]" />
                  <span className="text-sm font-semibold">Add to Playlist</span>
                </div>
                {playlists && playlists.length > 0 && (
                  <span className="text-xs text-zinc-500 font-medium">
                    {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                  </span>
                )}
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
          </>
        )}

        {/* View 2: Add to Playlist Selection */}
        {view === 'playlists' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Header with Back and Close navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setView('main');
                  setIsCreatingNew(false);
                  setFeedback(null);
                }}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                aria-label="Back to song menu"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-center min-w-0 px-2 flex-1">
                <h4 className="font-extrabold text-sm text-white truncate">
                  Add to Playlist
                </h4>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  Choose a playlist for &ldquo;{track.title}&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Feedback Toast Alert */}
            {feedback && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs font-semibold animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{feedback}</span>
              </div>
            )}

            {/* Create New Playlist option / form */}
            {!isCreatingNew ? (
              <button
                type="button"
                id="btn-create-new-playlist-in-menu"
                onClick={() => setIsCreatingNew(true)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#ff2d55]/10 hover:bg-[#ff2d55]/20 border border-[#ff2d55]/30 text-white transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#ff2d55] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <span className="text-sm font-bold block text-white">Create New Playlist</span>
                  <span className="text-[11px] text-zinc-400 block">Add this song to a new collection</span>
                </div>
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = newTitle.trim();
                  if (!trimmed) return;
                  onCreatePlaylist?.(trimmed, newDesc.trim() || 'Custom playlist created on AbirTune', track);
                  setFeedback(`Created & added to "${trimmed}"`);
                  setIsCreatingNew(false);
                  setNewTitle('');
                  setNewDesc('');
                  setTimeout(() => {
                    onClose();
                  }, 1200);
                }}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    New Playlist
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Playlist title..."
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff2d55]"
                />
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff2d55]"
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full py-2 rounded-xl bg-[#ff2d55] text-white text-xs font-bold shadow-md hover:bg-[#ff2d55]/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  Create &amp; Add Track
                </button>
              </form>
            )}

            {/* List of Existing Playlists */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar pt-1">
              {playlists && playlists.length > 0 ? (
                playlists.map((pl) => {
                  const isAlreadyIn = pl.tracks?.some((t) => t.id === track.id) || justAddedId === pl.id;

                  return (
                    <button
                      key={pl.id}
                      type="button"
                      id={`select-playlist-${pl.id}`}
                      onClick={() => {
                        if (isAlreadyIn) {
                          setFeedback(`Already in "${pl.title}"`);
                          return;
                        }
                        onAddToPlaylist?.(pl.id, track);
                        setJustAddedId(pl.id);
                        setFeedback(`Added to "${pl.title}"`);
                        setTimeout(() => {
                          onClose();
                        }, 1200);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all text-left ${
                        isAlreadyIn
                          ? 'bg-white/5 border border-emerald-500/20'
                          : 'hover:bg-white/10 active:bg-white/15 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={pl.coverUrl}
                          alt={pl.title}
                          className="w-11 h-11 rounded-xl object-cover shadow-sm shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1 pr-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {pl.title}
                          </h4>
                          <p className="text-xs text-zinc-400 truncate">
                            {pl.tracks?.length || 0} tracks
                          </p>
                        </div>
                      </div>

                      {isAlreadyIn ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Added</span>
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#ff2d55] text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0">
                          <Plus className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                !isCreatingNew && (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    No custom playlists created yet. Tap &ldquo;Create New Playlist&rdquo; above to start!
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
