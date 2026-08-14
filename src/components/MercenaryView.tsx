import React, { useState } from 'react';
import { Character, MercenaryRental } from '../types/game';
import { Users, Coins, Sparkles, UserCheck } from 'lucide-react';
import { ErrorNoticeModal } from './ErrorNoticeModal';

interface MercenaryViewProps {
  character: Character;
  onNavigateToDungeon?: () => void;
}

export const MercenaryView: React.FC<MercenaryViewProps> = ({ character, onNavigateToDungeon }) => {
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    requiredGold?: number;
    currentGold?: number;
  }>({
    isOpen: false,
    message: '',
  });

  const sampleMercenaries: MercenaryRental[] = [
    {
      id: 'merc_01',
      ownerCharacterId: 'usr_55',
      ownerName: 'Heiter The Priest',
      characterLevel: 48,
      characterStats: {
        hp: 650, maxHp: 650, mana: 300, maxMana: 300, ward: 150, maxWard: 150,
        str: 15, def: 25, int: 50, wis: 60, spd: 15, dex: 15, unassignedPoints: 0,
      },
      feeGold: 2500,
      durationHours: 24,
      isRented: false,
    },
    {
      id: 'merc_02',
      ownerCharacterId: 'usr_44',
      ownerName: 'Stark The Warrior',
      characterLevel: 52,
      characterStats: {
        hp: 950, maxHp: 950, mana: 100, maxMana: 100, ward: 50, maxWard: 50,
        str: 75, def: 55, int: 10, wis: 15, spd: 25, dex: 30, unassignedPoints: 0,
      },
      feeGold: 3500,
      durationHours: 24,
      isRented: false,
    },
  ];

  const handleHireMercenary = (merc: MercenaryRental) => {
    if (character.gold < merc.feeGold) {
      setErrorModal({
        isOpen: true,
        title: 'Insufficient Gold for Mercenary Rental!',
        message: `Hiring ${merc.ownerName} (Level ${merc.characterLevel}) as a 5th party member requires ${merc.feeGold.toLocaleString()} Gold, but you currently only have ${character.gold.toLocaleString()} Gold in your pouch.`,
        requiredGold: merc.feeGold,
        currentGold: character.gold,
      });
      return;
    }

    alert(`Successfully hired ${merc.ownerName}! They will accompany you in combat for 24 hours.`);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl space-y-4 text-slate-100">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Users className="h-5 w-5 text-amber-400" />
        <div>
          <h2 className="font-serif text-lg font-bold text-amber-200">
            Tavern Mercenary Guild (Offline Player Rental)
          </h2>
          <p className="text-xs text-slate-400">Hire offline players as AI 5th party members • 85% Owner Payout</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {sampleMercenaries.map((merc) => (
          <div
            key={merc.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <div className="font-bold text-amber-200">{merc.ownerName}</div>
                <div className="text-[10px] text-slate-400">
                  Level {merc.characterLevel} • HP: {merc.characterStats.maxHp}
                </div>
                <div className="text-[10px] text-amber-300 font-semibold mt-1 flex items-center gap-1">
                  <Coins className="h-3 w-3 text-amber-400" /> Rental Fee: {merc.feeGold.toLocaleString()} Gold
                </div>
              </div>
            </div>

            <button
              onClick={() => handleHireMercenary(merc)}
              className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" /> Hire Mercenary
            </button>
          </div>
        ))}
      </div>

      <ErrorNoticeModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        requiredGold={errorModal.requiredGold}
        currentGold={errorModal.currentGold}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
        onGoToDungeon={onNavigateToDungeon}
      />
    </div>
  );
};
