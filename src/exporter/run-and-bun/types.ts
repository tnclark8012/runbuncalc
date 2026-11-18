export interface NamedId {
  id: number;
  name: string;
}

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  specialAttack: number;
  specialDefense: number;
}

export type PokemonLocation =
  | { kind: 'party' | 'opponent-party'; slot: number }
  | { kind: 'box'; box: number; slot: number };

export interface SnapshotPokemon {
  id: string;
  identity: { personality: number; originalTrainerId: number };
  location: PokemonLocation;
  species: NamedId;
  nickname: string;
  originalTrainerName: string;
  language: number;
  flagsRaw: number;
  isEgg: boolean;
  isBadEgg: boolean;
  heldItem: NamedId | null;
  experience: number;
  level: number;
  friendship: number;
  nature: { id: number; name: string; storedId: number };
  ability: NamedId & { slot: number };
  ivs: Stats;
  evs: Stats;
  moves: { slot: number; move: NamedId | null; pp: number; maxPp: number | null; ppUps: number }[];
  condition: {
    source: 'party-memory' | 'box-withdrawal-derivation';
    hp: number;
    stats: Stats;
    majorStatusRaw: number;
  };
  rawRecord: number[];
}

export interface SnapshotBattler {
  index: number;
  side: 'player' | 'cpu';
  partySlot: number;
  species: NamedId;
  level: number;
  hp: number;
  stats: Stats;
  ability: NamedId;
  heldItem: NamedId | null;
  typeIds: number[];
  statStagesRaw: number[];
  moves: { slot: number; move: NamedId | null; pp: number }[];
  majorStatusRaw: number;
  volatileStatusRaw: number;
  status3Raw: number;
  additionalStatusRaw: number;
  lastUsedMove: NamedId | null;
  lastUsedMoveRaw: number;
  restrictions: {
    encoredMove: NamedId | null;
    encoredMoveSlot: number;
    encoreTurns: number;
    encoreTimerByteRaw: number;
    protectUseCount: number;
    disableTurns: number;
    tauntTurns: number;
    firstTurnOutRaw: number;
    truantPhase: number;
    raw: number[];
  };
  rawRecord: number[];
}

export interface BattleMemory {
  activity: 'unknown';
  phase: 'unknown';
  flagsRaw: number;
  battlerCount: number;
  battlers: SnapshotBattler[];
  opponentParty: SnapshotPokemon[];
  completedTurnsCandidate: number;
  weatherFlagsRaw: number;
  fieldFlagsRaw: number;
  fieldTimers: {
    wonderRoom: number;
    magicRoom: number;
    trickRoom: number;
    gravity: number;
    raw: number[];
  };
  sides: {
    side: 'player' | 'cpu';
    flagsRaw: number;
    timersRaw: number[];
    reflect: number;
    lightScreen: number;
    mist: number;
    safeguard: number;
    spikesLayers: number;
    toxicSpikesLayers: number;
    stealthRockRaw: number;
    stickyWebRaw: number;
    auroraVeil: number;
    tailwind: number;
    luckyChant: number;
  }[];
  ai: {
    resourcesAddress: number;
    thinkingAddress: number;
    cacheAddress: number;
    partyAddress: number;
    historyAddress: number;
    moveScores: number[] | null;
    flagsRaw: number | null;
  } | null;
  rngSeed: number;
}

export interface GameStateSnapshot {
  schemaVersion: 1;
  game: 'run-and-bun';
  source: {
    format: 'john-gba-v10';
    stateFileName?: string;
    romFileName?: string;
    gameDataRomSha256?: string;
  };
  coverage: {
    party: 'decoded';
    boxes: 'decoded';
    bag: 'decoded';
    progress: 'not-decoded';
    battle: 'partial-memory-with-unverified-activity-and-phase';
  };
  limitations: string[];
  player: {
    party: SnapshotPokemon[];
    currentBox: number;
    boxes: { index: number; name: string; wallpaperId: number; pokemon: SnapshotPokemon[] }[];
    bag: {
      id: number;
      name: string;
      capacity: number;
      items: { slot: number; item: NamedId; quantity: number }[];
    }[];
    itemTotals: { item: NamedId; inBag: number; held: number; total: number }[];
  };
  battleMemory: BattleMemory;
}
