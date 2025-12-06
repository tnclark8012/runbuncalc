/**
 * Player Moves Component - displays the player's selected Pokemon's moves
 */

import * as React from 'react';
import { useSelector } from 'react-redux';
import { gen } from '../../../configuration';
import { calculateAllMoves } from '../../../simulator/moveScoring';
import { selectBattleFieldState } from '../../store/battleFieldStateSelector';
import { RootState } from '../../store/store';
import { MoveItem } from './move-result-group.props';
import { MoveResultGroup } from './MoveResultGroup';

export const PlayerMoves: React.FC = () => {
  const { selection, availableSets } = useSelector((state: RootState) => state.set.player);
  const battleFieldState = useSelector(selectBattleFieldState);
  
  const moves = React.useMemo((): MoveItem[] => {
    if (!battleFieldState) return [];

    const results = calculateAllMoves(gen, battleFieldState?.player.active[0].pokemon,
      battleFieldState?.cpu.active[0].pokemon,
      battleFieldState?.playerField);

    return results.map<MoveItem>((result, index) => ({
      id: `playerMove${index}`,
      name: result.move.name,
      damageRange: result.moveDesc(''),
      damagePercent: result.moveDesc('%'),
      position: index === 0 ? 'top' : index === results.length - 1 ? 'bottom' : 'mid',
      defaultChecked: index === 0,
    }));
  }, [battleFieldState]);
  
  const headerText = selection!.species 
    ? `${selection!.species}'s Moves`
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
