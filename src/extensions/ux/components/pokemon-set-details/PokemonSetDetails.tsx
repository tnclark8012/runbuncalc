import { Dropdown, Input, Label, Option, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components';
import { Pokemon, StatsTable } from '@smogon/calc';
import type { StatusName, TypeName } from '@smogon/calc/dist/data/interface';
import * as React from 'react';
import { gen } from '../../../configuration';
import { IVRecord, PokemonSet } from '../../../core/storage.contracts';
import { applyBoost, convertIVsFromCustomSetToPokemon } from '../../../simulator/utils';
import { getAllAvailableItems, getPlayerAccessibleItems } from '../../items';
import { getAbilitiesForPokemon } from '../../pokedex';
import { HPBar } from './HPBar';

/**
 * Runtime state for a Pokemon (boosts, status, current HP, etc.)
 * These are values that change during battle and aren't part of the base set definition
 */
export interface PokemonState {
  /**
   * Current stat boosts (-6 to +6 for each stat)
   */
  boosts?: Partial<StatsTable>;
  
  /**
   * Current status condition
   */
  status?: StatusName | '';
  
  /**
   * Current HP
   */
  currentHp?: number;
}

export interface PokemonSetDetailsProps {
  /**
   * Label for the details section
   */
  label: string;

  /**
   * Species and set data
   */
  speciesSet?: {
    species: string;
    set: PokemonSet;
  };

  /**
   * Pokemon runtime state (boosts, status, etc.)
   * If provided, component works in controlled mode
   */
  pokemonState?: PokemonState;

  /**
   * Callback when Pokemon state changes (controlled mode)
   */
  onStateChange?: (state: PokemonState) => void;

  /**
   * Whether IVs, nature, and level should be readonly
   */
  readonly?: boolean;

  /**
   * Whether to use player-accessible items only (true) or all items (false)
   */
  usePlayerItems?: boolean;
}

/**
 * PokemonSetDetails component - renders a table of IVs for the selected Pokemon set
 */
export const PokemonSetDetails: React.FC<PokemonSetDetailsProps> = ({ 
  label,
  speciesSet,
  pokemonState,
  onStateChange,
  readonly = false,
  usePlayerItems = true
}) => {
  // Determine if we're in controlled mode
  const isControlled = pokemonState !== undefined && onStateChange !== undefined;

  // State for available abilities
  const [availableAbilities, setAvailableAbilities] = React.useState<string[]>([]);

  // State for ability and item selections
  const [selectedAbility, setSelectedAbility] = React.useState<string>('');
  const [selectedItem, setSelectedItem] = React.useState<string>('');

  // Create Pokemon object from speciesSet
  const pokemon = React.useMemo(() => {
    if (!speciesSet) return undefined;
    
    return new Pokemon(gen, speciesSet.species, {
      level: speciesSet.set.level,
      ability: speciesSet.set.ability,
      abilityOn: true,
      item: speciesSet.set.item || "",
      nature: speciesSet.set.nature,
      ivs: convertIVsFromCustomSetToPokemon(speciesSet.set.ivs),
      evs: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
      moves: speciesSet.set.moves
    });
  }, [speciesSet]);

  // Local state for IV values
  const [ivs, setIvs] = React.useState<IVRecord>({
    hp: 31,
    at: 31,
    df: 31,
    sa: 31,
    sd: 31,
    sp: 31,
  });

  // Local state for boost values (uncontrolled mode)
  const [internalBoosts, setInternalBoosts] = React.useState<Partial<StatsTable>>({
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  });

  // Local state for status (uncontrolled mode)
  const [internalStatus, setInternalStatus] = React.useState<StatusName | ''>('');

  // Local state for current HP (uncontrolled mode)
  const [internalCurrentHp, setInternalCurrentHp] = React.useState<number | undefined>(undefined);

  // Use controlled or uncontrolled state
  const boosts = isControlled ? (pokemonState.boosts ?? {}) : internalBoosts;
  const status = isControlled ? (pokemonState.status ?? '') : internalStatus;
  const currentHp = isControlled ? pokemonState.currentHp : internalCurrentHp;

  // Helper to update state (works in both controlled and uncontrolled mode)
  const updateState = React.useCallback((updates: Partial<PokemonState>) => {
    if (isControlled) {
      onStateChange({ ...pokemonState, ...updates });
    } else {
      if (updates.boosts !== undefined) setInternalBoosts(updates.boosts);
      if (updates.status !== undefined) setInternalStatus(updates.status);
      if (updates.currentHp !== undefined) setInternalCurrentHp(updates.currentHp);
    }
  }, [isControlled, pokemonState, onStateChange]);

  // Local state for editable properties
  const [level, setLevel] = React.useState<number>(100);
  const [type1, setType1] = React.useState<TypeName>('Normal');
  const [type2, setType2] = React.useState<TypeName | undefined>(undefined);
  const [selectedForm, setSelectedForm] = React.useState<string>('');
  const [nature, setNature] = React.useState<string>('Hardy');

  const availableTypes = React.useMemo(() => {
    const types: TypeName[] = [
      'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 
      'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 
      'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
    ];
    return types;
  }, []);

  // Get all available natures with their modifiers
  const availableNatures = React.useMemo(() => {
    const natures: { [name: string]: [string, string] } = {
      Adamant: ['atk', 'spa'],
      Bashful: ['spa', 'spa'],
      Bold: ['def', 'atk'],
      Brave: ['atk', 'spe'],
      Calm: ['spd', 'atk'],
      Careful: ['spd', 'spa'],
      Docile: ['def', 'def'],
      Gentle: ['spd', 'def'],
      Hardy: ['atk', 'atk'],
      Hasty: ['spe', 'def'],
      Impish: ['def', 'spa'],
      Jolly: ['spe', 'spa'],
      Lax: ['def', 'spd'],
      Lonely: ['atk', 'def'],
      Mild: ['spa', 'def'],
      Modest: ['spa', 'atk'],
      Naive: ['spe', 'spd'],
      Naughty: ['atk', 'spd'],
      Quiet: ['spa', 'spe'],
      Quirky: ['spd', 'spd'],
      Rash: ['spa', 'spd'],
      Relaxed: ['def', 'spe'],
      Sassy: ['spd', 'spe'],
      Serious: ['spe', 'spe'],
      Timid: ['spe', 'atk'],
    };

    const statLabels: { [key: string]: string } = {
      atk: 'Atk',
      def: 'Def',
      spa: 'SpA',
      spd: 'SpD',
      spe: 'Spe',
    };

    return Object.keys(natures)
      .sort()
      .map(name => {
        const [plus, minus] = natures[name];
        const isNeutral = plus === minus;
        const label = isNeutral 
          ? name 
          : `${name} (+${statLabels[plus]}, -${statLabels[minus]})`;
        return { name, label };
      });
  }, []);

  // Get all available status conditions
  const availableStatuses = React.useMemo(() => {
    return [
      { value: '', label: 'Healthy' },
      { value: 'brn' as StatusName, label: 'Burned' },
      { value: 'frz' as StatusName, label: 'Frozen' },
      { value: 'par' as StatusName, label: 'Paralyzed' },
      { value: 'psn' as StatusName, label: 'Poisoned' },
      { value: 'slp' as StatusName, label: 'Asleep' },
      { value: 'tox' as StatusName, label: 'Badly Poisoned' },
    ];
  }, []);

  // Get all available items (sorted alphabetically with "None" at the top)
  const availableItems = React.useMemo(() => {
    const items = usePlayerItems ? getPlayerAccessibleItems() : getAllAvailableItems();
    return ['None', ...items.sort()];
  }, [usePlayerItems]);

  // Load abilities when pokemon changes
  React.useEffect(() => {
    if (pokemon) {
      getAbilitiesForPokemon(pokemon).then(abilities => {
        setAvailableAbilities(abilities);
      });
      setSelectedAbility(pokemon.ability!);
      setSelectedItem(pokemon.item || 'None');
    } else {
      setAvailableAbilities([]);
      setSelectedAbility('');
      setSelectedItem('None');
    }
  }, [pokemon]);

  // Update local state when pokemon changes
  React.useEffect(() => {
    if (pokemon?.ivs) {
      setIvs({
        hp: pokemon.ivs.hp ?? 31,
        at: pokemon.ivs.atk ?? 31,
        df: pokemon.ivs.def ?? 31,
        sa: pokemon.ivs.spa ?? 31,
        sd: pokemon.ivs.spd ?? 31,
        sp: pokemon.ivs.spe ?? 31,
      });
      
      // Initialize internal state only if uncontrolled
      if (!isControlled) {
        setInternalBoosts({
          atk: pokemon.boosts.atk ?? 0,
          def: pokemon.boosts.def ?? 0,
          spa: pokemon.boosts.spa ?? 0,
          spd: pokemon.boosts.spd ?? 0,
          spe: pokemon.boosts.spe ?? 0,
        });
        setInternalStatus(pokemon.status);
      }
      
      setLevel(pokemon.level);
      setType1(pokemon.types[0]);
      setType2(pokemon.types[1]);
      setSelectedForm(speciesSet?.species ?? '');
      setNature(pokemon.nature);
    } else {
      // Reset to defaults when no set is selected
      setIvs({
        hp: 31,
        at: 31,
        df: 31,
        sa: 31,
        sd: 31,
        sp: 31,
      });
      
      if (!isControlled) {
        setInternalBoosts({
          atk: 0,
          def: 0,
          spa: 0,
          spd: 0,
          spe: 0,
        });
        setInternalStatus('');
      }
      
      setLevel(100);
      setType1('Normal');
      setType2(undefined);
      setSelectedForm('');
      setNature('Hardy');
    }
  }, [pokemon, speciesSet, isControlled]);

  // Handle IV input changes
  const handleIvChange = (stat: keyof IVRecord, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 31) {
      setIvs((prev) => ({ ...prev, [stat]: numValue }));
    } else if (value === '') {
      // Allow empty string for editing
      setIvs((prev) => ({ ...prev, [stat]: 0 }));
    }
  };

  // Handle boost changes
  const handleBoostChange = (stat: keyof StatsTable, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && pokemon) {
      // Apply the boost to the pokemon object
      applyBoost(pokemon.boosts, stat, numValue - (pokemon.boosts[stat] ?? 0));
      
      const newBoosts = { ...boosts, [stat]: numValue };
      updateState({ boosts: newBoosts });
    }
  };

  // Handle level change
  const handleLevelChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      setLevel(numValue);
      if (pokemon) {
        pokemon.level = numValue;
      }
    }
  };

  // Handle type changes
  const handleType1Change = (_: any, data: any) => {
    const newType = data.optionValue as TypeName;
    setType1(newType);
    if (pokemon) {
      pokemon.types[0] = newType;
    }
  };

  const handleType2Change = (_: any, data: any) => {
    const newType = data.optionValue as TypeName;
    setType2(newType);
    if (pokemon && pokemon.types.length > 1) {
      pokemon.types[1] = newType;
    }
  };

  // Handle form change
  const handleFormChange = (_: any, data: any) => {
    setSelectedForm(data.optionValue ?? '');
    // Form change would require recreating the Pokemon object, which we'll handle later
  };

  // Handle nature change
  const handleNatureChange = (_: any, data: any) => {
    const newNature = data.optionValue ?? 'Hardy';
    setNature(newNature);
    if (pokemon) {
      pokemon.nature = newNature as any;
    }
  };

  // Get the display label for the selected nature
  const selectedNatureLabel = React.useMemo(() => {
    const natureData = availableNatures.find(n => n.name === nature);
    return natureData?.label ?? nature;
  }, [nature, availableNatures]);

  // Handle ability change
  const handleAbilityChange = (_: any, data: any) => {
    const newAbility = data.optionValue ?? '';
    setSelectedAbility(newAbility);
    if (pokemon) {
      pokemon.ability = newAbility as any;
    }
  };

  // Handle item change
  const handleItemChange = (_: any, data: any) => {
    const newItem = data.optionValue ?? 'None';
    setSelectedItem(newItem);
    if (pokemon) {
      pokemon.item = newItem === 'None' ? '' : (newItem as any);
    }
  };

  // Get the display label for the selected status
  const selectedStatusLabel = React.useMemo(() => {
    const statusData = availableStatuses.find(s => s.value === status);
    return statusData?.label ?? 'Healthy';
  }, [status, availableStatuses]);

  // Handle status change
  const handleStatusChange = (_: any, data: any) => {
    const newStatus = data.optionValue as StatusName | '';
    updateState({ status: newStatus });
    if (pokemon) {
      pokemon.status = newStatus;
    }
  };

  // Handle HP change
  const handleHpChange = React.useCallback((newHp: number) => {
    updateState({ currentHp: newHp });
  }, [updateState]);

  // Get available forms
  const availableForms = React.useMemo(() => {
    if (!pokemon?.species.otherFormes) return [];
    return [pokemon.species.name, ...pokemon.species.otherFormes];
  }, [pokemon]);

  // Generate boost options from -6 to +6
  const boostOptions = Array.from({ length: 13 }, (_, i) => i - 6);
  const stats = [
    { key: 'hp' as const, label: 'HP', boostKey: undefined },
    { key: 'at' as const, label: 'Attack', boostKey: 'atk' as keyof StatsTable },
    { key: 'df' as const, label: 'Defense', boostKey: 'def' as keyof StatsTable },
    { key: 'sa' as const, label: 'Sp. Atk', boostKey: 'spa' as keyof StatsTable },
    { key: 'sd' as const, label: 'Sp. Def', boostKey: 'spd' as keyof StatsTable },
    { key: 'sp' as const, label: 'Speed', boostKey: 'spe' as keyof StatsTable },
  ];

  return (
    <div style={{ padding: '10px' }}>
      <Label size="large" weight="semibold">{label}</Label>
      
      {/* Type controls */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Label style={{ minWidth: '60px' }}>Type:</Label>
        <Dropdown
          value={type1}
          selectedOptions={[type1]}
          onOptionSelect={handleType1Change}
          style={{ width: '120px' }}
        >
          {availableTypes.map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Dropdown>
        {type2 && (
          <Dropdown
            value={type2}
            selectedOptions={[type2]}
            onOptionSelect={handleType2Change}
            style={{ width: '120px' }}
          >
            {availableTypes.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Dropdown>
        )}
      </div>

      {/* Form control */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', visibility: availableForms.length > 0 ? 'visible' : 'hidden' }}>
        <Label style={{ minWidth: '60px' }}>Form:</Label>
        {availableForms.length > 0 ? (
          <Dropdown
            value={selectedForm}
            selectedOptions={[selectedForm]}
            onOptionSelect={handleFormChange}
            style={{ width: '250px' }}
          >
            {availableForms.map((form) => (
              <Option key={form} value={form}>
                {form}
              </Option>
            ))}
          </Dropdown>
        ) : (
          <div style={{ width: '250px' }}>
            <Dropdown disabled style={{ width: '250px' }}>
              <Option value="">-</Option>
            </Dropdown>
          </div>
        )}
      </div>

      {/* Level control */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Label style={{ minWidth: '60px' }}>Level:</Label>
        <Input
          type="number"
          min={1}
          max={100}
          value={level.toString()}
          onChange={(e) => handleLevelChange(e.target.value)}
          readOnly={readonly}
          style={{ width: '80px' }}
        />
      </div>

      <Table aria-label={`${label} IVs`} style={{ marginTop: '10px' }}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Stat</TableHeaderCell>
            <TableHeaderCell>IVs</TableHeaderCell>
            <TableHeaderCell>Boosts</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map(({ key, label: statLabel, boostKey }) => (
            <TableRow key={key}>
              <TableCell>{statLabel}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  max={31}
                  value={ivs[key]?.toString() ?? '31'}
                  onChange={(e) => handleIvChange(key, e.target.value)}
                  readOnly={readonly}
                  style={{ width: '80px' }}
                />
              </TableCell>
              <TableCell>
                {boostKey ? (
                  <Dropdown
                    value={boosts[boostKey]?.toString() ?? '0'}
                    selectedOptions={[boosts[boostKey]?.toString() ?? '0']}
                    onOptionSelect={(_, data) => handleBoostChange(boostKey, data.optionValue ?? '0')}
                    style={{ width: '60px', minWidth: '60px' }}
                  >
                    {boostOptions.map((boost) => (
                      <Option key={boost} value={boost.toString()}>
                        {boost > 0 ? `+${boost}` : boost.toString()}
                      </Option>
                    ))}
                  </Dropdown>
                ) : (
                  <span>—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Nature control */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Label style={{ minWidth: '60px' }}>Nature:</Label>
        <Dropdown
          value={selectedNatureLabel}
          selectedOptions={[nature]}
          onOptionSelect={handleNatureChange}
          disabled={readonly}
          style={{ width: '250px' }}
        >
          {availableNatures.map(({ name, label }) => (
            <Option key={name} value={name}>
              {label}
            </Option>
          ))}
        </Dropdown>
      </div>

      {/* Ability control */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Label style={{ minWidth: '60px' }}>Ability:</Label>
        <Dropdown
          value={selectedAbility}
          selectedOptions={[selectedAbility]}
          onOptionSelect={handleAbilityChange}
          disabled={readonly || availableAbilities.length === 0}
          style={{ width: '250px' }}
        >
          {availableAbilities.map((ability) => (
            <Option key={ability} value={ability}>
              {ability}
            </Option>
          ))}
        </Dropdown>
      </div>

      {/* Item control */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Label style={{ minWidth: '60px' }}>Item:</Label>
        <Dropdown
          value={selectedItem}
          selectedOptions={[selectedItem]}
          onOptionSelect={handleItemChange}
          style={{ width: '250px' }}
        >
          {availableItems.map((item) => (
            <Option key={item} value={item}>
              {item}
            </Option>
          ))}
        </Dropdown>
      </div>

      {/* Status control */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Label style={{ minWidth: '60px' }}>Status:</Label>
        <Dropdown
          value={selectedStatusLabel}
          selectedOptions={[status]}
          onOptionSelect={handleStatusChange}
          style={{ width: '250px' }}
        >
          {availableStatuses.map(({ value, label }) => (
            <Option key={value || 'healthy'} value={value}>
              {label}
            </Option>
          ))}
        </Dropdown>
      </div>

      {/* HP control and health bar */}
      {pokemon && (
        <HPBar
          currentHp={currentHp ?? pokemon.maxHP()}
          maxHp={pokemon.maxHP()}
          onHpChange={handleHpChange}
          disabled={!pokemon}
        />
      )}
    </div>
  );
};
