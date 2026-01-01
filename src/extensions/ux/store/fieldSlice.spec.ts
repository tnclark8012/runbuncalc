import { Terrain, Weather } from '@smogon/calc/dist/data/interface';
import fieldReducer, {
  clearFieldState,
  FieldState,
  setCpuSideField,
  setPlayerSideField,
  setTerrain,
  setTrickRoom,
  setWeather,
} from './fieldSlice';
import { setTrainerIndex } from './trainerSlice';

describe('fieldSlice', () => {
  const initialState: FieldState = {
    terrain: undefined,
    weather: undefined,
    isTrickRoom: false,
    playerSide: {
      isLightScreen: false,
      isReflect: false,
      isAuroraVeil: false,
      isTailwind: false,
      isSR: false,
      spikes: 0,
    },
    cpuSide: {
      isLightScreen: false,
      isReflect: false,
      isAuroraVeil: false,
      isTailwind: false,
      isSR: false,
      spikes: 0,
    },
  };

  it('should return the initial state', () => {
    expect(fieldReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('terrain', () => {
    it('should set terrain', () => {
      const terrain: Terrain = 'Electric';
      const actual = fieldReducer(initialState, setTerrain(terrain));
      expect(actual.terrain).toEqual(terrain);
    });

    it('should clear terrain', () => {
      const state = { ...initialState, terrain: 'Grassy' as Terrain };
      const actual = fieldReducer(state, setTerrain(undefined));
      expect(actual.terrain).toBeUndefined();
    });
  });

  describe('weather', () => {
    it('should set weather', () => {
      const weather: Weather = 'Sun';
      const actual = fieldReducer(initialState, setWeather(weather));
      expect(actual.weather).toEqual(weather);
    });

    it('should clear weather', () => {
      const state = { ...initialState, weather: 'Rain' as Weather };
      const actual = fieldReducer(state, setWeather(undefined));
      expect(actual.weather).toBeUndefined();
    });
  });

  describe('trick room', () => {
    it('should set trick room', () => {
      const actual = fieldReducer(initialState, setTrickRoom(true));
      expect(actual.isTrickRoom).toBe(true);
    });

    it('should clear trick room', () => {
      const state = { ...initialState, isTrickRoom: true };
      const actual = fieldReducer(state, setTrickRoom(false));
      expect(actual.isTrickRoom).toBe(false);
    });
  });

  describe('player side', () => {
    it('should set player side light screen', () => {
      const actual = fieldReducer(initialState, setPlayerSideField({ isLightScreen: true }));
      expect(actual.playerSide.isLightScreen).toBe(true);
    });

    it('should set player side spikes', () => {
      const actual = fieldReducer(initialState, setPlayerSideField({ spikes: 3 }));
      expect(actual.playerSide.spikes).toBe(3);
    });

    it('should set multiple player side fields', () => {
      const actual = fieldReducer(initialState, setPlayerSideField({ 
        isLightScreen: true, 
        isReflect: true,
        spikes: 2,
      }));
      expect(actual.playerSide.isLightScreen).toBe(true);
      expect(actual.playerSide.isReflect).toBe(true);
      expect(actual.playerSide.spikes).toBe(2);
    });
  });

  describe('cpu side', () => {
    it('should set cpu side reflect', () => {
      const actual = fieldReducer(initialState, setCpuSideField({ isReflect: true }));
      expect(actual.cpuSide.isReflect).toBe(true);
    });

    it('should set cpu side stealth rocks', () => {
      const actual = fieldReducer(initialState, setCpuSideField({ isSR: true }));
      expect(actual.cpuSide.isSR).toBe(true);
    });
  });

  describe('clearFieldState', () => {
    it('should clear all field state', () => {
      const state: FieldState = {
        terrain: 'Psychic',
        weather: 'Hail',
        isTrickRoom: true,
        playerSide: {
          isLightScreen: true,
          isReflect: true,
          isAuroraVeil: true,
          isTailwind: true,
          isSR: true,
          spikes: 3,
        },
        cpuSide: {
          isLightScreen: true,
          isReflect: true,
          isAuroraVeil: true,
          isTailwind: true,
          isSR: true,
          spikes: 2,
        },
      };

      const actual = fieldReducer(state, clearFieldState());
      expect(actual).toEqual(initialState);
    });
  });

  describe('trainer navigation', () => {
    const stateWithConfig: FieldState = {
      terrain: 'Misty',
      weather: 'Sand',
      isTrickRoom: true,
      playerSide: {
        isLightScreen: true,
        isReflect: false,
        isAuroraVeil: false,
        isTailwind: true,
        isSR: true,
        spikes: 1,
      },
      cpuSide: {
        isLightScreen: false,
        isReflect: true,
        isAuroraVeil: false,
        isTailwind: false,
        isSR: true,
        spikes: 2,
      },
    };

    it('should clear field state when trainer index changes', () => {
      const actual = fieldReducer(stateWithConfig, setTrainerIndex(5));
      expect(actual).toEqual(initialState);
    });
  });
});
