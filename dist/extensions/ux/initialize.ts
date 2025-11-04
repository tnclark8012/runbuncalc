import { getActiveSets, getSetCollection, saveActiveCollectionName, saveSetCollection } from "../core/storage";
import { updateSets } from "../simulator/utils";
import { initializePartyControls, refreshPlayerPokedex } from "./party";

export function initializeUx(): void {
  initializeLevelCap();
  initializeCollectionSelection();
  adjustTabOrders(); 
  initializePartyControls();
}

function adjustTabOrders() {
	$('.boost, .evs, .base').attr('tabindex', -1);
}

function initializeCollectionSelection() {
  const activeCollection = document.querySelector<HTMLSelectElement>('#activeCollection')!;
  const newCollection = document.querySelector<HTMLButtonElement>('#newCollection')!;
  const collection = getSetCollection();
  for (let collectionName in collection) {
		activeCollection.options.add(new Option(collectionName));
	}

  activeCollection.addEventListener('change', (e) => {
    console.log(e);
    const collectionName = activeCollection.selectedOptions[0].value;
    saveActiveCollectionName(collectionName);
    refreshPlayerPokedex();
  });

  newCollection.addEventListener('click', (e) => {
    const collectionName = prompt('Enter a name for the new collection');
    if (collectionName) {
      activeCollection.options.add(new Option(collectionName));
      activeCollection.selectedIndex = activeCollection.options.length - 1;
      saveActiveCollectionName(collectionName);
      const collection = getSetCollection();
      collection[collectionName] = {};
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

	const options = [
		new Option('Route 104 Aqua Grunt', '12'),
		new Option('Museum Aqua Grunts', '17'),
		new Option('Leader Brawly', '21'),
		new Option('Leader Roxanne', '25'),
		new Option('Route 117 Chelle', '32'),
		new Option('Leader Wattson', '35'),
		new Option('Cycling Road Rival', '38'),
		new Option('Leader Norman', '42'),
		new Option('Fallarbor Town Vito', '48'),
		new Option('Mt. Chimney Maxie', '54'),
		new Option('Leader Flannery', '57'),
		new Option('Weather Institute Shelly', '65'),
		new Option('Route 119 Rival', '66'),
		new Option('Leader Winona', '69'),
		new Option('Lilycove City Rival', '73'),
		new Option('Mt. Pyre Archie', '76'),
		new Option('Magma Hideout Maxie', '79'),
		new Option('Aqua Hideout Matt', '81'),
		new Option('Leaders Tate & Liza', '85'),
		new Option('Seafloor Cavern Archie', '89'),
		new Option('Leader Juan', '91'),
		new Option('Victory Road Vito', '95'),
		new Option('Champion Wallace', '99')
	];
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

