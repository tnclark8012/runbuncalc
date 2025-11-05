/**
 * Example: How to integrate the MoveResultGroup component into the application
 * 
 * This file demonstrates how to render the React component in place of the 
 * existing HTML move-result-subgroup elements.
 */

import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MoveResultGroup, MoveItem } from './index';

// Store roots for potential cleanup/updates
let leftRoot: Root | null = null;
let rightRoot: Root | null = null;

/**
 * Example function to replace the HTML move-result-subgroup with React component
 * 
 * Call this function after the page loads to replace the static HTML with 
 * the interactive React component.
 */
export function initializeMoveResultGroups(): void {
	// Example data for left side (Pokemon 1)
	const leftMoves: MoveItem[] = [
		{
			id: 'resultMoveL1',
			name: 'Dazzling Gleam',
			damageRange: '259 - 306',
			damagePercent: '1126 - 1330.4%',
			position: 'top',
			defaultChecked: true,
		},
		{
			id: 'resultMoveL2',
			name: 'Stored Power',
			damageRange: '191 - 226',
			damagePercent: '191 - 226%',
			position: 'mid',
		},
		{
			id: 'resultMoveL3',
			name: 'Acid Armor',
			damageRange: '0 - 0',
			damagePercent: '0 - 0%',
			position: 'mid',
		},
		{
			id: 'resultMoveL4',
			name: 'Recover',
			damageRange: '0 - 0',
			damagePercent: '0 - 0%',
			position: 'bottom',
		},
	];

	// Example data for right side (Pokemon 2)
	const rightMoves: MoveItem[] = [
		{
			id: 'resultMoveR1',
			name: 'Tackle',
			damageRange: '10 - 15',
			damagePercent: '0.9 - 2.9%',
			position: 'top',
		},
		{
			id: 'resultMoveR2',
			name: 'Bite',
			damageRange: '8 - 12',
			damagePercent: '0.9 - 0.9%',
			position: 'mid',
		},
		{
			id: 'resultMoveR3',
			name: 'Sand Attack',
			damageRange: '0 - 0',
			damagePercent: '0 - 0%',
			position: 'mid',
		},
		{
			id: 'resultMoveR4',
			name: '(No Move)',
			damageRange: '0 - 0',
			damagePercent: '0 - 0%',
			position: 'bottom',
		},
	];

	// Find the existing move-result-subgroup containers
	const leftContainer = document.querySelector('.move-result-subgroup[aria-labelledby="resultHeaderL"]');
	const rightContainer = document.querySelector('.move-result-subgroup[aria-labelledby="resultHeaderR"]');

	// Render left side component
	if (leftContainer) {
		if (!leftRoot) {
			leftRoot = createRoot(leftContainer);
		}
		leftRoot.render(
			<MoveResultGroup
				headerId="resultHeaderL"
				headerText="Pokémon 1's Moves (select one to show detailed results)"
				radioGroupName="resultMove"
				moves={leftMoves}
				onMoveSelect={(moveId: string) => {
					console.log('Selected move on left:', moveId);
					// Add your move selection logic here
					// For example: updateDamageCalculation(moveId);
				}}
			/>
		);
	}

	// Render right side component
	if (rightContainer) {
		if (!rightRoot) {
			rightRoot = createRoot(rightContainer);
		}
		rightRoot.render(
			<MoveResultGroup
				headerId="resultHeaderR"
				headerText="Pokémon 2's Moves (select one to show detailed results)"
				radioGroupName="resultMove"
				moves={rightMoves}
				onMoveSelect={(moveId: string) => {
					console.log('Selected move on right:', moveId);
					// Add your move selection logic here
				}}
			/>
		);
	}
}

/**
 * Example: Updating moves dynamically
 * 
 * This function shows how to update the moves list when the Pokemon changes
 */
export function updateMoves(side: 'left' | 'right', moves: MoveItem[]): void {
	const headerId = side === 'left' ? 'resultHeaderL' : 'resultHeaderR';
	const headerText = side === 'left' 
		? "Pokémon 1's Moves (select one to show detailed results)"
		: "Pokémon 2's Moves (select one to show detailed results)";
	const container = document.querySelector(`.move-result-subgroup[aria-labelledby="${headerId}"]`);

	if (container) {
		const root = side === 'left' 
			? (leftRoot || (leftRoot = createRoot(container)))
			: (rightRoot || (rightRoot = createRoot(container)));

		root.render(
			<MoveResultGroup
				headerId={headerId}
				headerText={headerText}
				radioGroupName="resultMove"
				moves={moves}
				onMoveSelect={(moveId: string) => {
					console.log(`Selected move on ${side}:`, moveId);
				}}
			/>
		);
	}
}

// To use this in the application, add to your main initialization:
// import { initializeMoveResultGroups } from './extensions/ux/components/example-usage';
// document.addEventListener('DOMContentLoaded', () => {
//   initializeMoveResultGroups();
// });
