import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Play,
  TrendingUp,
  Disc,
  Music2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Artist, Album } from '../types';
import { handleImageError } from '../data/imageFallback';

interface ExpandedBrowseViewProps {
  initialType: 'artists' | 'albums';
  artists: Artist[];
  albums: Album[];
  onClose: () => void;
  onSelectArtist: (artist: Artist) => void;
  onSelectAlbum: (album: Album) => void;
}

const ARTIST_LANGUAGES = ['All', 'Singers', 'Actors', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'South', 'Punjabi', 'Bhojpuri', 'English'];
const ALBUM_CATEGORIES = ['All', 'Bollywood', 'Bengali', 'Tamil', 'Telugu', 'South', 'Special 50s', 'Bhojpuri', 'Punjabi', 'Classics'];

export const ExpandedBrowseView: React.FC<ExpandedBrowseViewProps> = ({
  initialType,
  artists,
  albums,
  onClose,
  onSelectArtist,
  onSelectAlbum,
}) => {
  const [viewType, setViewType] = useState<'artists' | 'albums'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // Reset filter when switching tabs
  const handleSwitchTab = (type: 'artists' | 'albums') => {
    setViewType(type);
    setSelectedLanguage('All');
  };

  // Filtered Artists with Singer / Actor / Language discrimination
  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return artists.filter((artist) => {
      const matchesQuery =
        !q ||
        artist.name.toLowerCase().includes(q) ||
        artist.genre.toLowerCase().includes(q) ||
        (artist.role && artist.role.toLowerCase().includes(q)) ||
        (artist.language && artist.language.toLowerCase().includes(q));

      let matchesLang = true;
      if (selectedLanguage === 'All') {
        matchesLang = true;
      } else if (selectedLanguage === 'Singers') {
        matchesLang = !artist.isActor;
      } else if (selectedLanguage === 'Actors') {
        matchesLang = !!artist.isActor;
      } else if (selectedLanguage === 'South') {
        matchesLang =
          (artist.language && artist.language.toLowerCase().includes('south')) ||
          (artist.genre && (artist.genre.toLowerCase().includes('tamil') || artist.genre.toLowerCase().includes('telugu')));
      } else {
        matchesLang =
          (!!artist.language && artist.language.toLowerCase().includes(selectedLanguage.toLowerCase())) ||
          (!!artist.genre && artist.genre.toLowerCase().includes(selectedLanguage.toLowerCase()));
      }

      return matchesQuery && matchesLang;
    });
  }, [artists, searchQuery, selectedLanguage]);

  // Filtered Albums with special collections and genre tabs
  const filteredAlbums = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return albums.filter((album) => {
      const matchesQuery =
        !q ||
        album.title.toLowerCase().includes(q) ||
        album.artist.toLowerCase().includes(q) ||
        album.year.toString().includes(q) ||
        (album.genre && album.genre.toLowerCase().includes(q));

      let matchesCat = true;
      if (selectedLanguage === 'All') {
        matchesCat = true;
      } else if (selectedLanguage === 'Special 50s') {
        matchesCat = (album.trackCount || 0) >= 40 || album.title.includes('50');
      } else if (selectedLanguage === 'Bengali') {
        matchesCat =
          (album.language && album.language.toLowerCase().includes('bengali')) ||
          (album.genre && album.genre.toLowerCase().includes('bengali'));
      } else if (selectedLanguage === 'Tamil') {
        matchesCat =
          (album.language && album.language.toLowerCase().includes('tamil')) ||
          (album.genre && album.genre.toLowerCase().includes('tamil'));
      } else if (selectedLanguage === 'Telugu') {
        matchesCat =
          (album.language && album.language.toLowerCase().includes('telugu')) ||
          (album.genre && album.genre.toLowerCase().includes('telugu'));
      } else if (selectedLanguage === 'South') {
        matchesCat =
          (album.language && (album.language.toLowerCase().includes('south') || album.language.toLowerCase().includes('tamil') || album.language.toLowerCase().includes('telugu'))) ||
          album.title.toLowerCase().includes('kgf') ||
          album.title.toLowerCase().includes('pushpa') ||
          album.title.toLowerCase().includes('rrr') ||
          album.title.toLowerCase().includes('leo') ||
          album.title.toLowerCase().includes('jailer') ||
          album.title.toLowerCase().includes('devara');
      } else if (selectedLanguage === 'Bollywood') {
        matchesCat =
          (album.language && album.language.toLowerCase().includes('hindi')) ||
          (album.genre && album.genre.toLowerCase().includes('bollywood'));
      } else if (selectedLanguage === 'Classics') {
        matchesCat = album.year < 2000 || (album.genre && album.genre.toLowerCase().includes('classic'));
      } else {
        matchesCat =
          !!album.language &&
          album.language.toLowerCase().includes(selectedLanguage.toLowerCase());
      }

      return matchesQuery && matchesCat;
    });
  }, [albums, searchQuery, selectedLanguage]);

  return (
    <div
      id="expanded-browse-view"
      className="fixed inset-0 z-50 bg-[#070709] text-white flex flex-col overflow-hidden animate-fadeIn"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-[#0e0e14]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="expanded-browse-back-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                {viewType === 'artists' ? (
                  <>
                    <span>Top Artists</span>
                    <TrendingUp className="w-4 h-4 text-[#9254de]" />
                  </>
                ) : (
                  <>
                    <span>Featured Albums</span>
                    <Disc className="w-4 h-4 text-[#ff2d55]" />
                  </>
                )}
              </h1>
              <p className="text-[11px] text-zinc-400">
                {viewType === 'artists'
                  ? `${filteredArtists.length} creators across Hindi, English, Bhojpuri, Punjabi & more`
                  : `${filteredAlbums.length} movie soundtracks, OSTs & artist albums`}
              </p>
            </div>
          </div>

          {/* Quick View Switcher Pill */}
          <div className="flex items-center p-0.5 rounded-full bg-white/5 border border-white/10">
            <button
              onClick={() => handleSwitchTab('artists')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                viewType === 'artists'
                  ? 'bg-[#9254de] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Artists
            </button>
            <button
              onClick={() => handleSwitchTab('albums')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                viewType === 'albums'
                  ? 'bg-[#ff2d55] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Albums
            </button>
          </div>
        </div>

        {/* Search Bar inside Dedicated View */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              viewType === 'artists'
                ? 'Search artists (e.g. Pawan Singh, Arijit, The Weeknd)...'
                : 'Search albums (e.g. KGF 2, Animal, Aashiqui 2, Bhojpuriya Raja)...'
            }
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-[#ff2d55]/60 focus:bg-white/10 focus:outline-none text-xs text-white placeholder:text-zinc-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Language / Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-1">
          {(viewType === 'artists' ? ARTIST_LANGUAGES : ALBUM_CATEGORIES).map((cat) => {
            const isActive = selectedLanguage === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedLanguage(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {cat === 'All' ? 'All Languages' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-36">
        {viewType === 'artists' ? (
          /* --- Artists Grid --- */
          filteredArtists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredArtists.map((artist) => (
                <div
                  key={artist.id}
                  id={`browse-artist-${artist.id}`}
                  onClick={() => onSelectArtist(artist)}
                  className="group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all duration-300 flex flex-col items-center text-center cursor-pointer shadow-lg"
                >
                  {/* Avatar with Gradient Ring */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-[#ff2d55] via-[#9254de] to-[#3B82F6] shadow-xl group-hover:scale-105 transition-transform duration-300 mb-3">
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      loading="lazy"
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, 'artist', artist.name)}
                    />
                    <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#ff2d55] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate w-full">
                    {artist.name}
                  </h3>

                  <div className="flex items-center gap-1 mt-1">
                    {artist.isActor ? (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#ff2d55]/20 text-[#ff708d] border border-[#ff2d55]/30">
                        Actor
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#9254de]/20 text-[#c49bfb] border border-[#9254de]/30">
                        Singer
                      </span>
                    )}
                    {artist.language && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                        {artist.language}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 w-full">
                    {artist.genre}
                  </p>

                  <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                    {artist.monthlyListeners}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArtist(artist);
                    }}
                    className="w-full mt-2.5 py-1.5 px-3 rounded-xl bg-white/5 group-hover:bg-[#ff2d55] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10 group-hover:border-transparent"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Explore Hits</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">No artists found</p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                No artists matched &quot;{searchQuery}&quot; in {selectedLanguage}. Try selecting &quot;All Languages&quot; or searching another name.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLanguage('All');
                }}
                className="px-4 py-2 rounded-xl bg-[#9254de] text-white text-xs font-bold shadow-lg"
              >
                Reset Filters
              </button>
            </div>
          )
        ) : (
          /* --- Albums Grid --- */
          filteredAlbums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  id={`browse-album-${album.id}`}
                  onClick={() => onSelectAlbum(album)}
                  className="group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all duration-300 flex flex-col cursor-pointer shadow-lg"
                >
                  {/* Album Cover Art */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-lg mb-2.5">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, 'album', album.title)}
                    />

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#ff2d55] flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                      </div>
                    </div>

                    {/* Track count badge */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-zinc-200 flex items-center gap-1">
                      <Music2 className="w-3 h-3 text-[#ff2d55]" />
                      <span>{album.trackCount}</span>
                    </div>

                    {album.language && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#ff2d55]/80 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-wider">
                        {album.language}
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate">
                    {album.title}
                  </h3>

                  <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                    {album.artist}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 pt-1.5 border-t border-white/5">
                    <span>{album.year}</span>
                    <span className="truncate max-w-[100px] text-right text-zinc-400">
                      {album.genre?.split('/')[0]?.trim() || 'Soundtrack'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                <Disc className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">No albums found</p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                No albums matched &quot;{searchQuery}&quot;. You can also search for this album in the main Search tab to load all of its songs!
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLanguage('All');
                }}
                className="px-4 py-2 rounded-xl bg-[#ff2d55] text-white text-xs font-bold shadow-lg"
              >
                Reset Filters
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};
