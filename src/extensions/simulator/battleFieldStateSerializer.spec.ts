import { Field, Pokemon } from '@smogon/calc';
import { BattleFieldState, CpuTrainer, PlayerTrainer, PokemonPosition } from './moveScoring.contracts';
import {
	serializeBattleFieldState,
	deserializeBattleFieldState,
	battleFieldStateToJSON,
	battleFieldStateFromJSON,
	SerializedBattleFieldState,
} from './battleFieldStateSerializer';
import { importTeam } from './test-helper';

describe('BattleFieldState Serialization', () => {
	test('Serialize and deserialize a basic BattleFieldState', () => {
		const [playerPokemon1, playerPokemon2] = importTeam(`
Pikachu @ Light Ball
Level: 50
Ability: Static
- Thunderbolt
- Quick Attack

Charizard @ Leftovers
Level: 50
Ability: Blaze
- Flamethrower
- Air Slash
		`);

		const [cpuPokemon1, cpuPokemon2] = importTeam(`
Blastoise @ Choice Specs
Level: 50
Ability: Torrent
- Hydro Pump
- Ice Beam

Venusaur @ Black Sludge
Level: 50
Ability: Overgrow
- Solar Beam
- Sludge Bomb
		`);

		const field = new Field({ gameType: 'Singles' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(playerPokemon1)], [playerPokemon2]),
			new CpuTrainer([new PokemonPosition(cpuPokemon1)], [cpuPokemon2]),
			field,
			1
		);

		const serialized = serializeBattleFieldState(originalState);
		const deserialized = deserializeBattleFieldState(serialized);

		// Verify structure
		expect(deserialized.player.name).toBe('Player');
		expect(deserialized.cpu.name).toBe('CPU');
		expect(deserialized.turnNumber).toBe(1);
		expect(deserialized.field.gameType).toBe('Singles');

		// Verify player active Pokemon
		expect(deserialized.player.active.length).toBe(1);
		expect(deserialized.player.active[0].pokemon.name).toBe('Pikachu');
		expect(deserialized.player.active[0].pokemon.level).toBe(50);
		expect(deserialized.player.active[0].pokemon.ability).toBe('Static');
		expect(deserialized.player.active[0].pokemon.item).toBe('Light Ball');

		// Verify player party
		expect(deserialized.player.party.length).toBe(1);
		expect(deserialized.player.party[0].name).toBe('Charizard');

		// Verify CPU active Pokemon
		expect(deserialized.cpu.active.length).toBe(1);
		expect(deserialized.cpu.active[0].pokemon.name).toBe('Blastoise');

		// Verify CPU party
		expect(deserialized.cpu.party.length).toBe(1);
		expect(deserialized.cpu.party[0].name).toBe('Venusaur');
	});

	test('Serialize and deserialize BattleFieldState with HP modifications', () => {
		const [playerPokemon] = importTeam(`
Snorlax @ Leftovers
Level: 100
Ability: Thick Fat
- Body Slam
		`);

		const [cpuPokemon] = importTeam(`
Machamp @ Choice Band
Level: 100
Ability: Guts
- Close Combat
		`);

		// Modify HP
		const damagedPlayer = playerPokemon.clone({ curHP: 200 });
		const damagedCpu = cpuPokemon.clone({ curHP: 150 });

		const field = new Field({ gameType: 'Singles' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(damagedPlayer)], []),
			new CpuTrainer([new PokemonPosition(damagedCpu)], []),
			field,
			5
		);

		const serialized = serializeBattleFieldState(originalState);
		const deserialized = deserializeBattleFieldState(serialized);

		expect(deserialized.player.active[0].pokemon.originalCurHP).toBe(200);
		expect(deserialized.cpu.active[0].pokemon.originalCurHP).toBe(150);
		expect(deserialized.turnNumber).toBe(5);
	});

	test('Serialize and deserialize BattleFieldState with status conditions', () => {
		const [playerPokemon] = importTeam(`
Gengar @ Life Orb
Level: 100
Ability: Cursed Body
- Shadow Ball
		`);

		const burnedPokemon = playerPokemon.clone({ status: 'brn' });

		const field = new Field({ gameType: 'Singles' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(burnedPokemon)], []),
			new CpuTrainer([new PokemonPosition(playerPokemon)], []),
			field
		);

		const serialized = serializeBattleFieldState(originalState);
		const deserialized = deserializeBattleFieldState(serialized);

		expect(deserialized.player.active[0].pokemon.status).toBe('brn');
		expect(deserialized.cpu.active[0].pokemon.status).toBe('');
	});

	test('Serialize and deserialize BattleFieldState with stat boosts', () => {
		const [playerPokemon] = importTeam(`
Dragonite @ Lum Berry
Level: 100
Ability: Multiscale
- Dragon Dance
		`);

		const boostedPokemon = playerPokemon.clone({ boosts: { atk: 2, spe: 2 } });

		const field = new Field({ gameType: 'Singles' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(boostedPokemon)], []),
			new CpuTrainer([new PokemonPosition(playerPokemon)], []),
			field
		);

		const serialized = serializeBattleFieldState(originalState);
		const deserialized = deserializeBattleFieldState(serialized);

		expect(deserialized.player.active[0].pokemon.boosts.atk).toBe(2);
		expect(deserialized.player.active[0].pokemon.boosts.spe).toBe(2);
	});

	test('Serialize and deserialize doubles battle', () => {
		const [player1, player2, player3] = importTeam(`
Tapu Koko @ Choice Specs
Level: 100
Ability: Electric Surge
- Thunderbolt

Tapu Lele @ Life Orb
Level: 100
Ability: Psychic Surge
- Psychic

Tapu Bulu @ Choice Band
Level: 100
Ability: Grassy Surge
- Wood Hammer
		`);

		const [cpu1, cpu2] = importTeam(`
Tapu Fini @ Leftovers
Level: 100
Ability: Misty Surge
- Surf

Landorus-Therian @ Choice Scarf
Level: 100
Ability: Intimidate
- Earthquake
		`);

		const field = new Field({ gameType: 'Doubles', terrain: 'Electric' });
		const originalState = new BattleFieldState(
			new PlayerTrainer(
				[new PokemonPosition(player1, false), new PokemonPosition(player2, true)],
				[player3]
			),
			new CpuTrainer([new PokemonPosition(cpu1, true), new PokemonPosition(cpu2, false)], []),
			field,
			3
		);

		const serialized = serializeBattleFieldState(originalState);
		const deserialized = deserializeBattleFieldState(serialized);

		expect(deserialized.field.gameType).toBe('Doubles');
		expect(deserialized.field.terrain).toBe('Electric');
		expect(deserialized.player.active.length).toBe(2);
		expect(deserialized.cpu.active.length).toBe(2);
		expect(deserialized.player.active[0].firstTurnOut).toBe(false);
		expect(deserialized.player.active[1].firstTurnOut).toBe(true);
		expect(deserialized.cpu.active[0].firstTurnOut).toBe(true);
		expect(deserialized.cpu.active[1].firstTurnOut).toBe(false);
	});

	test('Serialize and deserialize BattleFieldState with field conditions', () => {
		const [playerPokemon] = importTeam(`
Tyranitar @ Assault Vest
Level: 100
Ability: Sand Stream
- Stone Edge
		`);

		const [cpuPokemon] = importTeam(`
Politoed @ Damp Rock
Level: 100
Ability: Drizzle
- Surf
		`);

		const field = new Field({
			gameType: 'Singles',
			weather: 'Rain',
			terrain: 'Grassy',
			isTrickRoom: true,
			attackerSide: {
				isReflect: true,
				isLightScreen: true,
				isSR: true,
				spikes: 2,
			},
			defenderSide: {
				isTailwind: true,
			},
		});

		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(playerPokemon)], []),
			new CpuTrainer([new PokemonPosition(cpuPokemon)], []),
			field,
			10
		);

		const serialized = serializeBattleFieldState(originalState);
		const deserialized = deserializeBattleFieldState(serialized);

		expect(deserialized.field.weather).toBe('Rain');
		expect(deserialized.field.terrain).toBe('Grassy');
		expect(deserialized.field.isTrickRoom).toBe(true);
		expect(deserialized.field.attackerSide.isReflect).toBe(true);
		expect(deserialized.field.attackerSide.isLightScreen).toBe(true);
		expect(deserialized.field.attackerSide.isSR).toBe(true);
		expect(deserialized.field.attackerSide.spikes).toBe(2);
		expect(deserialized.field.defenderSide.isTailwind).toBe(true);
	});

	test('JSON string serialization and deserialization', () => {
		const [playerPokemon] = importTeam(`
Garchomp @ Rocky Helmet
Level: 100
Ability: Rough Skin
- Earthquake
		`);

		const [cpuPokemon] = importTeam(`
Salamence @ Choice Specs
Level: 100
Ability: Intimidate
- Draco Meteor
		`);

		const field = new Field({ gameType: 'Singles', weather: 'Sun' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(playerPokemon)], []),
			new CpuTrainer([new PokemonPosition(cpuPokemon)], []),
			field,
			7
		);

		const jsonString = battleFieldStateToJSON(originalState);
		expect(typeof jsonString).toBe('string');

		const deserialized = battleFieldStateFromJSON(jsonString);
		expect(deserialized.player.active[0].pokemon.name).toBe('Garchomp');
		expect(deserialized.cpu.active[0].pokemon.name).toBe('Salamence');
		expect(deserialized.field.weather).toBe('Sun');
		expect(deserialized.turnNumber).toBe(7);
	});

	test('Serialized format is lighter than full object', () => {
		const [playerPokemon] = importTeam(`
Mewtwo @ Life Orb
Level: 100
Ability: Pressure
- Psychic
		`);

		const [cpuPokemon] = importTeam(`
Rayquaza @ Choice Band
Level: 100
Ability: Air Lock
- Dragon Ascent
		`);

		const field = new Field({ gameType: 'Singles' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(playerPokemon)], []),
			new CpuTrainer([new PokemonPosition(cpuPokemon)], []),
			field
		);

		const serialized = serializeBattleFieldState(originalState);
		const fullStringify = JSON.stringify(originalState);
		const lightweightStringify = JSON.stringify(serialized);

		// The serialized format should be smaller or equal (it excludes methods and computed properties)
		expect(lightweightStringify.length).toBeLessThanOrEqual(fullStringify.length);
	});

	test('Round-trip maintains Pokemon identity', () => {
		const [playerPokemon] = importTeam(`
Lucario @ Life Orb
Level: 100
Ability: Inner Focus
- Close Combat
		`);

		const field = new Field({ gameType: 'Singles' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(playerPokemon)], []),
			new CpuTrainer([new PokemonPosition(playerPokemon.clone())], []),
			field
		);

		const serialized = serializeBattleFieldState(originalState);
		const deserialized = deserializeBattleFieldState(serialized);

		// Pokemon should have the same properties after round trip
		const original = originalState.player.active[0].pokemon;
		const restored = deserialized.player.active[0].pokemon;

		expect(restored.name).toBe(original.name);
		expect(restored.level).toBe(original.level);
		expect(restored.ability).toBe(original.ability);
		expect(restored.item).toBe(original.item);
		expect(restored.maxHP()).toBe(original.maxHP());
		expect(restored.curHP()).toBe(original.curHP());
		expect(restored.moves).toEqual(original.moves);
	});

	test('Serialize empty party', () => {
		const [playerPokemon] = importTeam(`
Arceus @ Silk Scarf
Level: 100
Ability: Multitype
- Extreme Speed
		`);

		const field = new Field({ gameType: 'Singles' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(playerPokemon)], []),
			new CpuTrainer([new PokemonPosition(playerPokemon.clone())], []),
			field
		);

		const serialized = serializeBattleFieldState(originalState);
		const deserialized = deserializeBattleFieldState(serialized);

		expect(deserialized.player.party).toEqual([]);
		expect(deserialized.cpu.party).toEqual([]);
	});

	test('Deserialize with custom generation', () => {
		const [playerPokemon] = importTeam(`
Alakazam @ Focus Sash
Level: 100
Ability: Magic Guard
- Psychic
		`);

		const field = new Field({ gameType: 'Singles' });
		const originalState = new BattleFieldState(
			new PlayerTrainer([new PokemonPosition(playerPokemon)], []),
			new CpuTrainer([new PokemonPosition(playerPokemon.clone())], []),
			field
		);

		const serialized = serializeBattleFieldState(originalState);
		
		// Deserialize with gen 9 (default)
		const deserialized = deserializeBattleFieldState(serialized, 9);
		
		expect(deserialized.player.active[0].pokemon.gen.num).toBe(9);
		expect(deserialized.cpu.active[0].pokemon.gen.num).toBe(9);
	});
});
