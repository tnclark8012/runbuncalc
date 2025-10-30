import { A } from "@smogon/calc";

export function curHPPercentage(pokemon: A.Pokemon): number {
    return pokemon.curHP() / pokemon.maxHP();
}

export function isFainted(pokemon: A.Pokemon): boolean {
    return pokemon.curHP() <= 0;
}