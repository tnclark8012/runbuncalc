import { Field, Pokemon, StatsTable } from "@smogon/calc";
import { Terrain } from "@smogon/calc/src/data/interface";
import { visitActivePokemonInSpeedOrder } from "../../battle-field-state-visitor";
import { ActivePokemon, BattleFieldState } from "../../moveScoring.contracts";
import { applyBoost, consumeItem } from "../../utils";

export function activateStartOfTurnItems(state: BattleFieldState): BattleFieldState {
    state = state.clone();
    visitActivePokemonInSpeedOrder(state, {
        visitActivePokemon: (state, activePokemon, field) => {
            applyItem(state, activePokemon, field);
        }
    });

    return state;
}

function applyItem(state: BattleFieldState, activePokemon: ActivePokemon, field: Field): void {
    switch (activePokemon.pokemon.item) {
        case 'Electric Seed':
            return applyBoostAndConsumeItemInTerrain(activePokemon.pokemon, field, 'Electric', 'def', 1);
        case 'Misty Seed':
            return applyBoostAndConsumeItemInTerrain(activePokemon.pokemon, field, 'Misty', 'spd', 1);
        case 'Psychic Seed':
            return applyBoostAndConsumeItemInTerrain(activePokemon.pokemon, field, 'Psychic', 'def', 1);
        case 'Room Service':
            return void (field.isTrickRoom && applyBoostAndConsumeItem(activePokemon.pokemon, 'spe', -1));
    }
}

function applyBoostAndConsumeItemInTerrain(pokemon: Pokemon, field: Field, terrain: Terrain, kind: keyof StatsTable, modifier: number): void {
    if (field.hasTerrain(terrain)) {
        applyBoostAndConsumeItem(pokemon, kind, modifier);
    }
}

function applyBoostAndConsumeItem(pokemon: Pokemon, kind: keyof StatsTable, modifier: number): void {
    consumeItem(pokemon);
    applyBoost(pokemon.stats, kind, modifier);
}