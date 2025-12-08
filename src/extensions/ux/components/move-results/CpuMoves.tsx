/**
 * CPU Moves Component - displays the CPU's selected Pokemon's moves
 */

import * as React from 'react';
import { useSelector } from 'react-redux';
import { calculateCpuMoveResults, getCpuPossibleActions } from '../../../simulator/phases/battle/cpu-move-selection';
import { selectBattleFieldState } from '../../store/battleFieldStateSelector';
import { MoveItem } from './move-result-group.props';
import { MoveResultGroup } from './MoveResultGroup';

export const CpuMoves: React.FC = () => {
  const battleFieldState = useSelector(selectBattleFieldState);
  
  const moves = React.useMemo((): MoveItem[] => {
    if (!battleFieldState) return [];
        const moveResults = calculateCpuMoveResults(battleFieldState, battleFieldState.cpu.active[0], battleFieldState.player.active[0]);
        const moveActions = getCpuPossibleActions(battleFieldState, battleFieldState.cpu.active[0])
        .filter(action => action.type === "move");
        let moveItems: MoveItem[] = [];
        const mostLikelyMove = moveActions.find(action => action.probability === Math.max(...moveActions.map(a => a.probability)));
        for (let i = 0; i < 4; i++) {
          const action = moveActions[i];
          const moveResult = moveResults[i];
          const position = i === 0 ? 'top' : i === 3 ? 'bottom' : 'mid';
          if (moveResult) {
            const hits = moveResult.move.hits;
            const damageRange = { min: moveResult.lowestRollPerHitDamage * hits, max: moveResult.highestRollPerHitDamage * hits };
            const damagePctRange = { min: moveResult.lowestRollPerHitHpPercentage * hits, max: moveResult.highestRollPerHitHpPercentage * hits };
            const actionChance =  action ? `${(action.probability * 100).toFixed(0)}%` : '';
            const label = action ? `${actionChance} ${moveResult.move.name}` : moveResult.move.name;
            moveItems.push({
              id: `cpuMove${i}`,
              name: moveResult.move.name,
              label: label,
              damageRange: `${damageRange.min.toFixed(1)} - ${damageRange.max.toFixed(1)}`,
              damagePercent: `${damagePctRange.min.toFixed(1)}% - ${damagePctRange.max.toFixed(1)}%`,
              position,
              defaultChecked: mostLikelyMove == action,
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
