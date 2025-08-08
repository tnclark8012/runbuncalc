import { A } from "@smogon/calc";

export function curHPPercentage(pokemon: A.Pokemon): number {
    return pokemon.curHP() / pokemon.maxHP();
}