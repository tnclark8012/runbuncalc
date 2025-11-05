import * as React from 'react';
import { Label } from '@fluentui/react';
import { MoveResultGroupProps, MoveItem } from './move-result-group.props';

/**
 * MoveResultGroup component - renders a radio group containing each move 
 * and the damage% range it can do to the opponent.
 * 
 * This component preserves the original HTML structure while using React and Fluent UI.
 */
export const MoveResultGroup: React.FC<MoveResultGroupProps> = ({
	headerId,
	headerText,
	radioGroupName,
	moves,
	onMoveSelect,
	selectedMoveId,
}) => {
	// Determine which move should be selected
	const getSelectedId = React.useCallback((): string | undefined => {
		if (selectedMoveId) {
			return selectedMoveId;
		}
		const defaultMove = moves.find(m => m.defaultChecked);
		return defaultMove ? defaultMove.id : (moves.length > 0 ? moves[0].id : undefined);
	}, [selectedMoveId, moves]);

	const [selectedId, setSelectedId] = React.useState<string | undefined>(getSelectedId);

	// Update selected move when selection changes
	const handleMoveChange = React.useCallback((moveId: string) => {
		setSelectedId(moveId);
		if (onMoveSelect) {
			onMoveSelect(moveId);
		}
	}, [onMoveSelect]);

	// Extract the suffix from the move ID for the damage span ID (e.g., "L1" from "resultMoveL1")
	const getDamageId = (moveId: string): string => {
		return `resultDamage${moveId.replace('resultMove', '')}`;
	};

	return (
		<div 
			className="move-result-subgroup" 
			role="radiogroup" 
			aria-labelledby={headerId}
		>
			<div className="result-move-header">
				<Label id={headerId}>{headerText}</Label>
			</div>
			{moves.map((move: MoveItem) => (
				<div key={move.id}>
					<input 
						className="result-move visually-hidden" 
						type="radio" 
						name={radioGroupName} 
						id={move.id}
						checked={selectedId === move.id}
						onChange={() => handleMoveChange(move.id)}
						aria-describedby={getDamageId(move.id)}
					/>
					<label 
						className={`btn btn-xxxwide btn-${move.position}`} 
						htmlFor={move.id}
					>
						{move.name}
					</label>
					<span id={getDamageId(move.id)}>
						{move.damagePercent}
					</span>
				</div>
			))}
		</div>
	);
};

export default MoveResultGroup;
