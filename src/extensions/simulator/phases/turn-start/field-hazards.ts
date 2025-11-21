import { Side } from "@smogon/calc/src/field";
import { ActivePokemon, BattleFieldState } from "../../moveScoring.contracts";
import { visitActivePokemonInSpeedOrder } from "../../battle-field-state-visitor";
import { Pokemon } from "@smogon/calc";
import { applyBoost, applyExternalBoost, damagePokemonWithPercentageOfMaxHp, getTypeEffectiveness } from "../../utils";

export function applyFieldHazards(state: BattleFieldState): BattleFieldState {
    state = state.clone();   
    visitActivePokemonInSpeedOrder(state, {
        visitActivePokemon(state, pokemon, field, side) {
            if (!pokemon.firstTurnOut)
                return;

            applyOrClearHazardOnSide(pokemon, side);
        },
    });

    return state;
}

function applyOrClearHazardOnSide(activePokemon: ActivePokemon, side: Side): void {
    if (side.isSR) {
        let effectiveness = getTypeEffectiveness('Rock', activePokemon.pokemon);
        let pctLost =  effectiveness * 1/8;
        activePokemon.pokemon = damagePokemonWithPercentageOfMaxHp(activePokemon.pokemon, pctLost);
    }

    if (side.isStickyWebs && !activePokemon.pokemon.hasType('Flying')) {
        applyExternalBoost(activePokemon.pokemon, 'spe', -1);
    }

    if (side.spikes && !(activePokemon.pokemon.hasAbility('Levitate') || activePokemon.pokemon.hasType('Flying'))) {
        switch(side.spikes) {
            case 1:
                activePokemon.pokemon = damagePokemonWithPercentageOfMaxHp(activePokemon.pokemon, 1/8);
                break;
            case 2:
                activePokemon.pokemon = damagePokemonWithPercentageOfMaxHp(activePokemon.pokemon, 1/6);
                break;
            case 3:
                activePokemon.pokemon = damagePokemonWithPercentageOfMaxHp(activePokemon.pokemon, 1/4);
                break;
        }
    }

    // if (side.toxicSpikes) {
    //     if (activePokemon.pokemon.hasType('Poison')) {
    //         side.toxicSpikes = undefined;
    //     }
    //     else if (!activePokemon.pokemon.hasType('Steel') && !activePokemon.pokemon.status) {
    //         activePokemon.pokemon.status = side.toxicSpikes == 1 ? 'psn' : 'tox';
    //         if (activePokemon.pokemon.hasStatus('tox'))
    //             activePokemon.pokemon.toxicCounter = 1;
    //     }
    // }
}