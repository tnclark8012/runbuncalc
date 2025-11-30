import { getActiveCollectionName, getActiveSets, getSetCollection, saveActiveCollectionName, saveSetCollection } from "../core/storage";
import { LEVEL_CAP_CHECKPOINTS } from "../recommended-movesets";
import { updateSets } from "../simulator/utils";
import { initializeCalcCustomization } from "./calc-customization";
import { initializeImportExportControls, initializePartyControls, refreshPlayerPokedex } from "./party";

export function initializeUx(): void {
  initializeLevelCap();
  initializeCollectionSelection();
  adjustTabOrders(); 
  initializePartyControls();
  refreshPlayerPokedex();
  initializeImportExportControls();
  initializeCalcCustomization();
}

function adjustTabOrders() {
	$('.boost, .evs, .base').attr('tabindex', -1);
}

function initializeCollectionSelection() {
  const activeCollection = document.querySelector<HTMLSelectElement>('#activeCollection')!;
  const newCollection = document.querySelector<HTMLButtonElement>('#newCollection')!;
  const collection = getSetCollection();
  const activeCollectionName = getActiveCollectionName();
  let activeIndex = 0;
  let collectionNames = Object.keys(collection);
  for (let collectionName in collection) {
	activeCollection.options.add(new Option(collectionName));
	if (collectionName === activeCollectionName) {
		activeIndex = activeCollection.options.length - 1;
	}
}

  activeCollection.addEventListener('change', (e) => {
    console.log(e);
    const collectionName = activeCollection.selectedOptions[0].value;
    saveActiveCollectionName(collectionName);
    refreshPlayerPokedex();
  });
  
  activeCollection.selectedIndex = activeIndex;

  newCollection.addEventListener('click', (e) => {
    const collectionName = prompt('Enter a name for the new collection');
    if (collectionName) {
      activeCollection.options.add(new Option(collectionName));
      activeCollection.selectedIndex = activeCollection.options.length - 1;
      saveActiveCollectionName(collectionName);
      const collection = getSetCollection();
      collection[collectionName] = {
				customSets: {},
				party: []
			};
      saveSetCollection(collection);
    }
  });
}

function initializeLevelCap() {
	populateLevelCap();
  	document.querySelector('#applyCap')!.addEventListener('click', () => {
		const levelCap = document.querySelector<HTMLSelectElement>('#levelCap')!;
		const newLevel = parseInt(levelCap.selectedOptions[0].value);
		updateSets((set) => {
			set.level = Math.max(set.level!, newLevel);
		});
    	refreshPlayerPokedex();
	});
}

function populateLevelCap() {
	const levelCap = document.querySelector<HTMLSelectElement>('#levelCap')!;

	const options = LEVEL_CAP_CHECKPOINTS.map(checkpoint =>
		new Option(checkpoint.name, checkpoint.level.toString())
	);
	for (let option of options) {
		levelCap.options.add(option);
	}

	const sets = getActiveSets();
	let maxMonLevel = 0;
	updateSets((set) => {
		maxMonLevel = Math.max(maxMonLevel, set.level!);
	});

	let currentCap = options.findIndex(o => parseInt(o.value) >= maxMonLevel);
	if (currentCap == -1)
		currentCap = options.length - 1;
	levelCap.options.selectedIndex = currentCap;
}

