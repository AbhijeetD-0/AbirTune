export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  artwork?: string;
  imageUrl?: string;
  accentColor: string; // hex color for ambient glow
  secondaryColor: string;
  genre: string;
  releaseYear: number;
  isLiked?: boolean;
  isPinned?: boolean;
  plays: string;
  lyrics?: Array<{ time: number; text: string }>;
  bpm?: number;
  moodCategory?: 'Podcasts' | 'Sad' | 'Romance' | 'Relax' | 'Feel good' | string;
  type?: 'song' | 'podcast';
  audioUrl?: string;
  videoId?: string;
  streamSource?: 'youtube' | 'piped' | 'synth' | 'custom';
}

export interface CuratedMix {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  gradient: string;
  trackIds: string[];
  curator: string;
  tag: string;
  isPinned?: boolean;
  moodCategory?: string;
  tracks?: Track[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  trackCount: number;
  accentColor: string;
  language?: string;
  genre?: string;
  tracks?: Track[];
}

export interface Artist {
  id: string;
  name: string;
  monthlyListeners?: string;
  followers?: string;
  avatarUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
  genre: string;
  topTrackIds?: string[];
  language?: string;
  isActor?: boolean;
  role?: string;
  type?: string;
  bio?: string;
  tracks?: Track[];
  topTracks?: Track[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  isCustom?: boolean;
  createdAt?: string;
  gradient?: string;
}

export type TabType = 'home' | 'search' | 'explore' | 'library';

export type RepeatMode = 'off' | 'all' | 'one';

export type PlayerViewTab = 'player' | 'lyrics' | 'queue';

