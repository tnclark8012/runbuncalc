import { Dropdown, Input, Label, Option, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components';
import { Pokemon, StatsTable } from '@smogon/calc';
import type { StatusName, TypeName } from '@smogon/calc/dist/data/interface';
import * as React from 'react';
import { gen } from '../../configuration';
import { IVRecord, PokemonSet } from '../../core/storage.contracts';
import { applyBoost, convertIVsFromCustomSetToPokemon } from '../../simulator/utils';

export interface PokemonSetDetailsProps {
  /**
   * Label for the details section
   */
  label: string;

  /**
   * Species
   */
  speciesSet?: {
    species: string;
    set: PokemonSet;
  };

  /**
   * Whether IVs, nature, and level should be readonly
   */
  readonly?: boolean;
}

/**
 * PokemonSetDetails component - renders a table of IVs for the selected Pokemon set
 */
export const PokemonSetDetails: React.FC<PokemonSetDetailsProps> = ({ 
  label,
  speciesSet,
  readonly = false
}) => {
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

  // Local state for boost values
  const [boosts, setBoosts] = React.useState<Partial<StatsTable>>({
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  });

  // Local state for editable properties
  const [level, setLevel] = React.useState<number>(100);
  const [type1, setType1] = React.useState<TypeName>('Normal');
  const [type2, setType2] = React.useState<TypeName | undefined>(undefined);
  const [selectedForm, setSelectedForm] = React.useState<string>('');
  const [nature, setNature] = React.useState<string>('Hardy');
  const [status, setStatus] = React.useState<StatusName | ''>('');

  // Get all available types from the generation
  const availableTypes = React.useMemo(() => {
    // Common Pokemon types in Gen 8
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
      setBoosts({
        atk: pokemon.boosts.atk ?? 0,
        def: pokemon.boosts.def ?? 0,
        spa: pokemon.boosts.spa ?? 0,
        spd: pokemon.boosts.spd ?? 0,
        spe: pokemon.boosts.spe ?? 0,
      });
      setLevel(pokemon.level);
      setType1(pokemon.types[0]);
      setType2(pokemon.types[1]);
      setSelectedForm(speciesSet?.species ?? '');
      setNature(pokemon.nature);
      setStatus(pokemon.status);
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
      setBoosts({
        atk: 0,
        def: 0,
        spa: 0,
        spd: 0,
        spe: 0,
      });
      setLevel(100);
      setType1('Normal');
      setType2(undefined);
      setSelectedForm('');
      setNature('Hardy');
      setStatus('');
    }
  }, [pokemon, speciesSet]);

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
      setBoosts((prev) => ({ ...prev, [stat]: numValue }));
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

  // Get the display label for the selected status
  const selectedStatusLabel = React.useMemo(() => {
    const statusData = availableStatuses.find(s => s.value === status);
    return statusData?.label ?? 'Healthy';
  }, [status, availableStatuses]);

  // Handle status change
  const handleStatusChange = (_: any, data: any) => {
    const newStatus = data.optionValue as StatusName | '';
    setStatus(newStatus);
    if (pokemon) {
      pokemon.status = newStatus;
    }
  };

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
    </div>
  );
};
