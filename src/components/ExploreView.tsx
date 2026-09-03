import React, { useState, useMemo, memo } from 'react';
import { Search, Sparkles, Flame, X, Disc, Play, Music2, Globe2 } from 'lucide-react';
import { Track, CuratedMix, Album } from '../types';
import { GENRES_AND_MOODS, ALBUMS } from '../data/mockMusic';
import { TrackCard } from './TrackCard';
import { handleImageError } from '../data/imageFallback';

interface ExploreViewProps {
  tracks: Track[];
  mixes: CuratedMix[];
  albums?: Album[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPlayMix: (mix: CuratedMix) => void;
  onSelectAlbum?: (album: Album) => void;
  onToggleLike: (trackId: string, e: React.MouseEvent) => void;
  onOpenMenu: (track: Track, e: React.MouseEvent) => void;
}

const REGIONAL_FILTERS = [
  'All',
  'Bengali',
  'Tamil',
  'Telugu',
  'Hindi',
  'South',
  'Punjabi',
  'Bhojpuri',
];

const ExploreViewComponent: React.FC<ExploreViewProps> = ({
  tracks,
  mixes,
  albums = ALBUMS,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayMix,
  onSelectAlbum,
  onToggleLike,
  onOpenMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  // Filtered albums based on language, search query, or selected genre
  const filteredAlbums = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const lang = selectedLanguage.toLowerCase();
    const genre = selectedGenre ? selectedGenre.toLowerCase() : null;

    return albums.filter((album) => {
      const title = album.title.toLowerCase();
      const artist = album.artist.toLowerCase();
      const albLang = (album.language || '').toLowerCase();
      const albGenre = (album.genre || '').toLowerCase();

      // Language filter
      let matchesLang = true;
      if (selectedLanguage !== 'All') {
        if (selectedLanguage === 'South') {
          matchesLang =
            albLang.includes('south') ||
            albLang.includes('tamil') ||
            albLang.includes('telugu') ||
            title.includes('kgf') ||
            title.includes('pushpa') ||
            title.includes('rrr') ||
            title.includes('leo') ||
            title.includes('jailer') ||
            title.includes('devara');
        } else {
          matchesLang = albLang.includes(lang) || albGenre.includes(lang);
        }
      }

      // Genre filter
      let matchesGenre = true;
      if (genre) {
        matchesGenre = albGenre.includes(genre) || albLang.includes(genre) || title.includes(genre);
      }

      // Query filter
      let matchesQuery = true;
      if (q) {
        matchesQuery =
          title.includes(q) ||
          artist.includes(q) ||
          albLang.includes(q) ||
          albGenre.includes(q);
      }

      return matchesLang && matchesGenre && matchesQuery;
    });
  }, [albums, searchQuery, selectedLanguage, selectedGenre]);

  // Filtered tracks based on search, language, or genre selection
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const lang = selectedLanguage.toLowerCase();

    // Collect all tracks including those from regional albums
    const allAvailableTracks: Track[] = [...tracks];
    const seenTrackIds = new Set(tracks.map((t) => t.id));

    albums.forEach((alb) => {
      (alb.tracks || []).forEach((t) => {
        if (!seenTrackIds.has(t.id)) {
          seenTrackIds.add(t.id);
          allAvailableTracks.push(t);
        }
      });
    });

