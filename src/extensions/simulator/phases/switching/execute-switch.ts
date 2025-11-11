import { Pokemon } from "@smogon/calc";
import { BattleFieldState, PokemonPosition, Trainer } from "../../moveScoring.contracts";
import { SwitchAction } from "../battle/move-selection.contracts";

export function executeSwitch(state: BattleFieldState, trainer: Trainer, action: SwitchAction): BattleFieldState {
    const newState = state.clone();
    const position = action.target.slot;
    const actingTrainer = newState.cpu.name === trainer.name ? newState.cpu : newState.player;
    // Get the active Pokemon to move to party
    const initialActive = actingTrainer.active[position]?.pokemon;

    if (initialActive) {
        // Add active Pokemon to end of party
        actingTrainer.party.push(initialActive);
    }

    let incoming = action.switchIn && popFromParty(actingTrainer.party, action.switchIn);
    // Replace active Pokemon
    actingTrainer.active[position] = new PokemonPosition(incoming!, true);

    return newState;
}

export function popFromParty(party: Pokemon[], pokemon: Pokemon): Pokemon {
    const index = party.findIndex(p => p.equals(pokemon));
    if (index === -1)
        throw new Error("Pokemon not found in party");

    return party.splice(index, 1)[0];
}