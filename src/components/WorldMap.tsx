import React from 'react';
import { Character } from '../types/game';
import { WorldMapInteractive } from './map/WorldMapInteractive';

interface WorldMapProps {
  character: Character;
  uiMode: 'auto' | 'mobile' | 'desktop';
  onZoneChange: (zoneId: string) => void;
  onEnterCombat: (monsterId?: string) => void;
  onUpdateCharacter?: (updated: Character) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  character,
  uiMode,
  onZoneChange,
  onEnterCombat,
  onUpdateCharacter,
}) => {
  return (
    <WorldMapInteractive
      character={character}
      uiMode={uiMode}
      onZoneChange={onZoneChange}
      onEnterCombat={onEnterCombat}
      onUpdateCharacter={onUpdateCharacter}
    />
  );
};
