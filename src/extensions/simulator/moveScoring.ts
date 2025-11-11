import { Field, Move, A, I, Result, Pokemon, calculate } from '@smogon/calc';
import { MoveScore } from "./moveScore";
import { notImplemented } from "./notImplementedError";
import { ActivePokemon, CPUMoveConsideration, MoveConsideration, MoveResult, TurnOutcome } from './moveScoring.contracts';

export function scoreCPUMoves(cpuResults: Result[], playerMove: MoveResult, field: Field, lastTurnMoveByCpu: Move | undefined): MoveScore[] {
    // Not quite
    let movesToConsider = getCpuMoveConsiderations(cpuResults, playerMove, field, lastTurnMoveByCpu);

    let moveScores = [];
    for (let potentialMove of movesToConsider) {
        let moveScore = new MoveScore(potentialMove.result);
        if (potentialMove.isDamagingMove) {
            allDamagingMoves(moveScore, potentialMove);
            damagingPriorityMoves(moveScore, potentialMove);
            damagingTrappingMoves(moveScore);
            damagingSpeedReductionMoves(moveScore, potentialMove);
            damagingAttackSpAttackReductionWithGuarnateedEffect(moveScore, potentialMove);
            damagingMinus2SpDefReductionWithGuaranteedEffect(moveScore);
        }
        
        specificMoves(moveScore, potentialMove);
        generalSetup(moveScore, potentialMove);
        offensiveSetup(moveScore, potentialMove);
        defensiveSetup(moveScore, potentialMove);
        // specificSetup(moveScore, potentialMove);
        // recovery(moveScore, potentialMove);
        moveScores.push(moveScore);
    }

    return moveScores;
}

export function getCpuMoveConsiderations(cpuResults: Result[], playerMove: MoveResult, field: Field, lastTurnMoveByCPU: Move | undefined): CPUMoveConsideration[] {
    let damageResults = getDamageRanges(cpuResults);
    let maxDamageMove = findHighestDamageMove(damageResults);
    const aiMon = maxDamageMove.attacker
    const playerMon = maxDamageMove.defender;
    const aiIsFaster: boolean = aiMon.stats.spe >= playerMon.stats.spe;

    // Not quite
    let movesToConsider = damageResults.map<CPUMoveConsideration>(r => {
        const kos = r.lowestRollDamage >= r.defender.curHP();
        return {
            result: r,
            lowestRollHpPercentage: r.lowestRollHpPercentage,
            hightestRollHpPercentage: r.highestRollHpPercentage,
            kos: kos,
            isDamagingMove: r.move.category !== 'Status',
            isHighestDamagingMove: Math.min(maxDamageMove.highestRollHpPercentage, 100) === Math.min(r.highestRollHpPercentage, 100),
            aiIsFaster,
            aiIsSlower: !aiIsFaster,
            aiWillOHKOPlayer: r.lowestRollDamage >= playerMon.curHP(),
            playerMon,
            aiMon,
            playerMove,
            playerWillKOAI: playerMove.highestRollDamage >= aiMon.curHP() && !savedFromKO(aiMon),
            playerWill2HKOAI: playerMove.highestRollDamage * 2 >= aiMon.curHP(),
            aiOutdamagesPlayer: r.highestRollHpPercentage > playerMove.highestRollHpPercentage,
            aiMonFirstTurnOut: !lastTurnMoveByCPU, // TODO: Not quite right, but probably good enough
            lastTurnCPUMove: lastTurnMoveByCPU,
            field
        };
    });

    return movesToConsider;
}

export function damagingAttackSpAttackReductionWithGuarnateedEffect(moveScore: MoveScore, considerations: CPUMoveConsideration): void {
    if (!considerations.isHighestDamagingMove)
        return;
    
    const attackDroppingMoves = ['Trop Kick'];
    const specialAttackDroppingMoves = ['Skitter Smack'];
    const defenderIsAffected = !moveScore.move.defender.hasAbility('Contrary', 'Clear Body', 'White Smoke');

    if (attackDroppingMoves.includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && hasPhysicalMoves(considerations.playerMon) ? 6 : 5);
    }
    else if (specialAttackDroppingMoves.includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && hasSpecialMoves(considerations.playerMon) ? 6 : 5);
    }

    // If it is a Double battle and the move is spread:
    // Additional +1
}

export function damagingMinus2SpDefReductionWithGuaranteedEffect(moveScore: MoveScore): void {
    if (moveScore.move.move.named('Acid Spray'))
        moveScore.addScore(6);
}

