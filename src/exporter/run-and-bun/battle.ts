import { SnapshotMemory } from './memory';
import { readPokemon } from './pokemon';
import { RunAndBunRom } from './rom';
import type { BattleMemory, SnapshotBattler, SnapshotPokemon } from './types';

export function readBattleMemory(memory: SnapshotMemory, rom: RunAndBunRom): BattleMemory {
  const battlerCount = memory.u8(0x020233E4);
  if (![0, 2, 4].includes(battlerCount)) throw new Error(`Invalid battler count ${battlerCount}.`);
  const battlers: SnapshotBattler[] = Array.from({ length: battlerCount }, (_, index) => {
    const address = 0x020233FC + 92 * index;
    const restriction = 0x02023668 + 40 * index;
    const lastUsedMoveRaw = memory.u16(0x020235CC + 2 * index);
    const partySlot = memory.u16(0x020233E6 + 2 * index);
    if (partySlot >= 6) throw new Error(`Invalid active party slot ${partySlot}.`);
    return {
      index, side: index % 2 === 0 ? 'player' : 'cpu', partySlot,
      species: rom.species(memory.u16(address)), level: memory.u8(address + 44),
      hp: memory.u16(address + 42),
      stats: {
        hp: memory.u16(address + 46), attack: memory.u16(address + 2), defense: memory.u16(address + 4),
        speed: memory.u16(address + 6), specialAttack: memory.u16(address + 8), specialDefense: memory.u16(address + 10),
      },
      ability: rom.ability(memory.u16(address + 32)), heldItem: rom.item(memory.u16(address + 48)),
      typeIds: Array.from(memory.bytes(address + 34, 3)),
      statStagesRaw: Array.from(memory.bytes(address + 24, 8)),
      moves: Array.from({ length: 4 }, (_, slot) => ({
        slot, move: rom.move(memory.u16(address + 12 + slot * 2)), pp: memory.u8(address + 37 + slot),
      })),
      majorStatusRaw: memory.u32(address + 80), volatileStatusRaw: memory.u32(address + 84),
      status3Raw: memory.u32(0x02023648 + 4 * index), additionalStatusRaw: memory.u32(0x02023658 + 4 * index),
      lastUsedMoveRaw, lastUsedMove: lastUsedMoveRaw === 0xFFFF ? null : rom.move(lastUsedMoveRaw),
      restrictions: {
        encoredMove: rom.move(memory.u16(restriction + 6)), encoredMoveSlot: memory.u8(restriction + 16),
        encoreTurns: memory.u8(restriction + 17) & 15, encoreTimerByteRaw: memory.u8(restriction + 17),
        protectUseCount: memory.u8(restriction + 8), disableTurns: memory.u8(restriction + 15) & 15,
        tauntTurns: memory.u8(restriction + 22) & 15, firstTurnOutRaw: memory.u8(restriction + 25),
        truantPhase: memory.u8(restriction + 26) & 1, raw: Array.from(memory.bytes(restriction, 40)),
      },
      rawRecord: Array.from(memory.bytes(address, 92)),
    };
  });
  const opponentParty: SnapshotPokemon[] = [];
  for (let slot = 0; slot < 6; slot++) {
    const pokemon = readPokemon(memory, rom, 0x02023CF0 + slot * 100, { kind: 'opponent-party', slot });
    if (pokemon) opponentParty.push(pokemon);
  }
  const resourcesAddress = memory.u32(0x02023A18);
  let ai: BattleMemory['ai'] = null;
  if (resourcesAddress !== 0) {
    memory.bytes(resourcesAddress, 0x24);
    const thinkingAddress = memory.u32(resourcesAddress + 0x14);
    ai = {
      resourcesAddress, thinkingAddress, cacheAddress: memory.u32(resourcesAddress + 0x18),
      partyAddress: memory.u32(resourcesAddress + 0x1C), historyAddress: memory.u32(resourcesAddress + 0x20),
      moveScores: thinkingAddress === 0 ? null : Array.from({ length: 4 }, (_, i) => memory.u16(thinkingAddress + 4 + i * 2)),
      flagsRaw: thinkingAddress === 0 ? null : memory.u32(thinkingAddress + 0x10),
    };
  }
  const fieldTimers = 0x02023A5C;
  return {
    activity: 'unknown', phase: 'unknown', flagsRaw: memory.u32(0x02023364), battlerCount, battlers, opponentParty,
    completedTurnsCandidate: memory.u8(0x03005D23), weatherFlagsRaw: memory.u16(0x020237C8),
    fieldFlagsRaw: memory.u32(0x02023A58),
    fieldTimers: {
      wonderRoom: memory.u8(fieldTimers + 2), magicRoom: memory.u8(fieldTimers + 3),
      trickRoom: memory.u8(fieldTimers + 4), gravity: memory.u8(fieldTimers + 6),
      raw: Array.from(memory.bytes(fieldTimers, 7)),
    },
    sides: Array.from({ length: 2 }, (_, index) => {
      const address = 0x02023618 + index * 24;
      return {
        side: index === 0 ? 'player' : 'cpu', flagsRaw: memory.u32(0x02023610 + index * 4),
        timersRaw: Array.from(memory.bytes(address, 24)),
        reflect: memory.u8(address), lightScreen: memory.u8(address + 2),
        mist: memory.u8(address + 4), safeguard: memory.u8(address + 6),
        spikesLayers: memory.u8(address + 8), toxicSpikesLayers: memory.u8(address + 9),
        stealthRockRaw: memory.u8(address + 10), stickyWebRaw: memory.u8(address + 11),
        auroraVeil: memory.u8(address + 13), tailwind: memory.u8(address + 15), luckyChant: memory.u8(address + 17),
      };
    }),
    ai, rngSeed: memory.u32(0x03005D90),
  };
}
