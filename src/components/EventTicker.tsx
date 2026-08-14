import React, { useState, useEffect } from 'react';
import { Radio, ChevronUp, ChevronDown, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EventTickerProps {
  className?: string;
}

export const EventTicker: React.FC<EventTickerProps> = ({ className = '' }) => {
  // Only important news items
  const importantEvents = [
    {
      id: 1,
      badge: 'GLOBAL EVENT',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: '🚨',
      text: '2.0x EXP & 1.5x Gold Boost Active across all Dungeon Floors!',
    },
    {
      id: 2,
      badge: 'RAID ALERT',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: '🐉',
      text: 'Infernal Dragon Sovereign Instance #1 active in World Boss Dungeons!',
    },
    {
      id: 3,
      badge: 'GUILD ANNOUNCEMENT',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: '🏆',
      text: 'Frieren Guildios established by Guildmaster Frieren!',
    },
    {
      id: 4,
      badge: 'SPECIAL GACHA',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: '🎁',
      text: 'Claim your 1x FREE Pet Companion Roll in Familiar Sanctuary!',
    },
    {
      id: 5,
      badge: 'DUNGEON UPDATE',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: '⚔️',
      text: 'New Floor Realm Bosses unlocked up to Floor #100!',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setDirection('up');
      setCurrentIndex((prev) => (prev + 1) % importantEvents.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, importantEvents.length]);

  const handleNext = () => {
    setDirection('up');
    setCurrentIndex((prev) => (prev + 1) % importantEvents.length);
  };

  const handlePrev = () => {
    setDirection('down');
    setCurrentIndex((prev) => (prev - 1 + importantEvents.length) % importantEvents.length);
  };

  const currentEv = importantEvents[currentIndex];

  const variants = {
    initial: (dir: 'up' | 'down') => ({
      y: dir === 'up' ? 24 : -24,
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: 'up' | 'down') => ({
      y: dir === 'up' ? -24 : 24,
      opacity: 0,
    }),
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative flex items-center justify-between overflow-hidden rounded-xl border border-amber-500/40 bg-slate-900/95 py-2 px-3 text-xs shadow-lg backdrop-blur-sm select-none min-h-[42px] ${className}`}
    >
      {/* Ticker Header Badge */}
      <div className="flex items-center gap-2 font-bold text-amber-300 pr-3 border-r border-slate-800 shrink-0 select-none">
        <Radio className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span className="uppercase text-[10px] tracking-wider font-mono hidden sm:inline">IMPORTANT NEWS</span>
        <span className="uppercase text-[10px] tracking-wider font-mono sm:hidden">NEWS</span>
      </div>

      {/* Vertical Animated News Item Container */}
      <div className="flex-1 overflow-hidden mx-3 relative h-6 flex items-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentEv.id}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-x-0 flex items-center gap-2 text-slate-100 text-[11px] font-medium truncate"
          >
            <span className="text-base shrink-0">{currentEv.icon}</span>
            <span
              className={`hidden md:inline-block rounded px-1.5 py-0.5 text-[9px] font-bold border font-mono shrink-0 ${currentEv.badgeColor}`}
            >
              {currentEv.badge}
            </span>
            <span className="truncate text-slate-200">{currentEv.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls & Index Counter */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-800 text-[10px] text-slate-400 font-mono">
        <span className="text-amber-400 font-bold">
          {currentIndex + 1}/{importantEvents.length}
        </span>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={handlePrev}
            title="Previous News"
            className="p-0.5 rounded hover:bg-slate-800 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={handleNext}
            title="Next News"
            className="p-0.5 rounded hover:bg-slate-800 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

