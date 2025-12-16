/**
 * Player Moves Component - displays the player's selected Pokemon's moves
 */

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gen } from '../../../configuration';
import { calculateAllMoves } from '../../../simulator/moveScoring';
import { getFinalSpeed } from '../../../simulator/utils';
import { setSelectedMoveName } from '../../store/moveSlice';
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
    (moveName: string) => {
      // Extract move name from the selected move
      const move = moves.find(m => m.name === moveName);
      if (move) {
        dispatch(setSelectedMoveName(move.name));
      }
    },
    [dispatch, moves]
  );
  
  const headerText = selection?.species 
    ? `${selection.species}'s Moves`
    : 'No Pokemon Selected';
  
  // Calculate if player is faster
  const isFaster = React.useMemo(() => {
    if (!battleFieldState) return false;
    const playerSpeed = getFinalSpeed(
      battleFieldState.player.active[0].pokemon,
      battleFieldState.field,
      battleFieldState.playerSide
    );
    const cpuSpeed = getFinalSpeed(
      battleFieldState.cpu.active[0].pokemon,
      battleFieldState.field,
      battleFieldState.cpuSide
    );
    // Ties go to CPU (so player must be strictly faster)
    return playerSpeed > cpuSpeed;
  }, [battleFieldState]);
  
  return (
    <MoveResultGroup
      headerId="playerMovesHeader"
      headerText={headerText}
      radioGroupName="playerMoves"
      moves={moves}
      selectedMoveName={selectedMoveName}
      onMoveSelect={handleMoveSelect}
      isFaster={isFaster}
    />
  );
};
