import { Field, I, StatsTable, Move, Result, Pokemon, MEGA_STONES } from '@smogon/calc';
import { applyBoost, getPercentageOfMaxHP, isSuperEffective } from '../../utils';
import { hasLifeSavingItem } from '../../moveScoring';
import { getRecovery, getRecoil } from '@smogon/calc/dist/desc';
import { MoveResult } from '../../moveScoring.contracts';
import { RNGStrategy } from '../../../configuration';
import { isContactMove } from '../../move-properties';

export function executeMove(gen: I.Generation, attacker: Pokemon, defender: Pokemon, moveResult: MoveResult, rng: RNGStrategy): { attacker: Pokemon, defender: Pokemon } {
	let boosts = getBoosts(attacker, defender, moveResult.move);
	const attackerLostItem = consumesAttackerItem(attacker, moveResult.move);
	const defenderLostItem = consumesDefenderItem(defender, moveResult.move);

	const recovery = getRecovery(gen, attacker, defender, moveResult.move, moveResult.highestRollDamage);
	// TODO: recoil
	const moveRecoil = getRecoil(gen, attacker, defender, moveResult.move, moveResult.highestRollDamage);
	let recoil = 0;
	if (moveRecoil.recoil) {
		recoil = Array.isArray(moveRecoil.recoil) ? moveRecoil.recoil.at(-1) ?? 0 : moveRecoil.recoil;
	}

	let getResultantHP = (pokemon: Pokemon, hitDamages: number[], move?: Move): number => {
		let currentHP = pokemon.curHP();

		for (let hitDamage of hitDamages) {
			currentHP = Math.max(0, currentHP - hitDamage);
			currentHP = consumeBerryAfterHit(defender, currentHP, move);
		}

		return currentHP;
	};

	// TODO attacker berry consumption after recoil
	const itemRecoil = getItemRecoil(attacker)
	const abilityRecoil = getPerHitAbilityRecoil(attacker, moveResult.move, defender);
	attacker = attacker.clone({ 
		boosts: boosts.attacker,
		item: !attackerLostItem ? attacker.item: undefined,
		curHP: getResultantHP(attacker, [recoil, -recovery.recovery[0], ...Array(rng.getHits(moveResult)).fill(abilityRecoil), itemRecoil], moveResult.move),
		abilityOn: attacker.abilityOn || (attackerLostItem && attacker.hasAbility('Unburden'))
	});

	if (attacker.hasAbility('Libero') || attacker.hasAbility('Protean'))
		attacker.types = [moveResult.move.type];


	defender = defender.clone({ 
		curHP: Math.max(0, getResultantHP(defender, Array(rng.getHits(moveResult)).fill(rng.getDamageRoll(moveResult))), hasLifeSavingItem(defender) && defenderLostItem && moveResult.move.hits < 2 ? 1 : 0),
		item: !defenderLostItem ? defender.item: undefined,
		boosts: boosts.defender,
		abilityOn: defender.abilityOn || (defenderLostItem && defender.hasAbility('Unburden'))
	});

	return { attacker, defender };
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
		case 'Salac Berry':
			if (currentHP <= getPercentageOfMaxHP(defender, 25)) {
				defender.item = undefined;
				applyBoost(defender.boosts, 'spe', 1);
			}
			break;
		case 'Sitrus Berry':
			if (currentHP <= getPercentageOfMaxHP(defender, 50)) {
				defender.item = undefined;
				recovery = getPercentageOfMaxHP(defender, 25);;
			}
		break;
		case 'Oran Berry':
			if (currentHP <= getPercentageOfMaxHP(defender, 50)) {
				defender.item = undefined;
				recovery = 10;
			}
			break;
		case 'Figy Berry':
		case 'Iapapa Berry':
		case 'Mago Berry':
		case 'Wiki Berry':
			if (currentHP <= getPercentageOfMaxHP(defender, 25)) {
				defender.item = undefined;
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
			defender.item = undefined;
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

function getBoosts(attacker: Pokemon, defender: Pokemon, move: Move): { attacker: StatsTable, defender: StatsTable } {
	let attackerBoosts: StatsTable = { ...attacker.boosts };
	let defenderBoosts: StatsTable = { ...defender.boosts };

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
				pokemon.item = undefined;
			}
		}
	};

	checkWhiteHerb(attacker, attackerBoosts);
	checkWhiteHerb(defender, defenderBoosts);

	return {
		attacker: attackerBoosts,
		defender: defenderBoosts
	};
}

function consumesAttackerItem(attacker: Pokemon, move: Move): boolean {
	if (!attacker.item) return false;

	if (attacker.item.endsWith(' Gem')) {
		let gemType = attacker.item.substring(0, attacker.item.length - ' Gem'.length);
		return move.type === gemType;
	}

	return move.name === 'Fling';
}

function consumesDefenderItem(defender: Pokemon, move: Move): boolean {
	if (!defender.item) return false;

	switch (defender.item) {
		case 'Focus Sash':
		case 'Red Card':
			return move.category !== 'Status';
	}
	
	if (move.name === 'Knock Off' && !defender.hasAbility('Sticky Hold') && !(defender.item in MEGA_STONES))
		return true;

	return false;
}