/**
 * Example: How to integrate the MoveResultGroup component into the application
 * 
 * This file demonstrates how to render the React component in place of the 
 * existing HTML move-result-subgroup elements.
 * 
 * Left component is CONTROLLED - manages selection via state
 * Right component is UNCONTROLLED - manages its own internal state
 */

import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MoveResultGroup, MoveItem } from './index';

// Store roots for potential cleanup/updates
let leftRoot: Root | null = null;
let rightRoot: Root | null = null;

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

/**
 * Wrapper component to demonstrate CONTROLLED usage (left side)
 */
const ControlledMoveResultGroup: React.FC = () => {
	const [selectedMoveId, setSelectedMoveId] = React.useState<string>('resultMoveL1');

	return (
		<MoveResultGroup
			headerId="resultHeaderL"
			headerText="Pokémon 1's Moves (select one to show detailed results) - CONTROLLED"
			radioGroupName="resultMoveL"
			moves={leftMoves}
			selectedMoveId={selectedMoveId}
			onMoveSelect={(moveId: string) => {
				console.log('Selected move on left (controlled):', moveId);
				setSelectedMoveId(moveId);
			}}
		/>
	);
};

/**
 * Example function to replace the HTML move-result-subgroup with React component
 * 
 * Call this function after the page loads to replace the static HTML with 
 * the interactive React component.
 */
export function initializeMoveResultGroups(): void {
	// Find the existing move-result-subgroup containers
	const leftContainer = document.querySelector('.move-result-subgroup[aria-labelledby="resultHeaderL"]');
	const rightContainer = document.querySelector('.move-result-subgroup[aria-labelledby="resultHeaderR"]');

	// Render left side component (CONTROLLED)
	if (leftContainer) {
		if (!leftRoot) {
			leftRoot = createRoot(leftContainer);
		}
		leftRoot.render(<ControlledMoveResultGroup />);
	}

	// Render right side component (UNCONTROLLED)
	if (rightContainer) {
		if (!rightRoot) {
			rightRoot = createRoot(rightContainer);
		}
		rightRoot.render(
			<MoveResultGroup
				headerId="resultHeaderR"
				headerText="Pokémon 2's Moves (select one to show detailed results) - UNCONTROLLED"
				radioGroupName="resultMoveR"
				moves={rightMoves}
				onMoveSelect={(moveId: string) => {
					console.log('Selected move on right (uncontrolled):', moveId);
				}}
			/>
		);
	}
}
