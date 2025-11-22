import { Field, StatsTable, Move, Pokemon, MEGA_STONES } from '@smogon/calc';
import { applyBoost, getHPAfterDamage, getPercentageOfMaxHP, isSuperEffective } from '../../utils';
import { calculateMoveResult, createMove } from '../../moveScoring';
import { getRecovery, getRecoil } from '@smogon/calc/dist/desc';
import { MoveResult } from '../../moveScoring.contracts';
import { gen, RNGStrategy } from '../../../configuration';
import { isContactMove } from '../../move-properties';
import { notImplemented } from '../../notImplementedError';

export function executeMove(attacker: Pokemon, defender: Pokemon, move: Move, field: Field, attackerRng: RNGStrategy): { attacker: Pokemon, defender: Pokemon };
export function executeMove(attacker: Pokemon, defender: Pokemon, move: string, field: Field, attackerRng: RNGStrategy): { attacker: Pokemon, defender: Pokemon };
export function executeMove(attacker: Pokemon, defender: Pokemon, moveOrMoveName: Move | string, field: Field, attackerRng: RNGStrategy): { attacker: Pokemon, defender: Pokemon } {
	const move = typeof moveOrMoveName === 'string' ? createMove(attacker, moveOrMoveName) : moveOrMoveName;

	attacker = attacker.clone();
	defender = defender.clone();
	
	let moveResult = calculateMoveResult(attacker, defender, move, field, attackerRng);
	let attackerHp = attacker.curHP();
	let defenderHp = defender.curHP();
	let defenderMaxHP = defender.maxHP();
	let attackerMaxHP = attacker.maxHP();

	for (let i = 0; i < attackerRng.getHits(moveResult); i++) {
		if (attacker.hasAbility('Libero') || attacker.hasAbility('Protean'))
			attacker.types = [moveResult.move.type];

		if (i > 0) {
			moveResult = calculateMoveResult(attacker, defender, move, field, attackerRng);
		}

		const moveRecoveryPerHit = getRecovery(gen, attacker, defender, move, moveResult.highestRollPerHitDamage);
		const recoveryPerHit = Array.isArray(moveRecoveryPerHit.recovery) ? moveRecoveryPerHit.recovery.at(-1) ?? 0 : moveRecoveryPerHit.recovery[0];
		const moveRecoilPerHit = getPerHitMoveRecoil(attacker, defender, moveResult);
		const damagePerHit = moveResult.highestRollPerHitDamage;
		const abilityRecoilPerHit = getPerHitAbilityRecoil(attacker, moveResult.move, defender);
		const statusAfterHit = getStatusAfterHit(attacker, defender, moveResult, attackerRng);
		defenderHp = getHPAfterDamage(defender, defenderHp, defenderMaxHP, damagePerHit);
		defender.status = statusAfterHit;
		consumeDefenderItemAfterHit(defender, move);

		consumeAttackerItemBeforeHit(attacker, move);
		attackerHp = getHPAfterDamage(attacker, attackerHp, attackerMaxHP, moveRecoilPerHit);
		attackerHp = getHPAfterDamage(attacker, attackerHp, attackerMaxHP, -recoveryPerHit);
		attackerHp = getHPAfterDamage(attacker, attackerHp, attackerMaxHP, abilityRecoilPerHit);
		applyBoostsFromMoveHit(attacker, defender, move);

		attackerHp = consumeBerryAfterHit(attacker, attackerHp);
		defenderHp = consumeBerryAfterHit(defender, defenderHp, move);
	}

	attackerHp = getHPAfterDamage(attacker, attackerHp, attackerMaxHP, getItemRecoil(attacker));
	attacker = attacker.clone({ curHP: attackerHp });


	defender = defender.clone({ curHP: defenderHp});
	
	return { attacker, defender };
}

function getPerHitMoveRecoil(attacker: Pokemon, defender: Pokemon, moveResult: MoveResult): number {
	const moveRecoil = getRecoil(gen, attacker, defender, moveResult.move, moveResult.highestRollPerHitDamage);
	let moveRecoilPerHit = 0;
	if (moveRecoil.recoil) {
		moveRecoilPerHit = Array.isArray(moveRecoil.recoil) ? moveRecoil.recoil.at(-1) ?? 0 : moveRecoil.recoil;
	}
	return moveRecoilPerHit;
}

