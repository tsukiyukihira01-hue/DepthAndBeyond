import React from 'react';
import { Character } from '../types/game';
import { PlayableTownHub } from './town/PlayableTownHub';

interface CityHubViewProps {
  character: Character;
  onUpdateCharacter?: (updated: Character) => void;
  onNavigateView: (
    view:
      | 'map'
      | 'combat'
      | 'raid'
      | 'party'
      | 'character'
      | 'inventory'
      | 'blacksmith'
      | 'skills'
      | 'familiar'
      | 'market'
      | 'mercenary'
      | 'guild'
      | 'quests'
  ) => void;
}

export const CityHubView: React.FC<CityHubViewProps> = ({ character, onUpdateCharacter, onNavigateView }) => {
  return (
    <PlayableTownHub
      character={character}
      onUpdateCharacter={onUpdateCharacter}
      onNavigateView={onNavigateView}
    />
  );
};