export function hasSpecialMoves(pokemon: A.Pokemon): boolean {
    return !!pokemon.moves.find(m => createMove(pokemon, m).category === 'Special');
}

export function hasPhysicalMoves(pokemon: A.Pokemon): boolean {
    return !!pokemon.moves.find(m => createMove(pokemon, m).category === 'Physical');
}

export function damagingTrappingMoves(moveScore: MoveScore): void {
    if (['Whirlpool', 'Fire Spin', 'Sand Tomb', 'Magma Storm', 'Infestation', 'Jaw Lock'].includes(moveScore.move.move.name)) {
        moveScore.addAlternativeScores(6, 0.8, 8);
    }
}

export function damagingSpeedReductionMoves(moveScore: MoveScore, considerations: CPUMoveConsideration): void {
    if (considerations.isHighestDamagingMove)
        return;

    const defenderIsAffected = !moveScore.move.defender.hasAbility('Contrary', 'Clear Body', 'White Smoke');
    if (['Icy Wind', 'Rock Tomb', 'Mud Shot', 'Low Sweep'].includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && considerations.aiIsSlower ? 6 : 5);
    }
    //     If it is a Double battle and the move is Icy Wind or Electroweb:
    //    Additional +1

}

export function damagingPriorityMoves(moveScore: MoveScore, considerations: CPUMoveConsideration): void {
    if (considerations.result.move.priority > 0 && considerations.aiIsSlower && considerations.playerWillKOAI) {
        moveScore.addScore(11);
    }
}
export function allDamagingMoves(moveScore: MoveScore, considerations: CPUMoveConsideration): void {
    if (considerations.result.move.category === 'Status')
        return;

    /*
			All damaging moves:

			AI will roll a random damage roll for all of its attacking moves*, and the highest 
			damaging move gets the following score:
				+6 (~80%), +8 (~20%)
			
			If multiple moves kill, then they are all considered the highest damaging move and 
			all get this score.
			*/
			if (considerations.isHighestDamagingMove || considerations.kos) {
				moveScore.addAlternativeScores(6, 0.8, 8);
			}

			// If a damaging move kills:
			if (considerations.kos) {
				// If AI mon is faster, or the move has priority and AI is slower:
				if (considerations.aiIsFaster || (considerations.aiIsSlower && considerations.result.move.priority > 0)) {
					moveScore.addScore(6);
				}

				if (!considerations.aiIsFaster) {
					moveScore.addScore(3);
				}

				if (considerations.aiMon.hasAbility('Moxie', 'Beast Boost', 'Chilling Neigh', 'Grim Neigh')) {
					moveScore.addScore(1);
				}
			}

			/*
			If a damaging move has a high crit chance and is Super Effective on the target:
        		Additional +1 (50%), no score boost other 50%
			*/ 
			// if (isSuperEffective(potentialMove.result.move, playerMon) || hasHighCritChance(potentialMove.result.move)) {
			// 	moveScore.addScore(1, 0.5);
			// }
}

