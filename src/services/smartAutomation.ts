import { Track } from '../types';
import { searchTracks, getTrendingMusic } from './api';

export interface PlayEvent {
  trackId: string;
  trackTitle: string;
  artist: string;
  genre: string;
  timestamp: number;
  listenDuration: number;
  totalDuration: number;
}

export interface UserPreferences {
  history: PlayEvent[];
  searchQueries: string[];
  artistWeights: Record<string, number>;
  genreWeights: Record<string, number>;
}

class SmartRecommendationEngine {
  private readonly STORAGE_KEY = 'ytm_smart_preferences';
  private preferences: UserPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  private loadPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading smart preferences:', e);
    }
    return {
      history: [],
      searchQueries: [],
      artistWeights: {},
      genreWeights: {}
    };
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (e) {
      console.error('Error saving smart preferences:', e);
    }
  }

  /**
   * Records a user listening to a track to build their affinity profile.
   * Call this from the audio engine when a track finishes or changes.
   */
  public recordPlayEvent(track: Track, listenDuration: number): void {
    if (!track) return;
    
    // Determine completion ratio (0 to 1)
    const ratio = track.duration > 0 ? Math.min(listenDuration / track.duration, 1) : 1;
    
    this.preferences.history.push({
      trackId: track.id,
      trackTitle: track.title,
      artist: track.artist,
      genre: track.genre || 'Unknown',
      timestamp: Date.now(),
      listenDuration,
      totalDuration: track.duration
    });

    // Keep history capped at 1000 items to ensure lag-free performance
    if (this.preferences.history.length > 1000) {
      this.preferences.history.shift();
    }

    // Weight artists and genres based on completion ratio
    const weight = ratio > 0.8 ? 2 : (ratio > 0.3 ? 1 : 0.5);
    
    if (track.artist) {
      this.preferences.artistWeights[track.artist] = 
        (this.preferences.artistWeights[track.artist] || 0) + weight;
    }
    
    if (track.genre) {
      this.preferences.genreWeights[track.genre] = 
        (this.preferences.genreWeights[track.genre] || 0) + weight;
    }

    this.savePreferences();
  }

  /**
   * Records a user search query.
   */
  public recordSearch(query: string): void {
    if (!query || !query.trim()) return;
    const q = query.trim().toLowerCase();
    
    this.preferences.searchQueries = [
      q,
      ...this.preferences.searchQueries.filter(item => item !== q)
    ].slice(0, 50); // Keep last 50
    
    this.savePreferences();
  }

  /**
   * Scores a track based on the user's historical profile
   */
  private scoreTrack(track: Track): number {
    let score = 0;
    
    if (track.artist && this.preferences.artistWeights[track.artist]) {
      score += this.preferences.artistWeights[track.artist] * 10;
    }
    
    if (track.genre && this.preferences.genreWeights[track.genre]) {
      score += this.preferences.genreWeights[track.genre] * 5;
    }

    // Recency bias: Boost if they played this track recently
    const pastPlays = this.preferences.history.filter(h => h.trackId === track.id);
    if (pastPlays.length > 0) {
      const latestPlay = Math.max(...pastPlays.map(p => p.timestamp));
      const hoursSincePlay = (Date.now() - latestPlay) / (1000 * 60 * 60);
      if (hoursSincePlay < 24) score += 15;
      else if (hoursSincePlay < 72) score += 8;
      
      // But penalize slightly if played *too* many times (fatigue)
      if (pastPlays.length > 10) score -= (pastPlays.length - 10) * 2;
    }

    return score;
  }

  /**
   * Merges and sorts tracks by applying the smart recommendation algorithm.
   */
  private applyAlgorithm(tracks: Track[]): Track[] {
    const deduplicated = new Map<string, Track>();
    for (const t of tracks) {
      // Ensure high-res coverUrl fallback logic can be applied if needed by other systems
      if (!deduplicated.has(t.id)) deduplicated.set(t.id, t);
    }
    
    return Array.from(deduplicated.values()).sort((a, b) => {
      const scoreA = this.scoreTrack(a);
      const scoreB = this.scoreTrack(b);
      // Sort primarily by smart score, secondarily keep original order (which implies trending popularity)
      return scoreB - scoreA;
    });
  }

  /**
   * Curates the main Home page recommendations.
   * Blends trending regional data with personalized algorithmic sorting.
   */
  public async getHomeRecommendations(region: string = 'IN', forceRefresh: boolean = false): Promise<Track[]> {
    try {
      const baseTrending = await getTrendingMusic(region, forceRefresh);
      return this.applyAlgorithm(baseTrending);
    } catch (e) {
      console.error("Smart Automation: Failed to fetch home recommendations", e);
      return [];
    }
  }

  /**
   * Generates 'Quick Picks' (a localized YouTube Music feature) based heavily on recent top artists.
   */
  public async getQuickPicks(): Promise<Track[]> {
    // 1. Get top 2 artists from preferences
    const topArtists = Object.keys(this.preferences.artistWeights)
      .sort((a, b) => this.preferences.artistWeights[b] - this.preferences.artistWeights[a])
      .slice(0, 2);

    if (topArtists.length === 0) {
      // Fallback to general trending if no history
      const trending = await getTrendingMusic('IN');
      return trending.slice(0, 15);
    }

    try {
      // 2. Fetch tracks concurrently for lag-free performance
      const searchPromises = topArtists.map(artist => searchTracks(artist, 'IN'));
      const results = await Promise.all(searchPromises);
      
      const combinedTracks = results.flat();
      return this.applyAlgorithm(combinedTracks).slice(0, 15);
    } catch (e) {
      console.error("Smart Automation: Failed to generate Quick Picks", e);
      return [];
    }
  }

  /**
   * Generates 'Speed Dial' selections (fast re-listen of recent favorites).
   */
  public async getSpeedDial(): Promise<Track[]> {
    // Collect the most recently played unique tracks
    const recentUniqueIds = new Set<string>();
    const speedDialKeywords: string[] = [];
    
    // Sort history newest first
    const sortedHistory = [...this.preferences.history].sort((a, b) => b.timestamp - a.timestamp);
    
    for (const record of sortedHistory) {
      if (!recentUniqueIds.has(record.trackId)) {
        recentUniqueIds.add(record.trackId);
        // We use the artist or title to fetch a fresh high-res Track object
        speedDialKeywords.push(`${record.trackTitle} ${record.artist}`);
      }
      if (speedDialKeywords.length >= 4) break;
    }

    if (speedDialKeywords.length === 0) {
      // Fallback
      return (await getTrendingMusic('IN')).slice(0, 12);
    }

    try {
      const searchPromises = speedDialKeywords.map(kw => searchTracks(kw, 'IN'));
      const results = await Promise.all(searchPromises);
      return this.applyAlgorithm(results.flat()).slice(0, 12);
    } catch (e) {
      console.error("Smart Automation: Failed to generate Speed Dial", e);
      return [];
    }
  }
}

// Export a singleton instance for global zero-lag access
export const smartAutomation = new SmartRecommendationEngine();
