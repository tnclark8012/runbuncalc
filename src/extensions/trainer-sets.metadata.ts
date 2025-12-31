import { getTrainerIndexByTrainerName, getTrainerNameByTrainerIndex } from "./trainer-sets";
import type { TrainerNames } from "./trainer-sets.data";
import type { FieldState } from "./ux/store/fieldSlice";

export interface TrainerMetadata {
  fieldState?: Partial<FieldState>;
  gauntlet?: {
    index: number;
    size: number;
    consecutive?: boolean;
  },
}

export function getTrainerMetadata(trainerName: TrainerNames): TrainerMetadata | undefined {
  if (trainerMetadataMap.size === 0) {
    initializeTrainerMetadata();
  }

  return trainerMetadataMap.get(trainerName);
}

const trainerMetadataMap: Map<string, TrainerMetadata> = new Map();
function initializeTrainerMetadata() {
  createFieldForTrainers({ weather: 'Sand'}, 'Picnicker Irene', 'Camper Drew');
  createFieldForTrainers({ weather: 'Rain'}, 'Bug Maniac Taylor', 'Parasol Lady Koko');
  createFieldForTrainers({ weather: 'Rain', terrain: 'Electric' }, 'Trainer Rival Bridge Sceptile', 'Ninja Boy Gren');
  createFieldForTrainers({ cpuSide: { isTailwind: true, isAuroraVeil: false, isLightScreen: false, isReflect: false, isSR: false, spikes: 0 } }, 'Team Aqua Grunt Mt Pyre #3', 'Aqua Leader Archie Mt Pyre');
  createFieldForTrainers({ cpuSide: { isTailwind: false, isAuroraVeil: true, isLightScreen: false, isReflect: false, isSR: false, spikes: 0 } }, 'Team Aqua Grunt Seafloor Cavern #1', 'Aqua Admin ShellySeafloorCavern');

  // Eratic weather
  createFieldForTrainers({ weather: 'Sun' }, 'Swimmer♂ Reed', 'Triathlete Chase & Allison');
  createFieldForTrainers({ weather: 'Rain' }, 'Swimmer♀ Tisha');
  createFieldForTrainers({ weather: 'Rain', terrain: 'Electric' }, 'Swimmer♂ Clarence');
  createFieldForTrainers({ weather: 'Rain' }, 'Swimmer♂ Rodney', 'Swimmer♀ Katie');
  createFieldForTrainers({ weather: 'Sun' }, 'Swimmer♂ Zappator', 'Sis And Bro Reli And Ian');
  createFieldForTrainers({ weather: 'Rain' }, 'Swimmer♂ Herman');

  markGauntlet('Team Aqua Grunt Museum #1', 'Team Aqua Grunt Museum #2', true);
  markGauntlet('Winstrate Victor', 'Winstrate Vicky', true);
  markGauntlet('Team Aqua Grunt Mt Pyre #1', 'Team Aqua Grunt Mt Pyre #2', true);
  markGauntlet('Leader Tate', 'Leader Liza', true);
  markGauntlet('Team Magma Grunt Space Center #5', 'Team Magma Grunt Space Center #7', true);
  markGauntlet('Lady Brianna', 'Lass Pearl', true);

  markGauntlet('Pokémaniac Steve', 'Collector Hector');
  markGauntlet('Triathlete Julio', 'Picnicker Diana');
  markGauntlet('Cool Trainer Gerald', 'Kindler Axle');
  markGauntlet('Psychic Kayla', 'Team Aqua Grunt Mt Pyre #2');
  markGauntlet('Team Aqua Grunt Seafloor Cavern #3', 'Team Aqua Grunt Seafloor Cavern #4');
  markGauntlet('Lass Andrea & Connie', 'Beauty Bridget');
}

function markGauntlet(startingTrainerName: TrainerNames, endingTrainerName: TrainerNames, consecutive = false): void {
  let startingIndex = getTrainerIndexByTrainerName(startingTrainerName);
  let endingIndex = getTrainerIndexByTrainerName(endingTrainerName);
  const size = endingIndex - startingIndex + 1;

  for (let i = startingIndex; i <= endingIndex; i++) {
    const trainerName = getTrainerNameByTrainerIndex(i);
    const existingMetadata = trainerMetadataMap.get(trainerName) || {};
    trainerMetadataMap.set(trainerName, { ...existingMetadata, gauntlet: { index: i - startingIndex, size, consecutive } });
  }
}
function createFieldForTrainers(field: Partial<FieldState>, startingTrainerName: TrainerNames, endingTrainerName?: TrainerNames): void {
  let startingIndex = getTrainerIndexByTrainerName(startingTrainerName);
  let endingIndex = endingTrainerName ? getTrainerIndexByTrainerName(endingTrainerName) : startingIndex;
  for (let i = startingIndex; i <= endingIndex; i++) {
    const trainerName = getTrainerNameByTrainerIndex(i);
    trainerMetadataMap.set(trainerName, { fieldState: field });
  }
}