export function specificMoves(moveScore: MoveScore, consideration: CPUMoveConsideration): void {
    const moveName = moveScore.move.move.name;
    switch (moveName) {
        case 'Future Sight':
            moveScore.addScore(
                consideration.aiIsFaster && consideration.playerWillKOAI ? 
                8 : 6);
            break;
        case 'Relic Song':
            if (moveScore.move.attacker.named('Meloetta')) {
                moveScore.addScore(10);
            }
            else {
                moveScore.setScore(-20);
            }
            break;
        case 'Sucker Punch':
            if (consideration.lastTurnCPUMove?.named('Sucker Punch')) {
                moveScore.addScore(-2, 0.5);
            }
            break;
        case 'Pursuit':
            if (consideration.kos) {
                moveScore.addScore(10);
            }
            else {
                const playerHPPercentage = consideration.playerMon.curHP() / consideration.playerMon.maxHP();
                if (playerHPPercentage < 0.2)
                    moveScore.addScore(10);
                if (playerHPPercentage < 0.4)
                    moveScore.addScore(8, 0.5);
                if (consideration.aiIsFaster)
                    moveScore.addScore(3);
            }
            break;
        case 'Fell Stinger':
            if (consideration.aiMon.boosts.atk < 6 && consideration.kos) {
                if (consideration.aiIsFaster) {
                    moveScore.setAlternativeScores(21, 0.8, 23);
                }
                else {
                    moveScore.addAlternativeScores(15, 0.8, 17);
                }
            }
            break;
        case 'Rollout':
            moveScore.setScore(7);
            break;
        case 'Stealth Rock':
            if (consideration.field.defenderSide.isSR)
                break;

            if (consideration.aiMonFirstTurnOut) {
                moveScore.addAlternativeScores(8, 0.25, 9);
            }
            else {
                moveScore.addAlternativeScores(6, 0.25, 7);
            }
            break;
        case 'Spikes':
        case 'Toxic Spikes':
            if (consideration.aiMonFirstTurnOut) {
                moveScore.addAlternativeScores(8, 0.25, 9);
            }
            else {
                moveScore.addAlternativeScores(6, 0.25, 7);
            }
            if (consideration.field.defenderSide.spikes) // TODO: Not quite, but there's not field toxic spikes
                moveScore.addScore(-1);
            break;
        case 'Sticky Web':
            if (consideration.aiMonFirstTurnOut) {
                moveScore.addAlternativeScores(9, 0.25, 12);
            }
            else {
                moveScore.addAlternativeScores(6, 0.25, 9);
            }
            break;
        case 'Protect':
        case "King's Shield":
            moveScore.addScore(6);
            if (consideration.aiMon.hasStatus('psn', 'brn')) // TOOD: Not quite
                moveScore.addScore(-2);
            if (consideration.playerMon.hasStatus('psn', 'brn')) // TOOD: Not quite
                moveScore.addScore(1);
            if (consideration.aiMonFirstTurnOut) // TOOD: Not quite
                moveScore.addScore(-1);
            if ((consideration.aiMon.hasStatus('psn') && consideration.aiMon.curHP() <= Math.floor(consideration.aiMon.maxHP() / 8)) ||
                (consideration.aiMon.hasStatus('brn') && consideration.aiMon.curHP() <= Math.floor(consideration.aiMon.maxHP() / 16)))
                moveScore.never();
            if (consideration.lastTurnCPUMove?.named('Protect', `King's Shield`))
                moveScore.never(0.5);
            // TODO:    If AI used protect last 2 turns, never uses protect this turn.
            
            break;
        case 'Imprison':
            if (consideration.playerMon.moves.some(playerMove => consideration.aiMon.moves.includes(playerMove))) {
                moveScore.addScore(9);
            }
            else {
                moveScore.setScore(-20);
            }
            break;
        case 'Baton Pass':
            notImplemented();
        case 'Tailwind':
            // TODO: Not quite (doubles)
            moveScore.addScore(consideration.aiIsSlower ? 9 : 5);
            break;
        case 'Trick Room':
            moveScore.addScore(consideration.aiIsSlower ? 10 : 5);
            if (consideration.field.isTrickRoom)
                moveScore.setScore(-20);
            break;
        case 'Fake Out':
            if (consideration.aiMonFirstTurnOut && !consideration.playerMon.hasAbility('Inner Focus'))
                moveScore.addScore(9);
            break;
        case 'Helping Hand':
        case 'Follow Me':
            notImplemented();
        case 'Final Gambit':
            if (consideration.aiIsFaster && consideration.aiMon.curHP() > consideration.playerMon.curHP())
                moveScore.addScore(8);
            else if (consideration.aiIsFaster && consideration.playerWillKOAI)
                moveScore.addScore(7);
            else 
                moveScore.addScore(6);
            break;
        case 'Electric Terrain':
        case 'Grassy Terrain':
        case 'Misty Terrain':
        case 'Psychic Terrain':
            if (consideration.field.terrain === moveName) {
                moveScore.never();
            }
            else {
                moveScore.addScore(consideration.aiMon.hasItem('Terrain Extender') ? 9 : 8);
            }
            break;
        case 'Light Screen':
        case 'Reflect':
            if (moveName === 'Light Screen' && consideration.field.attackerSide.isLightScreen ||
                moveName === 'Reflect' && consideration.field.attackerSide.isReflect) {
                moveScore.never();
                break;
            }
            
            moveScore.addScore(6);
            if (moveName === 'Light Screen' && hasSpecialMoves(consideration.playerMon) || 
                moveName === 'Reflect' && hasPhysicalMoves(consideration.playerMon)) {
                
                if (consideration.aiMon.hasItem('Light Clay'))
                    moveScore.addScore(1);
                moveScore.addScore(1, 0.5);
            }
            break;
    }
}

