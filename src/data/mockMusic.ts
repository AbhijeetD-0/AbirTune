import { CuratedMix, Album, Artist } from '../types';
import { MASTER_ALBUMS } from './albumCatalog';
import { ALL_ARTISTS } from './artistsData';
import { DEVOTIONAL_ALBUMS, DEVOTIONAL_ARTISTS } from './devotionalData';

/**
 * Clean State Architecture:
 * Curated mixes, accurate rich albums catalog, and comprehensive artist & actor profiles.
 * Preserves all existing player states, queue logic, and local storage.
 */
export const CURATED_MIXES: CuratedMix[] = [
  {
    id: 'mix-bhakti-divine',
    title: 'Divine Bhaktigeeti & Aartis',
    subtitle: 'Durga, Kali, Ganesha, Shiva & Krishna Sacred Chants, Stotras & Bhajans',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/31/35/67/31356783-71bc-7848-eb6e-e9392237894a/8902894353076_cover.jpg/600x600bb.jpg',
    gradient: 'from-amber-600 via-orange-800 to-slate-950',
    trackIds: [],
    curator: 'AbirTune Bhakti',
    tag: 'BHAKTI DIVINE',
    isPinned: true,
    moodCategory: 'Bhakti',
  },
  {
    id: 'mix-latest-bollywood',
    title: 'Latest Bollywood Hits',
    subtitle: 'Trending Chartbusters • Arijit Singh, Pritam & Bollywood Hits',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    gradient: 'from-amber-600 via-rose-700 to-slate-950',
    trackIds: [],
    curator: 'AbirTune India',
    tag: 'TRENDING',
    isPinned: true,
    moodCategory: 'Feel Good',
  },
  {
    id: 'mix-trending-hindi',
    title: 'Trending Hindi Charts',
    subtitle: 'India Top 50 • Vibrant mix of trending, romantic & upbeat hits',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    gradient: 'from-[#ff2d55] via-purple-800 to-slate-950',
    trackIds: [],
    curator: 'AbirTune Editorial',
    tag: 'TOP CHARTS',
    isPinned: true,
    moodCategory: 'All',
  },
  {
    id: 'mix-romantic-melodies',
    title: 'Romantic Hindi Melodies',
    subtitle: 'Soulful Love Ballads, Duets & Acoustic Gems',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    gradient: 'from-rose-800 via-indigo-900 to-slate-950',
    trackIds: [],
    curator: 'AbirTune Romance',
    tag: 'ROMANCE',
    isPinned: false,
    moodCategory: 'Romance',
  },
  {
    id: 'mix-heartbreak-sad',
    title: 'Heartbreak & Sad Melodies',
    subtitle: 'Channa Mereya, Agar Tum Saath Ho & soulful ballads',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    gradient: 'from-purple-900 via-slate-900 to-black',
    trackIds: [],
    curator: 'AbirTune Soul',
    tag: 'SAD VIBES',
    isPinned: false,
    moodCategory: 'Sad',
  },
  {
    id: 'mix-relax-chill',
    title: 'Relax & Acoustic Lo-Fi',
    subtitle: 'Calm acoustic guitars, Lo-Fi beats & relaxing Hindi vibes',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    gradient: 'from-teal-900 via-emerald-950 to-black',
    trackIds: [],
    curator: 'AbirTune Chill',
    tag: 'RELAX',
    isPinned: false,
    moodCategory: 'Relax',
  },
  {
    id: 'mix-feelgood-party',
    title: 'Feel Good & Party Melodies',
    subtitle: 'High energy Indian bangers & upbeat tunes',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    gradient: 'from-amber-700 via-orange-800 to-slate-950',
    trackIds: [],
    curator: 'AbirTune Hits',
    tag: 'FEEL GOOD',
    isPinned: false,
    moodCategory: 'Feel Good',
  },
  {
    id: 'mix-bengali-masterpieces',
    title: 'Bengali Masterpieces & Melodies',
    subtitle: 'Anupam Roy, Hemanta Mukherjee, Arijit Singh Bangla & Classics',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/bf/20/0e/bf200ea8-48b2-5f60-beba-3a67d0f9831d/8902894353083_cover.jpg/600x600bb.jpg',
    gradient: 'from-purple-800 via-indigo-900 to-slate-950',
    trackIds: [],
    curator: 'AbirTune Bangla',
    tag: 'BENGALI',
    isPinned: true,
    moodCategory: 'All',
  },
  {
    id: 'mix-south-sensations',
    title: 'South Cinema Sensations',
    subtitle: 'Tamil & Telugu Powerhouses • Anirudh, Thaman S, Devi Sri Prasad & Sid Sriram',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/f5/a8/f5/f5a8f522-83b6-1250-9359-5f251ef0b402/8903431952400_cover.jpg/600x600bb.jpg',
    gradient: 'from-orange-700 via-rose-900 to-slate-950',
    trackIds: [],
    curator: 'AbirTune South',
    tag: 'SOUTH HITS',
    isPinned: true,
    moodCategory: 'All',
  },
];

// All artists and Bollywood actors with rich high-res portraits, roles, and signature tracks
export const TOP_ARTISTS: Artist[] = [...ALL_ARTISTS, ...DEVOTIONAL_ARTISTS];

// Master accurate album catalog with tracklists and high-fidelity artwork
export const ALBUMS: Album[] = [...MASTER_ALBUMS, ...DEVOTIONAL_ALBUMS];

export const GENRES_AND_MOODS = [
  { id: 'genre-bhakti', name: 'Bhakti & Devotional', gradient: 'from-amber-600 to-orange-700', icon: 'Sparkles', trackCount: 'Bhaktigeeti & Aartis' },
  { id: 'genre-romance', name: 'Romance & Love', gradient: 'from-rose-600 to-red-700', icon: 'Heart', trackCount: 'Top Indian Hits' },
  { id: 'genre-sad', name: 'Sad & Melancholy', gradient: 'from-blue-600 to-indigo-800', icon: 'CloudRain', trackCount: 'Soulful Ballads' },
  { id: 'genre-feelgood', name: 'Feel Good & Hits', gradient: 'from-amber-500 to-rose-600', icon: 'Sparkles', trackCount: 'Trending Hits' },
  { id: 'genre-relax', name: 'Relax & Acoustic', gradient: 'from-teal-500 to-emerald-700', icon: 'Coffee', trackCount: 'Unplugged' },
  { id: 'genre-bengali', name: 'Bengali Melodies', gradient: 'from-purple-600 to-indigo-700', icon: 'Music2', trackCount: 'Bangla Hits' },
  { id: 'genre-tamil', name: 'Tamil & Kollywood', gradient: 'from-emerald-600 to-teal-800', icon: 'Flame', trackCount: 'Kollywood Hits' },
  { id: 'genre-telugu', name: 'Telugu & Tollywood', gradient: 'from-orange-600 to-amber-700', icon: 'Sparkles', trackCount: 'Tollywood Hits' },
  { id: 'genre-bollywood', name: 'Bollywood Hits', gradient: 'from-fuchsia-600 to-purple-800', icon: 'Radio', trackCount: 'Top 50 India' },
  { id: 'genre-punjabi', name: 'Punjabi Beats', gradient: 'from-red-600 to-yellow-600', icon: 'Flame', trackCount: 'Bhangra & Pop' },
  { id: 'genre-bhojpuri', name: 'Bhojpuri Dhamaka', gradient: 'from-yellow-600 to-lime-600', icon: 'Zap', trackCount: 'Desi Bangers' },
];
