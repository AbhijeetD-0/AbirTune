import React, { useState } from 'react';
import { Search, X, Music, Sparkles, TrendingUp } from 'lucide-react';
import { Track } from '../types';
import { TrackCard } from './TrackCard';

interface SearchModalProps {
  isOpen: boolean;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onToggleLike: (trackId: string, e: React.MouseEvent) => void;
  onOpenMenu: (track: Track, e: React.MouseEvent) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  tracks,
  currentTrack,
  isPlaying,
  onClose,
  onPlayTrack,
  onToggleLike,
  onOpenMenu,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = tracks.filter((t) => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
    );
  });

  const popularSearches = ['Arijit Singh', 'Bollywood Hits', 'Pritam', 'Romantic Bengali', 'Shreya Ghoshal'];

  return (
    <div
      id="search-modal-overlay"
      className="fixed inset-0 z-60 bg-[#050505]/95 backdrop-blur-2xl flex flex-col p-4 animate-fadeIn text-white"
    >
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col space-y-4">
        {/* Search Header */}
        <div className="flex items-center gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracks, artists, genres..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/10 text-white placeholder-zinc-400 border border-white/15 focus:outline-none focus:border-[#ff2d55] text-sm shadow-xl"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-xs font-semibold text-zinc-400 hover:text-white px-2 py-1"
          >
            Cancel
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        {!query && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff2d55] uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-[#ff2d55]" />
              <span>Trending Searches</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-xs font-medium text-zinc-300 border border-white/5 transition-all"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="pt-4 space-y-2">
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider block">
                Top Picks For You
              </span>
              {tracks.slice(0, 4).map((track, idx) => (
                <TrackCard
                  key={`${track.id}-${idx}`}
                  track={track}
                  variant="list-row"
                  index={idx}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onPlay={(t) => {
                    onPlayTrack(t);
                    onClose();
                  }}
                  onToggleLike={onToggleLike}
                  onOpenMenu={onOpenMenu}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search Results List */}
        {query && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            <span className="text-xs font-bold text-[#ff2d55] uppercase tracking-wider block mb-2">
              {results.length} results for &quot;{query}&quot;
            </span>

            {results.length > 0 ? (
              results.map((track, idx) => (
                <TrackCard
                  key={`${track.id}-${idx}`}
                  track={track}
                  variant="list-row"
                  index={idx}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onPlay={(t) => {
                    onPlayTrack(t);
                    onClose();
                  }}
                  onToggleLike={onToggleLike}
                  onOpenMenu={onOpenMenu}
                />
              ))
            ) : (
              <div className="py-16 text-center text-zinc-500 text-sm bg-white/5 border border-white/5 rounded-2xl p-6">
                No songs found matching &quot;{query}&quot;. Try another artist or genre!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