export function generalSetup(moveScore: MoveScore, consideration: CPUMoveConsideration): void {
    if (![
        'Power-up Punch', 
        'Swords Dance', 
        'Howl', 
        'Stuff Cheeks', 
        'Barrier', 
        'Acid Armor', 
        'Iron Defense', 
        'Cotton Guard',
        'Charge Beam',
        'Tail Glow',
        'Nasty Plot',
        'Cosmic Power', 
        'Bulk Up', 
        'Calm Mind', 
        'Dragon Dance', 
        'Coil', 
        'Hone Claws', 
        'Quiver Dance', 
        'Shift Gear', 
        'Shell Smash', 
        'Growth', 
        'Work Up', 
        'Curse', 
        'Coil', 
        'No Retreat'
    ].includes(moveScore.move.move.name))
        return;
    if (consideration.playerWillKOAI ||
        consideration.playerMon.hasAbility('Unaware') && !['Power-up Punch', 'Swords Dance', 'Howl'].includes(moveScore.move.move.name))
        return moveScore.addScore(-20);
}

export function offensiveSetup(moveScore: MoveScore, consideration: CPUMoveConsideration): void {
    if (![
        'Dragon Dance',
        'Shift Gear', 
        'Swords Dance',
        'Howl',
        'Sharpen',
        'Meditate',
        'Hone Claws'
    ].includes(moveScore.move.move.name))
        return;

    moveScore.addScore(6);
    if (consideration.playerMon.hasStatus('frz', 'slp')) // Not quite
        moveScore.addScore(3);

    if (consideration.aiIsSlower && consideration.playerWill2HKOAI)
        moveScore.addScore(-5);
}

export function defensiveSetup(moveScore: MoveScore, consideration: CPUMoveConsideration): void {
    if (![
        'Acid Armor',
        'Barrier', 
        'Cotton Guard',
        'Harden',
        'Iron Defense',
        'Stockpile',
        'Cosmic Power'
    ].includes(moveScore.move.move.name))
        return;

    moveScore.addScore(6);
    
    if (consideration.aiIsSlower && consideration.playerWill2HKOAI)
        moveScore.addScore(-5);

    if (consideration.playerMon.hasStatus('frz', 'slp')) // Not quite
        moveScore.addScore(2, 0.95);
    
    //  If the move boosts Defense and Special Defense:
    if (['Stockpile',
        'Cosmic Power'].includes(moveScore.move.move.name) &&
        consideration.aiMon.boosts.def < 2 || consideration.aiMon.boosts.spd < 2)
        moveScore.addScore(2);

}

export function recovery(moveScore: MoveScore, consideration: CPUMoveConsideration): void {
    notImplemented();
}


export function isSuperEffective(move: Move, defendingPokemon: A.Pokemon): boolean {
	notImplemented();
}

export function hasHighCritChance(move: Move): boolean {
	notImplemented();
    // return [].includes(move.name);
}

/**
     *Note: There are a few specific damaging moves that do not have their damage rolled normally
    and are thus never considered the "highest damaging move". 

    These moves are Explosion, Final Gambit, Relic Song, Rollout, Meteor Beam,
    damaging trapping moves (e.g. Whirlpool), and Future Sight.

    All of these moves, with the exceptions of Explosion, Final Gambit, and Rollout,
    still have a check to see if they kill the target mon. If so, the above boosts
    for kills still apply. They will just never get the +6 or +8 boost from being the
    "highest damaging move". They all also have separate AI that is listed later in this file,
    which stacks additively with any score boosts from kills.

	
	*/
function specialExecptionNotHighestDamagingMove(): void {
	notImplemented();
}

export function findHighestDamageMove(moveResults: MoveResult[]): MoveResult {
    let maxDamageMove: MoveResult = moveResults[0];
    for (let result of moveResults) {
        if (result.highestRollHpPercentage > maxDamageMove.highestRollHpPercentage)
            maxDamageMove = result;
    }

    return maxDamageMove;
}

export function getDamageRanges(attackerResults: Result[], expectedHits?: number): MoveResult[] {
	/* Returns array of highest damage % inflicted per move
		[{ lowestRoll: 85.6, higestRoll: 101.5 }, ...x4]
	*/
	var attacker = attackerResults[0].attacker;
	var defender = attackerResults[0].defender;
	var highestRoll, lowestRoll, damage = 0;
	//goes from the most optimist to the least optimist
	var p1KO = 0, p2KO = 0;
	//Highest damage
	var p1HD = 0, p2HD = 0;

	return attackerResults.map((result, i) => {
		let resultDamage = result.damage as number[];
		let lowestHitDamage = resultDamage[0] ? resultDamage[0] : result.damage as number;
		let highestHitDamage = (result.damage as number[])[15] ? resultDamage[15] : result.damage as number;
		let getDamagePct = (hitDamage: number) => hitDamage * (createMove(attacker, attacker.moves[i]).hits / defender.stats.hp * 100);
		return {
			attacker,
			defender,
			move: result.move,
			lowestRollDamage: lowestHitDamage,
			lowestRollHpPercentage: getDamagePct(lowestHitDamage),
			highestRollDamage: highestHitDamage,
			highestRollHpPercentage: getDamagePct(highestHitDamage),
		};
	});
}

