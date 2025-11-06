# MoveResultGroup Component

A React component for rendering a radio group containing Pokemon moves and their damage percentage ranges.

## Usage

```tsx
import { MoveResultGroup, MoveItem } from './components';

// Define your moves
const moves: MoveItem[] = [
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

// Use the component
<MoveResultGroup
  headerId="resultHeaderL"
  headerText="Pokémon 1's Moves (select one to show detailed results)"
  radioGroupName="resultMove"
  moves={moves}
  onMoveSelect={(moveId) => console.log('Selected move:', moveId)}
  selectedMoveId="resultMoveL1"
/>
```

## Props

### MoveResultGroupProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `headerId` | `string` | Yes | Unique identifier for the radio group (e.g., "resultHeaderL") |
| `headerText` | `string` | Yes | Header text displayed above the move list |
| `radioGroupName` | `string` | Yes | Name attribute for the radio group (all radios share the same name) |
| `moves` | `MoveItem[]` | Yes | Array of moves to display |
| `onMoveSelect` | `(moveId: string) => void` | No | Callback when a move is selected |
| `selectedMoveId` | `string` | No | The currently selected move ID |

### MoveItem

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the move (e.g., "resultMoveL1") |
| `name` | `string` | Yes | Display name of the move |
| `damageRange` | `string` | Yes | Damage percentage range (e.g., "259 - 306") |
| `damagePercent` | `string` | Yes | Damage percentage display (e.g., "1126 - 1330.4%") |
| `position` | `'top' \| 'mid' \| 'bottom'` | Yes | Position in the list for styling |
| `defaultChecked` | `boolean` | No | Whether this move is checked by default |

## Features

- **Accessibility**: Uses semantic HTML with ARIA attributes for screen readers
- **Fluent UI Integration**: Uses Fluent UI's Label component for consistent styling
- **Preserves Original Design**: Maintains the existing CSS classes and structure from the original HTML
- **Type Safety**: Full TypeScript support with strongly-typed props
- **Separation of Concerns**: Props are defined separately in `move-result-group.props.ts`

## Styling

The component uses the existing CSS classes from the main application:
- `.move-result-subgroup` - Container for the radio group
- `.result-move-header` - Header section
- `.result-move` - Radio input (visually hidden)
- `.btn`, `.btn-xxxwide` - Button styling for labels
- `.btn-top`, `.btn-mid`, `.btn-bottom` - Position-specific button styling

## Notes

- The component preserves the original HTML structure to maintain compatibility with existing CSS
- Radio inputs are visually hidden but remain accessible to screen readers
- The component manages its own selection state internally while also supporting controlled behavior via `selectedMoveId` prop
