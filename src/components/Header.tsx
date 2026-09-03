import React, { memo } from 'react';
import { Disc3, Bell, Cast } from 'lucide-react';

interface HeaderProps {
  currentCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const MOOD_PILLS = ['All', 'Bhakti', 'Podcasts', 'Sad', 'Romance', 'Relax', 'Feel Good'];

const HeaderComponent: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
}) => {
  return (
    <header className="sticky top-0 z-30 pt-3 pb-2.5 px-4 bg-[#050505]/90 border-b border-white/5 backdrop-blur-2xl transition-all">
      <div className="max-w-md mx-auto">
        {/* Top Minimal YouTube Music Header: Logo on left, Actions/Avatar on right */}
        <div className="flex items-center justify-between mb-3">
          {/* AbirTune Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff2d55] to-[#9254de] flex items-center justify-center shadow-lg shadow-[#ff2d55]/20 p-0.5">
              <div className="w-full h-full rounded-[10px] bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Disc3 className="w-4 h-4 text-white animate-spin-slow" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-white flex items-center gap-1 leading-none">
                Abir<span className="text-[#ff2d55]">Tune</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-zinc-400 uppercase leading-tight mt-0.5">
                Music
              </span>
            </div>
          </div>

          {/* Right Header Controls: Cast, Notifications & User Avatar */}
          <div className="flex items-center gap-2">
            <button
              aria-label="Cast audio"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-zinc-300 hover:text-white transition-all border border-white/5"
            >
              <Cast className="w-4 h-4" />
            </button>
            <button
              aria-label="Notifications"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-zinc-300 hover:text-white transition-all border border-white/5"
            >
              <Bell className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                aria-label="Profile"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff2d55] to-[#9254de] flex items-center justify-center font-black text-white text-sm shadow-md shadow-[#ff2d55]/20 border border-white/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span>A</span>
              </button>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#050505]" />
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Mood Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {MOOD_PILLS.map((category) => {
            const isActive = currentCategory.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={category}
                id={`mood-pill-${category.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectCategory(category)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-[#ff2d55] text-white shadow-lg shadow-orange-500/30 font-bold scale-[1.02] border border-orange-400/40 ring-1 ring-orange-400/30'
                    : 'bg-white/10 text-zinc-300 hover:text-white hover:bg-white/15 border border-white/5'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export const Header = memo(HeaderComponent);
Header.displayName = 'Header';
