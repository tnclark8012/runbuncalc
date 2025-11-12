import { Field, I, StatsTable, Move, Result, Pokemon, MEGA_STONES } from '@smogon/calc';
import { applyBoost } from '../../utils';
import { hasLifeSavingItem } from '../../moveScoring';
import { getRecovery, getRecoil } from '@smogon/calc/dist/desc';
import { MoveResult } from '../../moveScoring.contracts';
import { RNGStrategy } from '../../../configuration';

export function executeMove(gen: I.Generation, attacker: Pokemon, defender: Pokemon, moveResult: MoveResult, rng: RNGStrategy): { attacker: Pokemon, defender: Pokemon } {
	let boosts = getBoosts(attacker, defender, moveResult.move);
	const attackerLostItem = consumesAttackerItem(attacker, moveResult.move);
	const defenderLostItem = consumesDefenderItem(defender, moveResult.move);

	const recovery = getRecovery(gen, attacker, defender, moveResult.move, moveResult.highestRollDamage);
	// TODO: recoil
	const recoil = getRecoil(gen, attacker, defender, moveResult.move, moveResult.highestRollDamage);
	
	attacker = attacker.clone({ 
		boosts: boosts.attacker,
		item: !attackerLostItem ? attacker.item: undefined,
		curHP: Math.min(attacker.maxHP(), attacker.curHP() + recovery.recovery[0]),
		abilityOn: attacker.abilityOn || (attackerLostItem && attacker.hasAbility('Unburden'))
	});

	if (attacker.hasAbility('Libero') || attacker.hasAbility('Protean'))
		attacker.types = [moveResult.move.type];

	defender = defender.clone({ 
		curHP: Math.max(0, defender.curHP() - rng.getDamageRoll(moveResult), hasLifeSavingItem(defender) && defenderLostItem && moveResult.move.hits < 2 ? 1 : 0),
		item: !defenderLostItem ? defender.item: undefined,
		boosts: boosts.defender,
		abilityOn: defender.abilityOn || (defenderLostItem && defender.hasAbility('Unburden'))
	});

	return { attacker, defender };
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
	}

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