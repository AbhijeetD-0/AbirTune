import React from 'react';

interface SplashScreenProps {
  isFadingOut?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isFadingOut = false }) => {
  return (
    <div
      id="splash-screen"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0c] transition-opacity duration-500 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-[#ff2d55]/10 blur-[100px] pointer-events-none animate-pulse" />

      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Typographic Logo */}
        <div className="flex items-center tracking-tight text-4xl sm:text-5xl font-black drop-shadow-[0_0_25px_rgba(255,255,255,0.25)]">
          <span className="text-white">Abir</span>
          <span className="text-[#ff2d55] drop-shadow-[0_0_20px_rgba(255,45,85,0.6)]">Tune</span>
        </div>

        {/* Pure CSS Animated Soundwave Bars */}
        <div className="flex items-center gap-1.5 h-8 px-4 py-1">
          <div
            className="w-1 bg-[#ff2d55] rounded-full animate-bounce h-7"
            style={{
              animationDuration: '0.85s',
              animationDelay: '0ms',
              boxShadow: '0 0 8px rgba(255, 45, 85, 0.6)'
            }}
          />
          <div
            className="w-1 bg-white/90 rounded-full animate-bounce h-5"
            style={{
              animationDuration: '0.95s',
              animationDelay: '150ms',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)'
            }}
          />
          <div
            className="w-1 bg-[#ff2d55] rounded-full animate-bounce h-8"
            style={{
              animationDuration: '0.75s',
              animationDelay: '300ms',
              boxShadow: '0 0 8px rgba(255, 45, 85, 0.6)'
            }}
          />
          <div
            className="w-1 bg-white/90 rounded-full animate-bounce h-6"
            style={{
              animationDuration: '1.05s',
              animationDelay: '450ms',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)'
            }}
          />
          <div
            className="w-1 bg-[#ff2d55] rounded-full animate-bounce h-4"
            style={{
              animationDuration: '0.9s',
              animationDelay: '200ms',
              boxShadow: '0 0 8px rgba(255, 45, 85, 0.6)'
            }}
          />
        </div>

        <p className="text-xs font-medium text-white/40 tracking-widest uppercase">
          Studio High Fidelity
        </p>
      </div>
    </div>
  );
};
