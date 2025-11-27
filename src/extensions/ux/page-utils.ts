import { Pokemon } from "@smogon/calc";
import { getParty } from "../core/storage";
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from "../simulator/moveScoring.contracts";

export function getBattleFieldState(): BattleFieldState {
    let playerActive = getSelectedPokemon('player');
    let cpuActive = getSelectedPokemon('cpu');
    let playerParty = getPlayerParty().filter(p => p.name !== playerActive.name);
    return new BattleFieldState(
      new PlayerTrainer(
        [new PokemonPosition(playerActive, false)],
        playerParty),
        new CpuTrainer(
          [new PokemonPosition(cpuActive, false)],
          getCpuParty()
        ),
        createField()
    );
}

export function getPlayerParty(): Pokemon[] {
  let partySets = getParty();
  let party = partySets.map((set) => {
    return createPokemon(set)
  });

  return party
}

export function getCpuParty(): Pokemon[] {
  let cpuMons = document.getElementsByClassName(`opposite-pok right-side`)
  let party = Array.from(cpuMons).map((element: Element) => {
    return createPokemon(element.getAttribute("data-id"))
  });

  return party;
}

export function getSelectedPokemon(side: 'player' | 'cpu'): Pokemon {
  	let playerMons = document.getElementsByClassName(`trainer-pok left-side`);
    let cpuMons = document.getElementsByClassName(`opposite-pok right-side`);
	  // i calc here to alleviate some calculation
	  let playerInfo = $("#p1");
	  let cpuInfo = $("#p2");
	  let selectedPlayerMon = createPokemon(playerInfo);
	  let selectedCpuMon = createPokemon(cpuInfo);

    return side == 'player' ? selectedPlayerMon : selectedCpuMon;
}