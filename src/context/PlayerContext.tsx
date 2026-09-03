import React, { createContext, useContext } from 'react';
import { Track } from '../types';

export interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  playTrack?: (track: Track, customQueue?: Track[]) => void;
  togglePlay?: () => void;
  nextTrack?: () => void;
  prevTrack?: () => void;
}

const defaultPlayerContext: PlayerContextType = {
  currentTrack: null,
  isPlaying: false,
  queue: [],
};

const PlayerContext = createContext<PlayerContextType>(defaultPlayerContext);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PlayerContext.Provider value={defaultPlayerContext}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  return useContext(PlayerContext);
};

export default PlayerContext;
