import React, { useState, useMemo } from 'react';
import { Play, Pause, Clock, Film, Radio, Sparkles, Volume2 } from 'lucide-react';
import { Track } from '../types';
import { LONG_FORM_ITEMS, LongFormItem, convertLongFormToTrack, getAllLongFormTracks } from '../data/longFormData';

interface LongFormSectionProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onTogglePlay: () => void;
}

type LongFormCategoryFilter = 'All' | 'Continuous Mix' | 'Spiritual & Bhakti' | 'Discourse' | 'Meditation' | 'Regional';

const CATEGORY_TABS: { label: string; value: LongFormCategoryFilter }[] = [
  { label: 'All', value: 'All' },
  { label: 'Continuous Mixes', value: 'Continuous Mix' },
  { label: 'Spiritual & Bhakti', value: 'Spiritual & Bhakti' },
  { label: 'Discourses', value: 'Discourse' },
  { label: 'Meditation & Ragas', value: 'Meditation' },
  { label: 'Regional', value: 'Regional' },
];

export const LongFormSection: React.FC<LongFormSectionProps> = ({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LongFormCategoryFilter>('All');

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return LONG_FORM_ITEMS;
    return LONG_FORM_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const allLongFormTracks = useMemo(() => getAllLongFormTracks(), []);

  const handlePlayItem = (item: LongFormItem) => {
    const track = convertLongFormToTrack(item);
    if (currentTrack?.id === item.id) {
      onTogglePlay();
    } else {
      // Build an ordered queue starting from clicked track
      const itemTracks = filteredItems.map(convertLongFormToTrack);
      const clickedIdx = itemTracks.findIndex((t) => t.id === item.id);
      const reorderedQueue =
        clickedIdx >= 0
          ? [...itemTracks.slice(clickedIdx), ...itemTracks.slice(0, clickedIdx)]
          : itemTracks;
      onPlayTrack(track, reorderedQueue);
    }
  };

  const handlePlayAll = () => {
    if (filteredItems.length > 0) {
      const firstTrack = convertLongFormToTrack(filteredItems[0]);
      const itemTracks = filteredItems.map(convertLongFormToTrack);
      onPlayTrack(firstTrack, itemTracks);
    }
  };

  return (
    <section id="section-long-form-content" className="mb-10 pt-2">
      {/* Header with Title, Badge, and Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
              <Film className="w-3 h-3 text-amber-400" />
              30m - 1 hr Audio/Video
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-zinc-400 border border-white/5">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              Continuous
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Long-form & Non-Stop Audio/Video
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            30-minute to 1-hour uninterrupted musical journeys, spiritual discourses & continuous mixes
          </p>
        </div>

        <button
          onClick={handlePlayAll}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 transition-all shadow-md shadow-orange-950/40"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Play All Non-Stop</span>
        </button>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.value;
          return (
            <button
              key={tab.value}
              id={`filter-tab-longform-${tab.value.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(tab.value)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 shrink-0 ${
                isActive
                  ? 'bg-white text-zinc-950 font-bold shadow-md shadow-white/10'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Horizontal Scrollable Carousel of 16:9 Long-Form Cards */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x snap-mandatory">
        {filteredItems.map((item) => {
          const isCurrentItem = currentTrack?.id === item.id;
          const isCurrentPlaying = isCurrentItem && isPlaying;

          return (
            <div
              key={item.id}
              id={`longform-card-${item.id}`}
              onClick={() => handlePlayItem(item)}
              className="group snap-start shrink-0 w-[280px] sm:w-[320px] rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-white/5 hover:border-white/15 p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-black/60 cursor-pointer relative overflow-hidden"
            >
              {/* Background ambient gradient glow */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
                style={{ backgroundColor: item.accentColor }}
              />

              {/* 16:9 Aspect Ratio Media Banner */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-white/10 mb-3 shadow-inner">
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top-Left Tag Pill */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-amber-300 border border-amber-400/30">
                    {item.tag}
                  </span>
                </div>

                {/* Top-Right Video/Audio Indicator */}
                <div className="absolute top-2 right-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 backdrop-blur-md text-zinc-300 flex items-center gap-1 border border-white/10">
                    <Film className="w-2.5 h-2.5 text-zinc-300" />
                    Video/Audio
                  </span>
                </div>

                {/* Bottom-Right Duration Pill */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-black/80 backdrop-blur-md text-white border border-white/15">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{item.durationDisplay}</span>
                </div>

                {/* Floating Central Play Button on Hover or when Playing */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                    isCurrentPlaying
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 bg-black/30 backdrop-blur-[2px]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 transform transition-transform group-hover:scale-110 active:scale-95">
                    {isCurrentPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Active Playing Equalizer Indicator */}
                {isCurrentPlaying && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/90 text-zinc-950 font-bold text-[10px]">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>PLAYING</span>
                  </div>
                )}
              </div>

              {/* Text Meta Info */}
              <div className="flex-1 flex flex-col">
                <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1 mb-1 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs font-medium text-zinc-400 line-clamp-1 mb-1.5">
                  {item.artist}
                </p>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2.5">
                  {item.description}
                </p>

                {/* Bottom Footer Info */}
                <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                  <span className="flex items-center gap-1 text-amber-400/90 font-semibold">
                    <Sparkles className="w-2.5 h-2.5" />
                    {item.category}
                  </span>
                  <span>{item.views}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
