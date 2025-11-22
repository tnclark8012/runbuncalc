import { Field, Move, A, I, Result, Pokemon, calculate } from '@smogon/calc';
import { MoveScore } from "./moveScore";
import { notImplemented } from "./notImplementedError";
import { ActivePokemon, BattleFieldState, CPUMoveConsideration, MoveConsideration, MoveResult, PokemonPosition, Trainer } from './moveScoring.contracts';
import { gen, RNGStrategy } from '../configuration';
import { PossibleTrainerAction } from './phases/battle/move-selection.contracts';
import { canFlinch, getFinalSpeed, hasBerry, isSuperEffective } from './utils';
import { MoveName } from '@smogon/calc/dist/data/interface';

export function scoreCPUMoves(cpuResults: Result[], playerMove: MoveResult, state: BattleFieldState): MoveScore[] {
    // Not quite
    let movesToConsider = getCpuMoveConsiderations(cpuResults, playerMove, state);

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

export function getCpuMoveConsiderations(cpuResults: Result[], playerMove: MoveResult, state: BattleFieldState): CPUMoveConsideration[] {
    let damageResults = toMoveResults(cpuResults);
    let maxDamageMove = findHighestDamageMove(damageResults);
    const aiMon = maxDamageMove.attacker
    const playerMon = maxDamageMove.defender;
    const aiMonPosition = state.cpu.getActivePokemon(aiMon) || new PokemonPosition(aiMon, true);
    const finalAISpeed = getFinalSpeed(aiMon, state.cpuField, state.cpuSide);
    const finalPlayerSpeed = getFinalSpeed(playerMon, state.playerField, state.playerSide);
    const aiIsFaster: boolean = finalAISpeed >= finalPlayerSpeed;
    const aiIsFasterAfterPlayerParalysis = !playerMon.hasStatus('par') && finalAISpeed > finalPlayerSpeed * 0.25;
    const maxDamageMoveTotalHitsHpPercentage = Math.min(maxDamageMove.highestRollPerHitHpPercentage * maxDamageMove.move.hits, playerMon.curHP() / playerMon.maxHP() * 100);
    const damageCappedAtDefenderHp = damageResults.map(r => { return { ...r, damageRolls: r.damageRolls.map(d => Math.min(d, playerMon.curHP())) } });
    const highestDamagingMovePercentChances = getHighestDamagingMovePercentChances(damageCappedAtDefenderHp);
    // Not quite
    let movesToConsider = damageResults.map<CPUMoveConsideration>(r => {
        const kos = r.lowestRollPerHitDamage * r.move.hits >= r.defender.curHP();
        const lowestRollTotalHitsHpPercentage = r.lowestRollPerHitHpPercentage * r.move.hits;
        const highestRollTotalHitsHpPercentage = r.highestRollPerHitHpPercentage * r.move.hits;
        return {
            result: r,
            lowestRollTotalHitsHpPercentage,
            highestRollTotalHitsHpPercentage,
            kos: kos,
            isDamagingMove: r.move.category !== 'Status',
            percentChanceOfBeingHighestDamagingMove: highestDamagingMovePercentChances.get(r.move.name)!,
            isHighestDamagingMove: Math.min(maxDamageMoveTotalHitsHpPercentage, 100) === Math.min(highestRollTotalHitsHpPercentage, 100),
            aiIsFaster,
            aiIsSlower: !aiIsFaster,
            aiIsFasterAfterPlayerParalysis,
            aiWillOHKOPlayer: r.lowestRollPerHitDamage * r.move.hits >= playerMon.curHP(),
            playerMon,
            aiMon,
            playerMove,
            playerWillKOAI: playerMove.highestRollPerHitDamage * playerMove.move.hits >= aiMon.curHP() && !savedFromKO(aiMon),
            playerWill2HKOAI: playerMove.highestRollPerHitDamage * playerMove.move.hits * 2 >= aiMon.curHP(),
            aiOutdamagesPlayer: r.highestRollPerHitDamage * r.move.hits > playerMove.highestRollPerHitDamage * playerMove.move.hits,
            aiMonFirstTurnOut: !!aiMonPosition.firstTurnOut,
            lastTurnCPUMove: undefined, // TODO: Track last move as volatile status?
            field: state.field
        };
    });

    return movesToConsider;
}

export function damagingAttackSpAttackReductionWithGuarnateedEffect(moveScore: MoveScore, considerations: CPUMoveConsideration): void {
    if (!considerations.percentChanceOfBeingHighestDamagingMove)
        return;

    const attackDroppingMoves = ['Trop Kick'];
    const specialAttackDroppingMoves = ['Skitter Smack'];
    const defenderIsAffected = !moveScore.move.defender.hasAbility('Contrary', 'Clear Body', 'White Smoke');

    if (attackDroppingMoves.includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && hasPhysicalMoves(considerations.playerMon) ? 6 : 5, considerations.percentChanceOfBeingHighestDamagingMove);
    }
    else if (specialAttackDroppingMoves.includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && hasSpecialMoves(considerations.playerMon) ? 6 : 5, considerations.percentChanceOfBeingHighestDamagingMove);
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
    if (considerations.percentChanceOfBeingHighestDamagingMove)
        return;

    const defenderIsAffected = !moveScore.move.defender.hasAbility('Contrary', 'Clear Body', 'White Smoke');
    if (['Icy Wind', 'Rock Tomb', 'Mud Shot', 'Low Sweep'].includes(moveScore.move.move.name)) {
        moveScore.addScore(defenderIsAffected && considerations.aiIsSlower ? 6 : 5, considerations.percentChanceOfBeingHighestDamagingMove);
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
    if (considerations.percentChanceOfBeingHighestDamagingMove || considerations.kos) {
        moveScore.addAlternativeScores(6, 0.8 * considerations.percentChanceOfBeingHighestDamagingMove, 8, 0.2 * considerations.percentChanceOfBeingHighestDamagingMove);
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
                moveScore.addScore(-20);
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
            if (consideration.field.defenderSide.isStickyWebs) {
                moveScore.never();
                break;
            }

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
        case 'Fling':
            notImplemented(moveName);
        case 'Role Play':
            notImplemented(moveName);
        case 'Shadow Sneak':
        case 'Aqua Jet':
        case 'Ice Shard':
            if (consideration.field.gameType == 'Doubles' && consideration.aiPartner && consideration.aiPartner.hasItem('Weakness Policy') &&
                isSuperEffective(moveScore.move.move.type, consideration.aiPartner)) {
                moveScore.setScore(12); // "these get a score of +12 total."
            }
            break;
        case 'Magnitude':
            notImplemented(moveName);
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
            notImplemented(moveName);
        // moveScore.addScore(consideration.aiIsSlower ? 9 : 5);
        case 'Trick Room':
            moveScore.addScore(consideration.aiIsSlower ? 10 : 5);
            if (consideration.field.isTrickRoom)
                moveScore.setScore(-20);
            break;
        case 'Fake Out':
            if (!consideration.aiMonFirstTurnOut || consideration.playerMon.hasAbility('Inner Focus'))
                moveScore.never();
            else
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
        case 'Substitute':
        case 'Explosion':
        case 'Misty Explosion':
        case 'Memento':
            notImplemented(moveName);
        case 'Thunder Wave':
        case 'Stun Spore':
        case 'Glare':
        case 'Nuzzle':
        case 'Zap Cannon':
            if (consideration.playerMon.hasStatus('par'))
                return moveScore.never();

            if (consideration.aiIsSlower && consideration.aiIsFasterAfterPlayerParalysis ||
                consideration.aiMon.moves.includes('Hex' as MoveName) ||
                consideration.aiMon.moves.some(m => canFlinch(m))
                // consideration.playerMon.isInfatuated || confused
            ) {
                moveScore.addScore(8);
            }
            else {
                moveScore.addScore(7);
            }
            moveScore.addAlternativeScores(-1, 0.5, 0)
            break;
        case 'Belch':
            if (hasBerry(consideration.aiMon))
                moveScore.setScore(-20);
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
        if ((result.highestRollPerHitDamage * result.move.hits) > (maxDamageMove.highestRollPerHitDamage * maxDamageMove.move.hits))
            maxDamageMove = result;
    }

    return maxDamageMove;
}

export function toMoveResults(results: Result[]): MoveResult[] {
    return results.map(toMoveResult);
}

export function toMoveResult(result: Result): MoveResult {
    let resultDamage = typeof result.damage === 'number' ? [result.damage] : result.damage as number[];
    let lowestHitDamage = resultDamage[0] ? resultDamage[0] : result.damage as number;
    let highestHitDamage = (result.damage as number[])[15] ? resultDamage[15] : result.damage as number;
    let getDamagePct = (hitDamage: number) => hitDamage * (createMove(result.attacker, result.move).hits / result.defender.stats.hp * 100);
    return {
        attacker: result.attacker,
        defender: result.defender,
        move: result.move,
        damageRolls: resultDamage,
        lowestRollPerHitDamage: lowestHitDamage,
        lowestRollPerHitHpPercentage: getDamagePct(lowestHitDamage),
        highestRollPerHitDamage: highestHitDamage,
        highestRollPerHitHpPercentage: getDamagePct(highestHitDamage),
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

export function calculateMoveResult(attacker: Pokemon, defender: Pokemon, moveName: string, field: Field, attackerRng: RNGStrategy): MoveResult;
export function calculateMoveResult(attacker: Pokemon, defender: Pokemon, move: Move, field: Field, attackerRng: RNGStrategy): MoveResult;
export function calculateMoveResult(attacker: Pokemon, defender: Pokemon, moveOrMoveName: string | Move, field: Field, attackerRng: RNGStrategy): MoveResult {
    let move = typeof moveOrMoveName === 'string' ? createMove(attacker, moveOrMoveName) : moveOrMoveName;
    if (attackerRng.willMoveCrit(move)) {
        move = move.clone();
        move.isCrit = true;
    }
    let calcResult = calculate(gen, attacker, defender, move, field);
    let moveResult = toMoveResult(calcResult);
    return moveResult;
}

export function hasMegaStone(pokemon: Pokemon): boolean {
    return !!(pokemon.item && pokemon.item.endsWith('ite'));
}

export function isMegaEvolution(pokemon: Pokemon): boolean {
    return pokemon.name.endsWith("-Mega");
}

export function isMegaEvolutionOf(baseForm: Pokemon, megaForm: Pokemon): boolean {
    if (!isMegaEvolution(megaForm))
        return false;

    if (!canMegaEvolve(baseForm))
        return false;

    return baseForm.name === megaForm.name.replace("-Mega", "");
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

export function getLockedMoveAction(state: BattleFieldState, trainer: Trainer, activeIndex: number): PossibleTrainerAction | undefined {
    const actingPosition = trainer.active[activeIndex];
    let volatileStatus = actingPosition.volatileStatus;
    if (!volatileStatus)
        return;

    if (!volatileStatus.chargingMove)
        return;

    const chargingMove = new Move(gen, volatileStatus.chargingMove);
    return {
        pokemon: actingPosition,
        action: {
            type: 'move',
            pokemon: actingPosition.pokemon,
            move: {
                move: chargingMove,
                target: { type: 'opponent', slot: 0 } // Default to first opponent
            },
            probability: 1
        },
        slot: { slot: activeIndex },
        trainer: trainer
    };
}

// Memoization cache for getHighestDamagingMovePercentChances
const movePercentChancesCache = new Map<string, Map<string, number>>();

/**
 * Looks at all each move result's damageRolls and compares it to the others.
 * @param moveResults 
 * @returns an array of mapped moveResults where the number in the array is the percent chance that it's damage roll is highest. => [0.8, 0.2, 0]
 */
export function getHighestDamagingMovePercentChances(moveResults: Array<{ move: { name: string }, damageRolls: number[] }>): Map<string, number> {
    if (moveResults.length === 0) {
        return new Map();
    }

    // Create a cache key from move names and their damage rolls
    const cacheKey = moveResults
        .map(r => `${r.move.name}:${r.damageRolls.join(',')}`)
        .sort()
        .join('|');
    
    // Check cache
    const cached = movePercentChancesCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const moves: Record<string, number[]> = {};
    const winCounts: Map<string, number> = new Map();
    for (const result of moveResults) {
        moves[result.move.name] = result.damageRolls;
        winCounts.set(result.move.name, 0);
    }
    const moveNames = Object.keys(moves);

    let totalRollCount = 0;
    // Generate all combinations of damage rolls recursively
    function generateCombinations(index: number, currentRolls: Record<string, number>) {
        if (index === moveNames.length) {
            // All moves have been assigned a roll, find the winner(s)
            const rolls = Object.values(currentRolls);
            const max = Math.max(...rolls);
            const winners = moveNames.filter(name => currentRolls[name] === max);
            winners.forEach(name => winCounts.set(name, winCounts.get(name)! + 1));
            totalRollCount++;
            return;
        }

        const moveName = moveNames[index];
        for (const roll of moves[moveName]) {
            currentRolls[moveName] = roll;
            generateCombinations(index + 1, currentRolls);
        }
    }

    generateCombinations(0, {});
    // Convert winCounts to percentages
    for (const [move, count] of winCounts.entries()) {
        winCounts.set(move, count / totalRollCount);
    }
    
    // Store in cache
    movePercentChancesCache.set(cacheKey, winCounts);
    
    return winCounts;
}