import React, { memo } from 'react';
import { Home, Search, Compass, Library } from 'lucide-react';
import { TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

const NavbarComponent: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <div
      id="bottom-navbar"
      className="fixed bottom-5 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center"
    >
      <div className="w-full max-w-[420px] pointer-events-auto">
        <nav className="w-full h-15 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full px-3 flex items-center justify-around shadow-2xl shadow-black/80">
          {/* Home Tab */}
          <button
            id="nav-tab-home"
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
              activeTab === 'home'
                ? 'text-[#ff2d55] scale-105 font-bold'
                : 'text-zinc-400 hover:text-white opacity-70 hover:opacity-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>

          {/* Search Tab */}
          <button
            id="nav-tab-search"
            onClick={() => onSelectTab('search')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
              activeTab === 'search'
                ? 'text-[#ff2d55] scale-105 font-bold'
                : 'text-zinc-400 hover:text-white opacity-70 hover:opacity-100'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Search</span>
          </button>

          {/* Explore Tab */}
          <button
            id="nav-tab-explore"
            onClick={() => onSelectTab('explore')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
              activeTab === 'explore'
                ? 'text-[#ff2d55] scale-105 font-bold'
                : 'text-zinc-400 hover:text-white opacity-70 hover:opacity-100'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Explore</span>
          </button>

          {/* Library Tab */}
          <button
            id="nav-tab-library"
            onClick={() => onSelectTab('library')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
              activeTab === 'library'
                ? 'text-[#ff2d55] scale-105 font-bold'
                : 'text-zinc-400 hover:text-white opacity-70 hover:opacity-100'
            }`}
          >
            <Library className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export const Navbar = memo(NavbarComponent);
Navbar.displayName = 'Navbar';
