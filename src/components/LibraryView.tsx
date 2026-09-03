import React, { useState, memo } from 'react';
import { Plus, Heart, FolderPlus, Shuffle, Play, Sparkles } from 'lucide-react';
import { Track, Playlist, Artist, Album } from '../types';
import { TrackCard } from './TrackCard';

interface LibraryViewProps {
  playlists: Playlist[];
  likedTracks: Track[];
  artists: Artist[];
  albums: Album[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onShufflePlay: (tracks: Track[]) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: (title: string, description: string) => void;
  onToggleLike: (trackId: string, e: React.MouseEvent) => void;
  onOpenMenu: (track: Track, e: React.MouseEvent) => void;
  onSelectArtist?: (artist: Artist) => void;
  onSelectAlbum?: (album: Album) => void;
}

type LibraryTab = 'playlists' | 'liked' | 'artists' | 'albums';

const LibraryViewComponent: React.FC<LibraryViewProps> = ({
  playlists,
  likedTracks,
  artists,
  albums,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onShufflePlay,
  onSelectPlaylist,
  onCreatePlaylist,
  onToggleLike,
  onOpenMenu,
  onSelectArtist,
  onSelectAlbum,
}) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newDesc.trim() || 'Custom playlist created on AbirTune');
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  return (
    <div id="library-view" className="space-y-6 pb-40 pt-2 px-3">
      {/* Header & Create Button */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-[#ff2d55] font-bold tracking-tighter text-xs uppercase flex items-center gap-1.5">
            <span>Your Collection</span>
            <Sparkles className="w-3.5 h-3.5 text-[#ff2d55]" />
          </h2>
          <h1 className="text-4xl font-black tracking-tight leading-none text-white">
            Library.
          </h1>
          <p className="text-xs text-white/50 pt-1">
            Your personal collection, mixes & downloads
          </p>
        </div>

        <button
          id="create-playlist-btn"
          onClick={() => setShowCreateModal(true)}
          className="w-11 h-11 rounded-full bg-[#ff2d55] hover:bg-[#ff2d55]/90 active:scale-90 text-white flex items-center justify-center shadow-lg shadow-[#ff2d55]/30 transition-all duration-200"
          aria-label="Create playlist"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Segmented Filter Switcher */}
      <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
        {[
          { id: 'playlists', label: 'Playlists' },
          { id: 'liked', label: `Liked (${likedTracks.length})` },
          { id: 'artists', label: 'Artists' },
          { id: 'albums', label: 'Albums' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`library-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as LibraryTab)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          {/* Quick Liked Songs Banner */}
          <div
            onClick={() => onShufflePlay(likedTracks)}
            className="group relative rounded-3xl p-5 overflow-hidden cursor-pointer bg-gradient-to-r from-[#ff2d55] via-purple-600 to-[#9254de] shadow-xl border border-white/20 transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <Heart className="w-7 h-7 text-white fill-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white leading-tight">
                    Liked Songs
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5">
                    {likedTracks.length} tracks favorited
                  </p>
                </div>
              </div>

              <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Shuffle className="w-5 h-5 text-[#ff2d55]" />
              </div>
            </div>
          </div>

          {/* User & Curated Playlists List */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">
              All Playlists
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playlists.map((pl, idx) => (
                <div
                  key={`${pl.id}-${idx}`}
                  id={`playlist-item-${pl.id}`}
                  onClick={() => onSelectPlaylist(pl)}
                  className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 cursor-pointer transition-all duration-200"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                    <img
                      src={pl.coverUrl}
                      alt={pl.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff2d55] transition-colors">
                      {pl.title}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                      {pl.description}
                    </p>
                    <span className="text-[11px] text-zinc-500 font-medium mt-1 inline-block">
                      {pl.tracks.length} songs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Liked Songs List */}
      {activeTab === 'liked' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">
              Favorites
            </h2>
            <button
              onClick={() => onShufflePlay(likedTracks)}
              className="px-3 py-1.5 rounded-full bg-[#ff2d55] text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-[#ff2d55]/20"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle Play</span>
            </button>
          </div>

          {likedTracks.length > 0 ? (
            <div className="space-y-2">
              {likedTracks.map((track, idx) => (
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
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-zinc-500 text-sm bg-white/5 border border-white/5 rounded-3xl p-6">
              You haven&apos;t liked any tracks yet. Tap the heart icon on any song to save it here!
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Artists */}
      {activeTab === 'artists' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {artists.map((artist, idx) => (
              <div
                key={`${artist.id}-${idx}`}
                id={`library-artist-${artist.id}`}
                onClick={() => onSelectArtist?.(artist)}
                className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 flex flex-col items-center text-center cursor-pointer transition-all"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg mb-2.5 p-0.5 bg-gradient-to-tr from-[#ff2d55] to-[#9254de]">
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    loading="lazy"
                    className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="text-sm font-bold text-white truncate w-full group-hover:text-[#ff2d55]">
                  {artist.name}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {artist.role || artist.monthlyListeners}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Albums */}
      {activeTab === 'albums' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {albums.map((album, idx) => (
              <div
                key={`${album.id}-${idx}`}
                id={`library-album-${album.id}`}
                onClick={() => onSelectAlbum?.(album)}
                className="group p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 cursor-pointer transition-all"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-md mb-2">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff2d55]">
                  {album.title}
                </h4>
                <p className="text-xs text-zinc-400 truncate">
                  {album.artist} • {album.trackCount} tracks
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#050505] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ff2d55]/20 text-[#ff2d55] flex items-center justify-center">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">New Playlist</h3>
                <p className="text-xs text-zinc-400">Give your mix a creative title</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                  Playlist Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Midnight Chill, Gym Beast"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff2d55]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                  Description (Optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What makes this playlist special?"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff2d55]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#ff2d55] hover:bg-[#ff2d55]/90 text-white shadow-lg shadow-[#ff2d55]/30"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const LibraryView = memo(LibraryViewComponent);
LibraryView.displayName = 'LibraryView';

const trackDummy = {
  id: 'dummy',
  title: 'Sample Track',
  artist: 'AbirTune',
  album: 'Live',
  duration: 180,
  coverUrl: '',
  accentColor: '#8B5CF6',
  secondaryColor: '#EC4899',
  genre: 'Music',
  releaseYear: 2025,
  plays: '1M'
};
