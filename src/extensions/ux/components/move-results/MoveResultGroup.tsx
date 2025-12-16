import { Label, Radio, RadioGroup } from '@fluentui/react-components';
import * as React from 'react';
import { MoveItem, MoveResultGroupProps } from './move-result-group.props';
import { useStyles } from './MoveResultGroup.styles';

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
	selectedMoveName,
	isFaster = false,
}) => {
	const styles = useStyles();
	
	// Determine initial selected move
	const getInitialSelectedMoveName = (): string | undefined => {
		if (selectedMoveName !== undefined) {
			return selectedMoveName;
		}
		const defaultMove = moves.find(m => m.defaultChecked);
		return defaultMove ? defaultMove.name : (moves.length > 0 ? moves[0].name : undefined);
	};

	// Use internal state only when component is uncontrolled (no selectedMoveName prop)
	const [internalSelectedMoveName, setInternalSelectedMoveName] = React.useState<string | undefined>(getInitialSelectedMoveName);

	// Determine which move is currently selected (controlled prop takes precedence)
	const currentSelectedMoveName = React.useMemo(() => {
		const selectedName = selectedMoveName !== undefined ? selectedMoveName : internalSelectedMoveName;
		if (moves.find(m => m.name === selectedName)) {
			return selectedName;
		}
		else {
			return moves.find(m => m.defaultChecked)?.name;
		}
	}, [moves, selectedMoveName, internalSelectedMoveName]);

	// Update selected move when selection changes
	const handleMoveChange = React.useCallback((_ev: React.FormEvent<HTMLDivElement>, data: { value: string }) => {
		const moveName = data.value;
		// Update internal state only if uncontrolled
		if (selectedMoveName === undefined) {
			setInternalSelectedMoveName(moveName);
		}
		// Always call the callback if provided
		if (onMoveSelect) {
			onMoveSelect(moveName);
		}
	}, [selectedMoveName, onMoveSelect]);

	return (
		<div 
			className={isFaster ? `move-result-subgroup ${styles.fasterContainer}` : 'move-result-subgroup'}
		>
			<div className="result-move-header">
				<Label id={headerId}>{headerText}</Label>
			</div>
			<RadioGroup
				name={radioGroupName}
				value={currentSelectedMoveName}
				onChange={handleMoveChange}
				aria-labelledby={headerId}
			>
				{moves.map((move: MoveItem) => (
					<Radio
						key={move.id}
						value={move.name}
						disabled={move.name === 'No move'}
						label={
							<div className={styles.moveLabel}>
								<span>{move.label || move.name}</span>
								<span className={styles.damagePercent}>{move.damagePercent}</span>
							</div>
						}
					/>
				))}
			</RadioGroup>
		</div>
	);
};

export default MoveResultGroup;
