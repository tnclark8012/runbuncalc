import { Pokemon } from "@smogon/calc";
import { BattleFieldState, SwitchStrategy } from "./moveScoring.contracts";
import { BattleSimulator } from "./simulator";
import { gen } from "../configuration";

interface SwitchInConsideration {
    pokemon: Pokemon;
    isFaster: boolean;
    outDamages: boolean;
    kosOpponent: boolean;
    getsKOd: boolean;
}

export class CpuSwitchStrategy implements SwitchStrategy {
	public getPostKOSwitchIn(state: BattleFieldState): Pokemon | undefined {
		if (!state.cpu.party.length || state.player.active[0].pokemon.curHP() === 0)
			return;

        let partyResults = state.cpu.party.map<SwitchInConsideration>(remainingMon => {
            let simulator = new BattleSimulator(gen, state.player.active[0].pokemon.clone(), remainingMon.clone(), state.field.clone());
            let result = simulator.getResult({ maxTurns: 1 });
            const resultState = result.turnOutcomes.at(-1)!.endOfTurnState;
            let cpuMonAfterBattle = resultState.cpu.active[0];
            let playerMonAfterBattle = resultState.player.active[0];
            let cpuDamage = result.turnOutcomes[0].actions.find(a => a.attacker.equals(remainingMon))!.highestRollDamage;
            let playerDamage = result.turnOutcomes[0].actions.find(a => !a.attacker.equals(remainingMon))!.highestRollDamage;
            
            return {
                pokemon: remainingMon,
                getsKOd: cpuMonAfterBattle.pokemon.curHP() === 0,
                kosOpponent: playerMonAfterBattle.pokemon.curHP() === 0,
                outDamages: cpuDamage > playerDamage,
                isFaster: remainingMon.stats.spe >= state.player.active[0].pokemon.stats.spe
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