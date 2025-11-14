import { addToParty, getActiveSets, getParty, removeFromParty, saveActiveSets, getPokemonId, getActiveCollectionName, getSetCollection, saveSetCollection } from "../core/storage";

export function initializePartyControls(): void {
  document.querySelector('#trash-pok')?.addEventListener('click', trashPokemon);
	document.querySelector('#trash-pok-current')?.addEventListener('click', trashCurrentPokemon);
	document.querySelector('#trash-pok-restore')?.addEventListener('click', restoreCurrentPokemon);
  
  const trainerSection = document.querySelector('#trainer-mons')!;
  trainerSection.insertAdjacentHTML('afterbegin', `
    <div style="display: flex; justify-content: space-between;">
      <button class="move-to-party">Move to Party</button>
      <button class="move-to-box">Move to Box</button>
    </div>
`);

// Then add event listeners
trainerSection.querySelector('.move-to-party')?.addEventListener('click', promoteCurrentPokemonToParty);
trainerSection.querySelector('.move-to-box')?.addEventListener('click', demoteCurrentPokemonToBox);

}

export function initializeImportExportControls(): void {
	document.querySelector("#exportAll")!.addEventListener("click", () => {
		let name = document.querySelector<HTMLInputElement>("#exportAllName")!.value || document.querySelector<HTMLSelectElement>('#levelCap')!.selectedOptions[0].label;
		const link = document.createElement("a");
		const allMons = JSON.stringify(getSetCollection());
		navigator.clipboard.writeText(allMons)
		const file = new Blob([allMons], { type: 'text/plain' });
		link.href = URL.createObjectURL(file);
		link.download = name + ".json";
		link.click();
		URL.revokeObjectURL(link.href);
	});

	const importBoxInput = document.querySelector<HTMLInputElement>("#importBoxInput")!;
	document.querySelector("#importBox")!.addEventListener("click", () => {
		importBoxInput.click();
	});

	importBoxInput.addEventListener('change', (e: any) => {
		const file = e.target!.files[0];
		file.text().then((value: string) => {
			saveSetCollection(JSON.parse(value));
		});
	});
}

export function getCurrentPokemonId(): string {
	let selectedDropdownForPlayer = $('.player').val() as string;
	// const match = /^(.*) (\(.*\))$/.exec(selectedDropdownForPlayer)!;
	return selectedDropdownForPlayer;
}

function promoteCurrentPokemonToParty() {
  promotePokemonToParty(getCurrentPokemonId());
}

function promotePokemonToParty(pokemonId: string): void {
  let currentParty = getParty();
  if (currentParty.includes(pokemonId))
    return;

  addToParty(pokemonId);
  movePlayerPokemonElement(pokemonId, "party");
}

function demoteCurrentPokemonToBox() {
  let pokemonId = getCurrentPokemonId();
  let currentParty = getParty();
  if (!currentParty.includes(pokemonId))
    return;
  
  removeFromParty(pokemonId);
  refreshPlayerPokedex();
}

function restoreCurrentPokemon() {
	movePlayerPokemonElement(getCurrentPokemonId(), "box");
}

function trashCurrentPokemon() {
	movePlayerPokemonElement(getCurrentPokemonId(), "trash");
}

function trashPokemon() {
	var maybeMultiple = document.getElementById("trash-box")!.getElementsByClassName("trainer-pok");
	if (maybeMultiple.length == 0) {
		return; //nothing to delete
	}
	var numberPKM = maybeMultiple.length > 1 ? `${maybeMultiple.length} Pokemon(s)` : "this Pokemon";
	var yes = confirm(`do you really want to remove ${numberPKM}?`);
	if (!yes) {
		return;
	}
	var customSets = getActiveSets();
	var length = maybeMultiple.length;
	for (let i = 0; i < length; i++) {
		var pokeTrashed = maybeMultiple[i];
		var name = pokeTrashed.getAttribute("data-id")!.split(" (")[0];
		delete customSets[name];
	}
	document.getElementById("trash-box")!.innerHTML = "";
	saveActiveSets(customSets);
	$('#box-poke-list')[0].click();
	//switch to the next pokemon automatically
}

type DropZone = "party" | "box" | "trash";
function movePlayerPokemonElement(id: string, dropZone: DropZone): void {
	let pokeElement = $(`.left-side[data-id="${id}"]`)[0];
	const zones = {
		party: "team-poke-list",
		box: "box-poke-list",
		trash: "trash-box"
	};
	dropInZone(pokeElement, document.getElementById(zones[dropZone])!);
}

function dropInZone(pokeElement: HTMLElement, dropZoneElement: HTMLElement) {
	if (dropZoneElement.classList.contains("dropzone")) {
		pokeElement.parentNode!.removeChild(pokeElement);
		if (dropZoneElement.tagName == "LEGEND") {
			dropZoneElement.parentNode!.children[1].appendChild(pokeElement);
		} else {
			dropZoneElement.appendChild(pokeElement);
		}

	}
	// if it's a pokemon
	else if (dropZoneElement.classList.contains("left-side") || dropZoneElement.classList.contains("right-side")) {
		if (!cntrlIsPressed) {
			let prev1 = pokeElement.previousElementSibling
			if (!prev1) {
				dropZoneElement.after(pokeElement)
			} else {
				dropZoneElement.before(pokeElement)
				prev1.after(dropZoneElement)
			}
			//swaps
		} else {
			//appends before
			dropZoneElement.before(pokeElement);
		}
	}
	dropZoneElement.classList.remove('over');
}

export function refreshPlayerPokedex() {
  document.querySelector('#box-poke-list')!.innerHTML = '';
	document.querySelector('#team-poke-list')!.innerHTML = '';
  updateDex(getActiveSets());
  for (let pokeId of getParty()) {
		movePlayerPokemonElement(pokeId, "party");
  }
  selectFirstMon();
}