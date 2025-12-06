import { Label, Radio, RadioGroup } from '@fluentui/react-components';
import * as React from 'react';
import { MoveItem, MoveResultGroupProps } from './move-result-group.props';

/**
 * MoveResultGroup component - renders a radio group containing each move 
 * and the damage% range it can do to the opponent.
 */
export const MoveResultGroup: React.FC<MoveResultGroupProps> = ({
	headerId,
	headerText,
	radioGroupName,
	moves,
	onMoveSelect,
	selectedMoveId,
}) => {
	// Determine initial selected move
	const getInitialSelectedId = (): string | undefined => {
		if (selectedMoveId !== undefined) {
			return selectedMoveId;
		}
		const defaultMove = moves.find(m => m.defaultChecked);
		return defaultMove ? defaultMove.id : (moves.length > 0 ? moves[0].id : undefined);
	};

	// Use internal state only when component is uncontrolled (no selectedMoveId prop)
	const [internalSelectedId, setInternalSelectedId] = React.useState<string | undefined>(getInitialSelectedId);

	// Determine which ID is currently selected (controlled prop takes precedence)
	const currentSelectedId = selectedMoveId !== undefined ? selectedMoveId : internalSelectedId;

	// Update selected move when selection changes
	const handleMoveChange = React.useCallback((_ev: React.FormEvent<HTMLDivElement>, data: { value: string }) => {
		const moveId = data.value;
		// Update internal state only if uncontrolled
		if (selectedMoveId === undefined) {
			setInternalSelectedId(moveId);
		}
		// Always call the callback if provided
		if (onMoveSelect) {
			onMoveSelect(moveId);
		}
	}, [selectedMoveId, onMoveSelect]);

	return (
		<div className="move-result-subgroup">
			<div className="result-move-header">
				<Label id={headerId}>{headerText}</Label>
			</div>
			<RadioGroup
				name={radioGroupName}
				value={currentSelectedId}
				onChange={handleMoveChange}
				aria-labelledby={headerId}
			>
				{moves.map((move: MoveItem) => (
					<Radio
						key={move.id}
						value={move.id}
						disabled={move.name === 'No move'}
						label={
							<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
								<span>{move.label || move.name}</span>
								<span style={{ marginLeft: '1rem' }}>{move.damagePercent}</span>
							</div>
						}
					/>
				))}
			</RadioGroup>
		</div>
	);
};

export default MoveResultGroup;