    return allAvailableTracks.filter((t) => {
      const title = t.title.toLowerCase();
      const artist = t.artist.toLowerCase();
      const albumName = (t.album || '').toLowerCase();
      const trackGenre = (t.genre || '').toLowerCase();

      const matchesQuery =
        !q ||
        title.includes(q) ||
        artist.includes(q) ||
        albumName.includes(q) ||
        trackGenre.includes(q);

      let matchesGenre = true;
      if (selectedGenre) {
        matchesGenre =
          trackGenre.includes(selectedGenre.toLowerCase()) ||
          albumName.includes(selectedGenre.toLowerCase());
      }

      let matchesLang = true;
      if (selectedLanguage !== 'All') {
        if (selectedLanguage === 'South') {
          matchesLang =
            trackGenre.includes('tamil') ||
            trackGenre.includes('telugu') ||
            trackGenre.includes('south');
        } else {
          matchesLang =
            trackGenre.includes(lang) ||
            albumName.includes(lang) ||
            artist.includes(lang);
        }
      }

      return matchesQuery && matchesGenre && matchesLang;
    });
  }, [tracks, albums, searchQuery, selectedGenre, selectedLanguage]);

  return (
    <div id="explore-view" className="space-y-6 pb-40 pt-2 px-3">
      {/* Header & Search Bar */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-[#ff2d55] font-bold tracking-tighter text-xs uppercase flex items-center gap-1.5">
            <span>Discover Regional & National Hits</span>
            <Sparkles className="w-3.5 h-3.5 text-[#ff2d55]" />
          </h2>
          <h1 className="text-4xl font-black tracking-tight leading-none text-white">
            Explore.
          </h1>
          <p className="text-xs text-white/50 pt-1">
            Browse albums, cinema soundtracks, and regional melodies
          </p>
        </div>

        {/* Search Input Field */}
        <div className="relative pt-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            id="explore-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Bengali, Tamil, Telugu, Hindi songs & albums..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-sm text-white placeholder-zinc-400 border border-white/10 focus:outline-none focus:border-[#ff2d55]/80 transition-all shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Regional Language Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
          {REGIONAL_FILTERS.map((lang) => (
            <button
              key={lang}
              id={`explore-lang-${lang.toLowerCase()}`}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedLanguage === lang
                  ? 'bg-[#ff2d55] text-white shadow-md shadow-[#ff2d55]/30'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {lang === 'All' ? <Globe2 className="w-3 h-3" /> : null}
              <span>{lang}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Regional & Blockbuster Albums Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <Disc className="w-4 h-4 text-[#ff2d55]" />
              <span>
                {selectedLanguage === 'All'
                  ? 'Featured Albums'
                  : `${selectedLanguage} Albums`}
              </span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {filteredAlbums.length}
            </span>
          </div>

          {(selectedLanguage !== 'All' || selectedGenre) && (
            <button
              onClick={() => {
                setSelectedLanguage('All');
                setSelectedGenre(null);
              }}
              className="text-xs text-[#ff2d55] hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredAlbums.length > 0 ? (
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1">
            {filteredAlbums.map((album) => (
              <div
                key={album.id}
                id={`explore-album-${album.id}`}
                onClick={() => onSelectAlbum?.(album)}
                className="group flex-shrink-0 w-36 cursor-pointer p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#ff2d55]/40 transition-all shadow-md"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-black/40 shadow-inner">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, 'album', album.title)}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#ff2d55] flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-0.5">
                    <Music2 className="w-2.5 h-2.5 text-[#ff2d55]" />
                    <span>{album.trackCount}</span>
                  </div>
                  {album.language && (
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#ff2d55]/90 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-wider">
                      {album.language}
                    </div>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-[#ff2d55] transition-colors truncate">
                  {album.title}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {album.artist}
                </p>
                <p className="text-[9px] text-zinc-500 mt-0.5">
                  {album.year} • {album.genre || 'Soundtrack'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500 text-xs bg-white/5 rounded-2xl p-4">
            No albums matching this filter. Try selecting &quot;All&quot; or another language.
          </div>
        )}
      </section>

      {/* Moods & Regional Genres Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Browse Categories & Moods</span>
            <Sparkles className="w-4 h-4 text-rose-400" />
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GENRES_AND_MOODS.map((genre) => (
            <div
              key={genre.id}
              id={`genre-tile-${genre.id}`}
              onClick={() => {
                const keyword = genre.name.split(' ')[0];
                setSelectedGenre(selectedGenre === keyword ? null : keyword);
              }}
              className={`group relative h-28 rounded-2xl p-4 flex flex-col justify-between overflow-hidden cursor-pointer border shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${
                selectedGenre === genre.name.split(' ')[0]
                  ? 'border-white ring-2 ring-rose-500 scale-[1.02]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}
              />
              <div className="absolute inset-0 bg-black/20" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Flame className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] text-white/80 font-medium">
                  {genre.trackCount}
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-white font-extrabold text-sm tracking-tight leading-snug group-hover:translate-x-0.5 transition-transform">
                  {genre.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matching Songs or Regional Playlist Spotlight */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff2d55]">
              {selectedLanguage !== 'All' ? `${selectedLanguage.toUpperCase()} SONGS` : 'POPULAR SONGS'}
            </span>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : selectedGenre
                ? `${selectedGenre} Melodies`
                : selectedLanguage !== 'All'
                ? `Top ${selectedLanguage} Hits`
                : 'Top Trending Tracks'}
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-semibold">
            {searchResults.length} tracks
          </span>
        </div>

        <div className="space-y-2">
          {searchResults.length > 0 ? (
            searchResults.slice(0, 15).map((track, idx) => (
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
          ) : (
            <div className="py-12 text-center text-zinc-500 text-sm glass-panel rounded-2xl p-6">
              No tracks found matching your selection. Try exploring other categories!
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export const ExploreView = memo(ExploreViewComponent);
ExploreView.displayName = 'ExploreView';
