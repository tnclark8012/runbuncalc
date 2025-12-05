/**
 * Player Moves Component - displays the player's selected Pokemon's moves
 */

import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { MoveItem } from './move-result-group.props';
import { MoveResultGroup } from './MoveResultGroup';

export const PlayerMoves: React.FC = () => {
  const { selection, availableSets } = useSelector((state: RootState) => state.set.player);
  
  const moves = React.useMemo((): MoveItem[] => {
    if (!selection.species || !selection.setName) return [];
    
    const pokemonSets = availableSets[selection.species];
    if (!pokemonSets) return [];
    
    const set = pokemonSets[selection.setName];
    if (!set?.moves) return [];
    
    return set.moves.map((moveName, index) => ({
      id: `playerMove${index}`,
      name: moveName,
      damageRange: '0 - 0',
      damagePercent: '0 - 0%',
      position: index === 0 ? 'top' : index === set.moves!.length - 1 ? 'bottom' : 'mid',
      defaultChecked: index === 0,
    }));
  }, [selection, availableSets]);
  
  const headerText = selection.species 
    ? `${selection.species}'s Moves`
    : 'No Pokemon Selected';
  
  return (
    <MoveResultGroup
      headerId="playerMovesHeader"
      headerText={headerText}
      radioGroupName="playerMoves"
      moves={moves}
    />
  );
};
