import React, { useState } from 'react';
import { REALM_LORE, LoreChapter } from '../../data/landingData';
import { BookOpen, Scroll, ChevronLeft, ChevronRight } from 'lucide-react';
import { audio } from '../../utils/audio';

export const LoreBookSection: React.FC = () => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const chapter = REALM_LORE[activeChapterIndex] || REALM_LORE[0];

  const handleNext = () => {
    audio.playClick();
    setActiveChapterIndex((prev) => (prev + 1) % REALM_LORE.length);
  };

  const handlePrev = () => {
    audio.playClick();
    setActiveChapterIndex((prev) => (prev - 1 + REALM_LORE.length) % REALM_LORE.length);
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-slate-950 to-slate-900 p-6 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-400" />
          <h3 className="font-serif text-lg font-bold text-amber-200">
            Chronicles of Depth and Beyond
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
          <span>{chapter.chapterNumber}</span>
          <span className="text-slate-500">|</span>
          <span>{chapter.era}</span>
        </div>
      </div>

      {/* Chapter Parchment Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-3 font-serif text-slate-300 leading-relaxed text-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{chapter.icon}</span>
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
              {chapter.chapterNumber}
            </span>
            <h4 className="font-serif text-xl font-bold text-amber-100">{chapter.title}</h4>
          </div>
        </div>

        <p className="italic text-amber-200/90 border-l-2 border-amber-500/50 pl-3 py-1 bg-amber-950/30 rounded-r text-xs">
          "{chapter.excerpt}"
        </p>

        <p className="pt-2 text-xs text-slate-300 leading-relaxed font-sans">
          {chapter.fullText}
        </p>
      </div>

      {/* Chapter Pagination Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-amber-500/40 hover:text-amber-200 cursor-pointer transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Chapter</span>
        </button>

        <div className="flex items-center gap-1.5">
          {REALM_LORE.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                audio.playClick();
                setActiveChapterIndex(idx);
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeChapterIndex === idx ? 'w-6 bg-amber-400' : 'w-2 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-amber-500/40 hover:text-amber-200 cursor-pointer transition-all"
        >
          <span>Next Chapter</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
