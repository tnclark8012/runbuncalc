import { Move, Pokemon } from "@smogon/calc";
import { getCpuPossibleActions } from "../simulator/phases/battle/cpu-move-selection";
import { PerformCalculationsEventName } from "../window";
import { getBattleFieldState, getSelectedPokemon } from "./page-utils";
import { getAbilitiesForPokemon, Pokedex, PokedexEntry } from "./pokedex";

export function initializeCalcCustomization(): void {
  document.addEventListener(PerformCalculationsEventName, () => {
    updateCpuMoveSelection();
    updateSelectOptions()
  });

  updateCpuMoveSelection();
}

async function updateSelectOptions(): Promise<void> {
  const currentPokemon = getSelectedPokemon('player');
  const entry = (await Pokedex.getEntry(currentPokemon))!;
  // await updatePlayerAbilityOptions(currentPokemon, entry);
  // await updatePlayerMoveOptions(currentPokemon, entry);
}

async function updatePlayerAbilityOptions(currentPokemon: Pokemon, entry: PokedexEntry): Promise<void> {

  const abilities = await getAbilitiesForPokemon(currentPokemon);
  const select = document.querySelector<HTMLSelectElement>("fieldset#p1 select.ability")!;
  updateSelectWithExpectedOptions(select, abilities, currentPokemon.ability!);
}

async function updatePlayerMoveOptions(currentPokemon: Pokemon, entry: PokedexEntry): Promise<void> {
  const moves = ["(No Move)"].concat(entry.moves);
  for (let i = 0; i < 4; i++) {
    const moveSelect = document.querySelector<HTMLSelectElement>(`fieldset#p1 .move${i + 1} select.move-selector`)!;
    const move = currentPokemon.moves[i] as any as Move;
    updateSelectWithExpectedOptions(moveSelect, moves, move.name);
  }
}

function updateSelectWithExpectedOptions(select: HTMLSelectElement, expectedOptions: string[], expectedOption: string): void {
  let currentOptions = [];
  for (let i = 0; i < select.options.length; i++) {
    currentOptions.push(select.options[i].value);
  }

  const optionsMatch = expectedOptions.length === currentOptions.length && expectedOptions.every((option) => currentOptions.includes(option));
  const expectedIndex = expectedOptions.indexOf(expectedOption);

  if (optionsMatch && expectedIndex === select.selectedIndex)
    return;

  if (!optionsMatch) {
    select.innerHTML = '';
    
    for (let expectedOption of expectedOptions) {
      const option = document.createElement('option');
      option.value = expectedOption;
      option.textContent = expectedOption;
      select.appendChild(option);
    }
  }

  if (expectedIndex != select.selectedIndex){
    select.selectedIndex = expectedIndex;
  }

  select.dispatchEvent(new Event('change'));
}

function updateCpuMoveSelection(): void {
  const state = getBattleFieldState();
  const actions = getCpuPossibleActions(state, state.cpu.active[0]);
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