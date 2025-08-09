import { Pokemon } from "@smogon/calc";
import { BattleFieldState, SwitchStrategy } from "./moveScoring.contracts";
import { BattleSimulator } from "./simulator";

interface SwitchInConsideration {
    pokemon: Pokemon;
    isFaster: boolean;
    outDamages: boolean;
    kosOpponent: boolean;
    getsKOd: boolean;
}

export class CpuSwitchStrategy implements SwitchStrategy {
	public getPostKOSwitchIn(state: BattleFieldState): Pokemon | undefined {
		if (!state.cpu.remainingPokemon.length || state.player.activeSlot.pokemon.curHP() === 0)
			return;

        let partyResults = state.cpu.remainingPokemon.map<SwitchInConsideration>(remainingMon => {
            let simulator = new BattleSimulator(gen, state.player.activeSlot.pokemon.clone(), remainingMon.clone(), state.playerField.clone(), state.cpuField.clone());
            let result = simulator.getResult({ maxTurns: 1 });
            const resultState = result.turnOutcomes.at(-1)!.endOfTurnState;
            let cpuMonAfterBattle = resultState.cpu.activeSlot;
            let playerMonAfterBattle = resultState.player.activeSlot;
            let cpuDamage = result.turnOutcomes[0].actions.find(a => a.attacker.equals(remainingMon))!.highestRollDamage;
            let playerDamage = result.turnOutcomes[0].actions.find(a => !a.attacker.equals(remainingMon))!.highestRollDamage;
            
            return {
                pokemon: remainingMon,
                getsKOd: cpuMonAfterBattle.pokemon.curHP() === 0,
                kosOpponent: playerMonAfterBattle.pokemon.curHP() === 0,
                outDamages: cpuDamage > playerDamage,
                isFaster: remainingMon.stats.spe >= state.player.activeSlot.pokemon.stats.spe
            };
        });

        let bestMon = 
            partyResults.find(result => result.kosOpponent && result.isFaster) ||
            partyResults.find(result => result.kosOpponent && !result.isFaster && !result.getsKOd) ||
            partyResults.find(result => result.outDamages && result.isFaster) ||
            partyResults.find(result => result.outDamages && !result.isFaster) ||
            partyResults.find(result => result.isFaster) ||
            partyResults[0]!;

        return bestMon.pokemon;
	}
}