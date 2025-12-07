import { Pokemon } from '@smogon/calc';
import { gen } from '../../configuration';
import { selectBattleFieldState } from './battleFieldStateSelector';
import { RootState } from './store';

// Mock the trainer sets module to provide test data
jest.mock('../../trainer-sets', () => ({
  getTrainerNameByTrainerIndex: jest.fn(() => 'Test Trainer'),
  OpposingTrainer: jest.fn((trainerName: string) => {
    // Return a simple test Pokemon array
    const testPokemon = new (require('@smogon/calc').Pokemon)(
      require('../../configuration').gen,
      'Starly',
      {
        level: 20,
        ability: 'Intimidate',
        item: '',
        nature: 'Adamant',
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        moves: ['Wing Attack', 'Quick Attack'],
      }
    );
    return [testPokemon];
  }),
}));

// Mock getPokemonId to return the correct format
jest.mock('../../core/storage', () => ({
  getPokemonId: jest.fn((species: string, setName: string) => `${species} (${setName})`),
}));

describe('selectBattleFieldState', () => {
  // Helper function to create a minimal RootState for testing
  const createMockState = (options: {
    playerSelection?: { species: string; setName: string };
    cpuSelection?: { species: string; setName: string };
    playerParty?: string[];
    playerSets?: any;
    cpuSets?: any;
    currentTrainerIndex?: number;
  }): RootState => {
    return {
      set: {
        player: {
          selection: options.playerSelection,
          availableSets: options.playerSets || {},
        },
        cpu: {
          selection: options.cpuSelection,
          availableSets: options.cpuSets || {},
        },
      },
      party: {
        playerParty: options.playerParty || [],
      },
      trainer: {
        currentTrainerIndex: options.currentTrainerIndex || 0,
      },
      pokemonState: {
        player: {},
        cpu: {},
      },
      move: {
        plannedPlayerActions: [],
      },
    } as unknown as RootState;
  };

  // Sample Pokemon set
  const pikachuSet = {
    level: 25,
    ability: 'Static',
    item: 'Light Ball',
    nature: 'Jolly',
    ivs: { hp: 31, at: 31, df: 31, sa: 31, sd: 31, sp: 31 },
    moves: ['Thunderbolt', 'Quick Attack'],
  };

  const starlySet = {
    level: 20,
    ability: 'Intimidate',
    item: '',
    nature: 'Adamant',
    ivs: { hp: 31, at: 31, df: 31, sa: 31, sd: 31, sp: 31 },
    moves: ['Wing Attack', 'Quick Attack'],
  };

  describe('when player-selected Pokemon is in the party', () => {
    it('should set the selected Pokemon as active and remove it from party', () => {
      const state = createMockState({
        playerSelection: { species: 'Pikachu', setName: 'Test Set' },
        cpuSelection: { species: 'Starly', setName: 'Test Trainer' }, // setName must match trainer name
        playerParty: ['Pikachu (Test Set)', 'Starly (Other Set)'],
        playerSets: {
          Pikachu: { 'Test Set': pikachuSet },
          Starly: { 'Other Set': starlySet },
        },
        cpuSets: {
          Starly: { 'CPU Set': starlySet },
        },
      });

      const result = selectBattleFieldState(state);

      expect(result).toBeDefined();
      expect(result!.player.active).toHaveLength(1);
      expect(result!.player.active[0].pokemon.species.name).toBe('Pikachu');
      // Party should have the remaining Pokemon (Starly)
      expect(result!.player.party).toHaveLength(1);
      expect(result!.player.party[0].species.name).toBe('Starly');
    });

    it('should handle a party with multiple Pokemon', () => {
      const state = createMockState({
        playerSelection: { species: 'Pikachu', setName: 'Test Set' },
        cpuSelection: { species: 'Starly', setName: 'Test Trainer' }, // setName must match trainer name
        playerParty: ['Starly (Other Set)', 'Pikachu (Test Set)', 'Starly (Third Set)'],
        playerSets: {
          Pikachu: { 'Test Set': pikachuSet },
          Starly: { 
            'Other Set': starlySet,
            'Third Set': starlySet,
          },
        },
        cpuSets: {
          Starly: { 'CPU Set': starlySet },
        },
      });

      const result = selectBattleFieldState(state);

      expect(result).toBeDefined();
      expect(result!.player.active[0].pokemon.species.name).toBe('Pikachu');
      // Party should have 2 remaining Pokemon
      expect(result!.player.party).toHaveLength(2);
      expect(result!.player.party[0].species.name).toBe('Starly');
      expect(result!.player.party[1].species.name).toBe('Starly');
    });
  });

  describe('when player-selected Pokemon is NOT in the party', () => {
    it('should set the selected Pokemon as active and party should be empty', () => {
      const state = createMockState({
        playerSelection: { species: 'Pikachu', setName: 'Test Set' },
        cpuSelection: { species: 'Starly', setName: 'Test Trainer' }, // setName must match trainer name
        playerParty: ['Starly (Other Set)'], // Pikachu is not in party
        playerSets: {
          Pikachu: { 'Test Set': pikachuSet },
          Starly: { 'Other Set': starlySet },
        },
        cpuSets: {
          Starly: { 'CPU Set': starlySet },
        },
      });

      const result = selectBattleFieldState(state);

      expect(result).toBeDefined();
      expect(result!.player.active).toHaveLength(1);
      expect(result!.player.active[0].pokemon.species.name).toBe('Pikachu');
      // Party should be empty
      expect(result!.player.party).toHaveLength(0);
    });

    it('should handle empty party when selected Pokemon is not in it', () => {
      const state = createMockState({
        playerSelection: { species: 'Pikachu', setName: 'Test Set' },
        cpuSelection: { species: 'Starly', setName: 'Test Trainer' }, // setName must match trainer name
        playerParty: [], // Empty party
        playerSets: {
          Pikachu: { 'Test Set': pikachuSet },
        },
        cpuSets: {
          Starly: { 'CPU Set': starlySet },
        },
      });

      const result = selectBattleFieldState(state);

      expect(result).toBeDefined();
      expect(result!.player.active[0].pokemon.species.name).toBe('Pikachu');
      // Party should be empty
      expect(result!.player.party).toHaveLength(0);
    });

    it('should return undefined when selected Pokemon set does not exist', () => {
      const state = createMockState({
        playerSelection: { species: 'Pikachu', setName: 'NonExistent Set' },
        cpuSelection: { species: 'Starly', setName: 'Test Trainer' }, // setName must match trainer name
        playerParty: [],
        playerSets: {
          Pikachu: { 'Test Set': pikachuSet }, // Different set name
        },
        cpuSets: {
          Starly: { 'CPU Set': starlySet },
        },
      });

      const result = selectBattleFieldState(state);

      expect(result).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should return undefined when playerSelection is missing', () => {
      const state = createMockState({
        playerSelection: undefined,
        cpuSelection: { species: 'Starly', setName: 'CPU Set' },
        playerParty: [],
      });

      const result = selectBattleFieldState(state);

      expect(result).toBeUndefined();
    });

    it('should return undefined when cpuSelection is missing', () => {
      const state = createMockState({
        playerSelection: { species: 'Pikachu', setName: 'Test Set' },
        cpuSelection: undefined,
        playerParty: [],
      });

      const result = selectBattleFieldState(state);

      expect(result).toBeUndefined();
    });
  });
});
