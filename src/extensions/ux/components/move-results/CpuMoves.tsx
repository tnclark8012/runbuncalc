/**
 * CPU Moves Component - displays the CPU's selected Pokemon's moves
 */

import * as React from 'react';
import { useSelector } from 'react-redux';
import { getCpuMoveScoresAgainstTarget, getCpuPossibleActions } from '../../../simulator/phases/battle/cpu-move-selection';
import { selectBattleFieldState } from '../../store/battleFieldStateSelector';
import { MoveItem } from './move-result-group.props';
import { MoveResultGroup } from './MoveResultGroup';

export const CpuMoves: React.FC = () => {
  const battleFieldState = useSelector(selectBattleFieldState);
  
  const moves = React.useMemo((): MoveItem[] => {
    if (!battleFieldState) return [];
        const moveResults = getCpuMoveScoresAgainstTarget(battleFieldState, battleFieldState.cpu.active[0], battleFieldState.player.active[0], { slot: 0, type: 'opponent'});
        const actions = getCpuPossibleActions(battleFieldState, battleFieldState.cpu.active[0])
        .filter(action => action.type === "move");
        let moveItems: MoveItem[] = [];
        for (let i = 0; i < 4; i++) {
          const action = actions[i];
          const moveResult = moveResults[i];
          const position = i === 0 ? 'top' : i === 3 ? 'bottom' : 'mid';
          if (action) {
            const hits = moveResult.move.move.hits;
            const damageRange = { min: moveResult.move.lowestRollPerHitDamage * hits, max: moveResult.move.highestRollPerHitDamage * hits };
            const damagePctRange = { min: moveResult.move.lowestRollPerHitHpPercentage * hits, max: moveResult.move.highestRollPerHitHpPercentage * hits };
            const probability = (action.probability * 100).toFixed(0);
            const label = `${probability}% ${moveResult.move.move.name}`;
            moveItems.push({
              id: `cpuMove${i}`,
              name: moveResult.move.move.name,
              label: label,
              damageRange: `${damageRange.min.toFixed(1)} - ${damageRange.max.toFixed(1)}`,
              damagePercent: `${damagePctRange.min.toFixed(1)}% - ${damagePctRange.max.toFixed(1)}%`,
              position,
              defaultChecked: undefined,
            })
          }
          else {
            moveItems.push({
              id: `cpuMove${i}`,
              name: 'No move',
              damageRange: '',
              damagePercent: '',
              position,
              defaultChecked: undefined,
            });
          }
        }
        return moveItems;
  }, [battleFieldState]);

  const headerText = battleFieldState?.cpu.active[0].pokemon.species
    ? `${battleFieldState!.cpu.active[0].pokemon.species.name}'s Moves`
    : 'No Pokemon Selected';
  
  return (
    <MoveResultGroup
      headerId="cpuMovesHeader"
      headerText={headerText}
      radioGroupName="cpuMoves"
      moves={moves}
    />
  );
};
