/**
 * Player Moves Component - displays the player's selected Pokemon's moves
 */

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gen } from '../../../configuration';
import { calculateAllMoves } from '../../../simulator/moveScoring';
import { setSelectedMove } from '../../store/moveSlice';
import { selectBattleFieldState } from '../../store/selectors/battleFieldStateSelector';
import { RootState } from '../../store/store';
import { MoveItem } from './move-result-group.props';
import { MoveResultGroup } from './MoveResultGroup';

export const PlayerMoves: React.FC = () => {
  const dispatch = useDispatch();
  const { selection, availableSets } = useSelector((state: RootState) => state.set.player);
  const battleFieldState = useSelector(selectBattleFieldState);
  const selectedMoveName = useSelector((state: RootState) => state.move.selectedMoveName);
  
  const moves = React.useMemo((): MoveItem[] => {
    if (!battleFieldState) return [];

    const results = calculateAllMoves(gen, battleFieldState?.player.active[0].pokemon,
      battleFieldState?.cpu.active[0].pokemon,
      battleFieldState?.playerField);

    return results.map<MoveItem>((result, index) => ({
      id: `${result.attacker.species.name}.${result.move.name}`,
      name: result.move.name,
      damageRange: result.moveDesc(''),
      damagePercent: result.moveDesc('%'),
      position: index === 0 ? 'top' : index === results.length - 1 ? 'bottom' : 'mid',
      defaultChecked: index === 0,
    }));
  }, [battleFieldState]);

  const handleMoveSelect = React.useCallback(
    (moveId: string) => {
      // Extract move name from the selected move
      const move = moves.find(m => m.id === moveId);
      if (move) {
        dispatch(setSelectedMove(move.id));
      }
    },
    [dispatch, moves]
  );

  // Find the move ID that matches the selected move name
  const selectedMoveId = React.useMemo(() => {
    if (!selectedMoveName) return undefined;
    const move = moves.find(m => m.id === selectedMoveName);
    return move?.id;
  }, [selectedMoveName, moves]);
  
  const headerText = selection?.species 
    ? `${selection.species}'s Moves`
    : 'No Pokemon Selected';
  
  return (
    <MoveResultGroup
      headerId="playerMovesHeader"
      headerText={headerText}
      radioGroupName="playerMoves"
      moves={moves}
      selectedMoveId={selectedMoveId}
      onMoveSelect={handleMoveSelect}
    />
  );
};