/**
 * Returns an amount of recovery from berries
 * @param defender 
 * @param currentHP 
 * @param move The move that caused the damage
 * @returns 
 */
function consumeBerryAfterHit(defender: Pokemon, currentHP: number, move?: Move): number {
	if (!defender.item || !defender.item.endsWith(' Berry') || currentHP <= 0) return currentHP;

	let recovery = 0;
	switch (defender.item) {
		case 'Cheri Berry':
			defender.status = defender.status === 'par' ? '' : defender.status;
			consumeItem(defender);
			break;
		case 'Chesto Berry':
			defender.status = defender.status === 'slp' ? '' : defender.status;
			consumeItem(defender);
			break;
		case 'Pecha Berry':
			defender.status = defender.status === 'psn' || defender.status == 'tox' ? '' : defender.status;
			consumeItem(defender);
			break;
		case 'Rawst Berry':
			defender.status = defender.status === 'frz' ? '' : defender.status;
			consumeItem(defender);
			break;
		case 'Aspear Berry':
			defender.status = defender.status === 'brn' ? '' : defender.status;
			consumeItem(defender);
			break;
		case 'Salac Berry':
			if (currentHP <= getPercentageOfMaxHP(defender, 25)) {
				consumeItem(defender);
				applyBoost(defender.boosts, 'spe', 1);
			}
			break;
		case 'Sitrus Berry':
			if (currentHP <= getPercentageOfMaxHP(defender, 50)) {
				consumeItem(defender);
				recovery = getPercentageOfMaxHP(defender, 25);;
			}
		break;
		case 'Oran Berry':
			if (currentHP <= getPercentageOfMaxHP(defender, 50)) {
				consumeItem(defender);
				recovery = 10;
			}
			break;
		case 'Figy Berry':
		case 'Iapapa Berry':
		case 'Mago Berry':
		case 'Wiki Berry':
			if (currentHP <= getPercentageOfMaxHP(defender, 25)) {
				consumeItem(defender);
				recovery = getPercentageOfMaxHP(defender, 50);
			}
		break;
	}

	if (move && isSuperEffective(move.type, defender)) {
		if (defender.item === 'Occa Berry' && move.type === 'Fire' ||
			defender.item === 'Passho Berry' && move.type === 'Water' ||
			defender.item === 'Wacan Berry' && move.type === 'Electric' ||
			defender.item === 'Rindo Berry' && move.type === 'Grass' ||
			defender.item === 'Yache Berry' && move.type === 'Ice' ||
			defender.item === 'Chople Berry' && move.type === 'Fighting' ||
			defender.item === 'Kebia Berry' && move.type === 'Poison' ||
			defender.item === 'Shuca Berry' && move.type === 'Ground' ||
			defender.item === 'Coba Berry' && move.type === 'Flying' ||
			defender.item === 'Payapa Berry' && move.type === 'Psychic' ||
			defender.item === 'Tanga Berry' && move.type === 'Bug' ||
			defender.item === 'Charti Berry' && move.type === 'Rock' ||
			defender.item === 'Kasib Berry' && move.type === 'Ghost' ||
			defender.item === 'Haban Berry' && move.type === 'Dragon' ||
			defender.item === 'Colbur Berry' && move.type === 'Dark' ||
			defender.item === 'Babiri Berry' && move.type === 'Steel' ||
			defender.item === 'Roseli Berry' && move.type === 'Fairy'
		) {
			consumeItem(defender);
		}
	}

	if (defender.item && defender.hasAbility('Cheek Pouch')) {
		recovery += getPercentageOfMaxHP(defender, 33);
	}

	return Math.min(defender.maxHP(), currentHP + recovery);
}

function getItemRecoil(attacker: Pokemon): number {
	if (attacker.hasItem('Life Orb') && !attacker.hasAbility('Magic Guard')) {
		return getPercentageOfMaxHP(attacker, 10);
	}

	return 0;
}

function getPerHitAbilityRecoil(attacker: Pokemon, move: Move, defender: Pokemon): number {
	if (defender.hasAbility('Rough Skin', 'Iron Barbs') && isContactMove(move)) {
		return Math.floor(attacker.maxHP() * 1/8);
	}

	return 0;
}

