import { getCpuPossibleActions } from "../simulator/phases/battle/cpu-move-selection";
import { getBattleFieldState } from "./page-utils";

export function initializeCalcCustomization(): void {
  $('input.opposing').on('change', () => {
    updateCpuMoveSelection();
  });

  updateCpuMoveSelection();
}

function updateCpuMoveSelection(): void {
  const state = getBattleFieldState();
  console.log('opposing changed', state);
  const actions = getCpuPossibleActions(state, state.cpu.active[0]);
  console.log('cpu will', actions);
  let moveButtons = document.querySelectorAll('[aria-labelledby="resultHeaderR"] label.btn');
  moveButtons.forEach((button) => {
    let odds = actions.find((action) => action.type === 'move' && action.move.move.name === button.textContent);
    if (odds) {
      button.textContent = `${button.textContent} (${Math.round(odds.probability * 100)}%)`;
    }
    else {
      button.textContent = `${button.textContent} (0%)`;
    }
  });
}