export function toMoveResult(result: Result): MoveResult {
    let resultDamage = result.damage as number[];
    let lowestHitDamage = resultDamage[0] ? resultDamage[0] : result.damage as number;
    let highestHitDamage = (result.damage as number[])[15] ? resultDamage[15] : result.damage as number;
    let getDamagePct = (hitDamage: number) => hitDamage * (createMove(result.attacker, result.move).hits / result.defender.stats.hp * 100);
    return {
        attacker: result.attacker,
        defender: result.defender,
        move: result.move,
        lowestRollDamage: lowestHitDamage,
        lowestRollHpPercentage: getDamagePct(lowestHitDamage),
        highestRollDamage: highestHitDamage,
        highestRollHpPercentage: getDamagePct(highestHitDamage),
    };
    }

export function savedFromKO(pokemon: A.Pokemon): boolean {
	return hasLifeSavingAbility(pokemon) || hasLifeSavingItem(pokemon);
}

export function moveKillsAttacker(moveResult: MoveResult): boolean {
    return !!(moveResult.move.recoil && moveResult.attacker.curHP() <= moveResult.move.recoil[0]);
}

export function moveWillFail(pokemonSide: ActivePokemon, consideration: MoveConsideration): boolean {
		if (!pokemonSide.firstTurnOut && ['First Impression', 'Fake Out'].includes(consideration.result.move.name))
			return true;

		return false;
	}

export function hasLifeSavingItem(pokemon: A.Pokemon): boolean {
	return pokemon.hasItem('Focus Sash') && pokemon.curHP() === pokemon.maxHP();
}

export function hasLifeSavingAbility(pokemon: A.Pokemon): boolean {
	return pokemon.hasAbility('Sturdy') && pokemon.curHP() === pokemon.maxHP();
}

export function canUseDamagingMoves(pokemon: A.Pokemon): boolean {
    return pokemon.moves.map(m => createMove(pokemon, m)).some(m => m.category !== 'Status');
}

/** Creates a Move as used by a particular pokemon. This will account for things like skill link, item boosts, etc in damage calcs */
export function createMove(pokemon: A.Pokemon, moveName: string | A.Move): Move {
    if (moveName && typeof moveName !== "string")
        moveName = moveName.name;

    return new Move(pokemon.gen, moveName as string, { ability: pokemon.ability, item: pokemon.item, species: pokemon.species.name });
}

/**
 * Returns an array of Result objects, one for each move the attacker has (up to 4).
 * @param gen 
 * @param attacker 
 * @param defender 
 * @param attackerField 
 * @returns 
 */
export function calculateAllMoves(gen: I.Generation, attacker: Pokemon, defender: Pokemon, attackerField: Field): Result[] {
	var results = [];
	for (var i = 0; i < attacker.moves.length; i++) {
		results[i] = calculate(gen, attacker, defender, createMove(attacker, attacker.moves[i]), attackerField);
	}
	return results;
}

export function hasMegaStone(pokemon: Pokemon): boolean {
    return !!(pokemon.item && pokemon.item.endsWith('ite'));
}

export function canMegaEvolve(pokemon: Pokemon): boolean {
    return hasMegaStone(pokemon) && !pokemon.name.endsWith("-Mega");
}

export function megaEvolve(pokemon: Pokemon): Pokemon {
    if (!canMegaEvolve(pokemon))
        throw new Error(`${pokemon.name} cannot mega evolve`);

    let megaForme = Pokemon.getForme(pokemon.gen, pokemon.species.name, pokemon.item);
    return new Pokemon(pokemon.gen, megaForme, {
        item: pokemon.item,
        nature: pokemon.nature,
        moves: pokemon.moves,
        curHP: pokemon.curHP(),
        ivs: pokemon.ivs,
        boosts: pokemon.boosts
    });
}

export function getMegaAbility(name: string): string {
    switch (name) {
        case 'Beedrill-Mega':
            return 'Adaptability';
        case 'Pidgeot-Mega':
            return 'No Guard';
        case 'Slowbro-Mega':
            return 'Shell Armor';
        case 'Gengar-Mega':
            return 'Shadow Tag';
        default:
            throw new Error(`Unknown mega form ${name}`);
    }
}