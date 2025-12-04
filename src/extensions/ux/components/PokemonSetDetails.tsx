import { Input, Label, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components';
import { Pokemon } from '@smogon/calc';
import * as React from 'react';
import { gen } from '../../configuration';
import { IVRecord, PokemonSet } from '../../core/storage.contracts';
import { convertIVsFromCustomSetToPokemon } from '../../simulator/utils';

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
}

/**
 * PokemonSetDetails component - renders a table of IVs for the selected Pokemon set
 */
export const PokemonSetDetails: React.FC<PokemonSetDetailsProps> = ({ 
  label,
  speciesSet
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
    }
  }, [pokemon]);

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

  const stats = [
    { key: 'hp' as const, label: 'HP' },
    { key: 'at' as const, label: 'Attack' },
    { key: 'df' as const, label: 'Defense' },
    { key: 'sa' as const, label: 'Sp. Atk' },
    { key: 'sd' as const, label: 'Sp. Def' },
    { key: 'sp' as const, label: 'Speed' },
  ];

  return (
    <div style={{ padding: '10px' }}>
      <Label size="large" weight="semibold">{label}</Label>
      <Table aria-label={`${label} IVs`} style={{ marginTop: '10px' }}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Stat</TableHeaderCell>
            <TableHeaderCell>IVs</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map(({ key, label: statLabel }) => (
            <TableRow key={key}>
              <TableCell>{statLabel}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  max={31}
                  value={ivs[key]?.toString() ?? '31'}
                  onChange={(e) => handleIvChange(key, e.target.value)}
                  style={{ width: '80px' }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
