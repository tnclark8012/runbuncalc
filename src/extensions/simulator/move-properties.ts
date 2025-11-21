import { Move } from '@smogon/calc';
import { MoveName } from '@smogon/calc/dist/data/interface';

/**
 * Two-turn moves that make the user semi-invulnerable during the charging turn.
 * Examples: Bounce, Fly, Dig, Dive, Phantom Force, Shadow Force
 */
export const SEMI_INVULNERABLE_MOVES: ReadonlySet<MoveName> = new Set<MoveName>([
	'Bounce',
	'Dig',
	'Dive',
	'Fly',
	'Phantom Force',
	'Shadow Force',
	'Sky Drop',
] as MoveName[]);

/**
 * Two-turn moves where the user is visible during the charging turn.
 * Examples: Solar Beam, Skull Bash, Razor Wind, Sky Attack, Geomancy, Freeze Shock, Ice Burn
 */
export const VISIBLE_CHARGE_MOVES: ReadonlySet<MoveName> = new Set<MoveName>([
	'Solar Beam',
	'Solar Blade',
	'Skull Bash',
	'Razor Wind',
	'Sky Attack',
	'Geomancy',
	'Freeze Shock',
	'Ice Burn',
	'Electro Shot',
	'Meteor Beam',
] as MoveName[]);

/**
 * Checks if a move is a two-turn charge move (semi-invulnerable).
 */
export function isSemiInvulnerableMove(moveName: MoveName): boolean {
	return SEMI_INVULNERABLE_MOVES.has(moveName);
}

/**
 * Checks if a move is a two-turn charge move (visible).
 */
export function isVisibleChargeMove(moveName: MoveName): boolean {
	return VISIBLE_CHARGE_MOVES.has(moveName);
}

/**
 * Checks if a move is any type of two-turn charge move.
 */
export function isTwoTurnMove(moveName: MoveName): boolean {
	return isSemiInvulnerableMove(moveName) || isVisibleChargeMove(moveName);
}

/**
 * Checks if a move makes the user invulnerable during charging.
 */
export function makesInvulnerable(moveName: MoveName): boolean {
	return isSemiInvulnerableMove(moveName);
}

export function isContactMove(move: Move): boolean {
	return !!move.flags.contact;
}