function getStatusAfterHit(attacker: Pokemon, defender: Pokemon, moveResult: MoveResult, attackerRng: RNGStrategy): Pokemon['status'] {
	if (defender.status)
		return defender.status;
	
	switch (moveResult.move.name) {
		case 'Poison Powder':
			return 'psn';
		case 'Toxic':
			return 'tox';
		case 'Glare':
		case 'Stun Spore':
			return 'par';
		case 'Thunder Wave':
			notImplemented();
	}

	if (moveResult.move.name === 'Toxic') {
		return 'tox';
	}

	if (moveResult.move.flags.contact && attacker.hasAbility('Poison Touch') && attackerRng.doesAttackingAbilityProc(moveResult)) {
		return 'psn';
	}

	return '';
}

function consumeItem(pokemon: Pokemon): void {
	pokemon.item = undefined;
	if (pokemon.hasAbility('Unburden') && !pokemon.abilityOn) {
		applyBoost(pokemon.boosts, 'spe', 1);
		pokemon.abilityOn = true;
	}
}

function applyBoostsFromMoveHit(attacker: Pokemon, defender: Pokemon, move: Move): void {
	let attackerBoosts: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
	let defenderBoosts: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

	const modifyStat = (stats: StatsTable, kind: keyof StatsTable, modifier: number) => {
		if (defender.hasAbility('Clear Body'))
			return;

		applyBoost(stats, kind, modifier);
	};

	switch(move.name) {
		case 'Bulldoze':
		case 'Icy Wind':
		case 'Mud Shot':
		case 'Rock Tomb':
			modifyStat(defenderBoosts, 'spe', -1);
			break;
		case 'Close Combat': 
			modifyStat(attackerBoosts, 'def', -1);
			modifyStat(attackerBoosts, 'spd', -1);
			break;
		// +1 speed
		case 'Flame Charge':
		case 'Rapid Spin':
			modifyStat(attackerBoosts, 'spd', 1);
			break;
		case 'Superpower':
			modifyStat(attackerBoosts, 'atk', -1);
			modifyStat(attackerBoosts, 'def', -1);
			break;
		case 'Dragon Dance':
			modifyStat(attackerBoosts, 'atk', 1);
			modifyStat(attackerBoosts, 'spe', 1);
			break;
		case 'Swords Dance':
			modifyStat(attackerBoosts, 'atk', 2);
			break;
		case 'Rock Smash':
			modifyStat(defenderBoosts, 'def', -1);
			break;
	}

	switch(defender.ability) {
		case 'Cotton Down':
			modifyStat(attackerBoosts, 'spe', -1);
			break;
		case 'Rattled':
			if (['Bug', 'Ghost', 'Dark'].includes(move.type)) {
				modifyStat(defenderBoosts, 'spe', 1);
			}
			break;
	}

	/** White herb restores all drops */
	const checkWhiteHerb = (pokemon: Pokemon, boosts: StatsTable) => { 
		if (!pokemon.hasItem('White Herb'))
			return;

		for (let [name, value] of Object.entries(boosts)) {
			if (value < 0) {
				(boosts as any)[name] = 0;
				consumeItem(pokemon);
			}
		}
	};

	checkWhiteHerb(attacker, attackerBoosts);
	checkWhiteHerb(defender, defenderBoosts);

	for (let [stat, boost] of Object.entries(attackerBoosts))
		applyBoost(attacker.boosts, stat as keyof StatsTable, boost);

	for (let [stat, boost] of Object.entries(defenderBoosts))
		applyBoost(defender.boosts, stat as keyof StatsTable, boost);
}

function consumeAttackerItemBeforeHit(attacker: Pokemon, move: Move): void {
	if (!attacker.item) return;

	if (attacker.item.endsWith(' Gem')) {
		let gemType = attacker.item.substring(0, attacker.item.length - ' Gem'.length);
		if (move.type === gemType) {
			return consumeItem(attacker);
		}
	}

	if (move.name === 'Fling')
		return consumeItem(attacker);
}

function consumeDefenderItemAfterHit(defender: Pokemon, move: Move): void {
	if (!defender.item) return;

	switch (defender.item) {
		case 'Focus Sash':
		case 'Red Card':
			if (move.category !== 'Status') {
				consumeItem(defender)
				return;
			}
	}
	
	if (move.name === 'Knock Off' && !defender.hasAbility('Sticky Hold') && !(defender.item in MEGA_STONES)) {
		consumeItem(defender)
		return;
	}
}
