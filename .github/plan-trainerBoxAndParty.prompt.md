# Plan: Implement TrainerBox and TrainerParty Components

This plan adds Pokemon party management and box visualization to the battle simulator, allowing players to organize their team and select Pokemon for battle.

## Steps

### 1. Create Redux slice for party management
**File**: `src/extensions/ux/store/partySlice.ts`

- Add state: `playerParty: string[]` (array of Pokemon IDs: `"species (setName)"`)
- Add actions: `promoteToParty(pokemonId)`, `demoteToBox(pokemonId)`, `loadPlayerParty(party)`
- Call existing `addToParty()` and `removeFromParty()` from `src/extensions/core/storage.ts` to persist immediately
- Add to `RootState` in `src/extensions/ux/store/store.ts` and configure redux-persist

### 2. Create PokemonCard component
**File**: `src/extensions/ux/components/trainer-management/PokemonCard.tsx`

- Props: `species: string`, `setName: string`, `isSelected: boolean`, `onClick: () => void`, `size?: 'small' | 'medium'`
- Small: 40x30px for box, Medium: larger for party (60x45px)
- Image src: `https://raw.githubusercontent.com/May8th1995/sprites/master/${species}.png`
- Fallback: Fluent UI `Avatar` with first letter of species name on image error
- Visual selection state (border/highlight when `isSelected`)
- Tooltip showing `${species} (${setName})`

### 3. Create TrainerParty component
**File**: `src/extensions/ux/components/trainer-management/TrainerParty.tsx`

- Props: 
  - `party: string[]`
  - `availableSets: CustomSets`
  - `selectedPokemonId?: string`
  - `onPokemonClick: (species, setName) => void`
  - `showPromoteButton?: boolean`
  - `onPromoteClick?: () => void`
  - `onDemoteClick?: () => void`
  - `isSelectedInBox?: boolean`
- Horizontal flex layout with unlimited slots (not fixed to 6)
- Empty state shows "No Pokemon in party" message
- Each slot shows `PokemonCard` (medium size)
- Parse Pokemon ID to get species/setName using existing format
- Container with red border if `party.length > 6` (warning state)

### 4. Create TrainerBox component
**File**: `src/extensions/ux/components/trainer-management/TrainerBox.tsx`

- Props: 
  - `availableSets: CustomSets`
  - `party: string[]`
  - `selectedPokemonId?: string`
  - `onPokemonClick: (species, setName) => void`
- CSS Grid: `display: grid; grid-template-columns: repeat(auto-fill, 40px); gap: 4px;`
- Filter out Pokemon in party: all Pokemon from `availableSets` NOT in `party` array
- Each cell shows `PokemonCard` (small size)
- Empty state shows "All Pokemon in party" message

### 5. Create connected components
**File**: `src/extensions/ux/components/trainer-management/trainer-management-usage.tsx`

**PlayerPartyManager**: 
- Connects to Redux `partySlice.playerParty` and `setSlice.player`
- Renders promote/demote button (Fluent UI `Button`) to left of `TrainerParty`
- Button: Green `+` icon if selected Pokemon in box, Red `−` icon if in party
- Clicking Pokemon calls `setPlayerSet({ species, setName })`
- Button click dispatches `promoteToParty()` or `demoteToBox()` actions

**CpuPartyManager**:
- Reads CPU party from `setSlice.cpu.availableSets` (all trainer's Pokemon)
- No promote/demote button, just displays `TrainerParty`
- Eventually will read from trainer ID state

**PlayerBoxManager**:
- Connects `TrainerBox` to Redux
- Filters box Pokemon based on `partySlice.playerParty`

### 6. Integrate into SandboxApp
**File**: `src/sandbox/SandboxApp.tsx`

- Initialize party on mount: `store.dispatch(loadPlayerParty(getParty()))`
- Layout order for player side:
  - `PlayerSetSelector`
  - `PlayerPokemonSetDetails`
  - `PlayerPartyManager` (button + TrainerParty)
  - `PlayerBoxManager` (TrainerBox)
- Layout for CPU side:
  - `CpuSetSelector`
  - `CpuPokemonSetDetails`
  - `CpuPartyManager` (TrainerParty only, no box)
- Add CSS for party warning: `.party-container.over-limit { border: 2px solid red; }`

## Decisions Made

1. **Interaction pattern**: Click + button (not drag-and-drop for now)
2. **Party size**: Allow any number (including 0), outline party in red if > 6
3. **Missing sprites**: Show first letter of species name using Fluent UI Avatar
4. **CPU party**: Show entire trainer's party (will add prev/next trainer buttons later)
5. **Persistence**: Save immediately to localStorage when toggling party/box

## Further Considerations

1. **CPU Trainer navigation**: Future enhancement will add prev/next trainer buttons. Should we create a `cpuTrainerId` state now in preparation? **Recommendation**: Yes, add `cpuTrainerId: number` to Redux store (default to current trainer), use `getTrainerNameByIndex()` to load trainer data.

2. **BattleFieldState snapshot**: When ready to implement, create a selector function that combines: player party + player set details state + CPU party + CPU set details state into a single snapshot object. **Recommendation**: Add `src/extensions/ux/store/selectors.ts` with `selectBattleFieldState()` function.

3. **Party order persistence**: Should party order be preserved, or just the set of Pokemon? **Recommendation**: Preserve order since `getParty()` returns `string[]` (ordered array).

4. **Sprite loading performance**: With potentially 100+ Pokemon in box, should we lazy load images? **Recommendation**: Use native `loading="lazy"` on `<img>` tags for automatic lazy loading.
