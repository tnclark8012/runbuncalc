import { Field, Pokemon } from "@smogon/calc";
import { gen } from "../configuration";
import type { SetCollectionData } from "../core/storage.contracts";
import { OpposingTrainer } from "../trainer-sets";
import { TrainerNames } from "../trainer-sets.data";
import { BattleFieldState, CpuTrainer, PlayerTrainer } from "./moveScoring.contracts";

export class BattleFieldStateBuilder {
    public static buildTrainerBattle(player: SetCollectionData, cpu: TrainerNames): BattleFieldState {
        const playerPokes = player.party.map(pokemonId => 
            {
                const name = pokemonId.split(' (')[0];
                let setsForPoke = player.customSets[name!];
                let set = Object.entries(setsForPoke)[0][1];
                return new Pokemon(gen, name!, {
                    level: set.level,
                    ability: set.ability,
                    item: set.item,
                    nature: set.nature,
                    ivs: set.ivs,
                    moves: set.moves,
                });
            });

        return new BattleFieldState(
            new PlayerTrainer([], playerPokes),
            new CpuTrainer([], OpposingTrainer(cpu)),
            new Field());
    }
}