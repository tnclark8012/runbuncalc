import { formatAllPokemon, parseSaveFile, RomType } from "../../exporter";
import { findPathForParty } from "../../worker/worker.client";
import { addToParty, getActiveCollection, getActiveSets, getParty, getSetCollection, removeFromParty, saveActiveSets, saveSetCollection } from "../core/storage";
import { getTrainerNameByPokemonIndex } from "../trainer-sets";

export function initializePartyControls(): void {
	document.querySelector('#trash-pok')?.addEventListener('click', trashPokemon);
	document.querySelector('#trash-pok-current')?.addEventListener('click', trashCurrentPokemon);
	document.querySelector('#trash-pok-restore')?.addEventListener('click', restoreCurrentPokemon);

	const trainerSection = document.querySelector('#trainer-mons')!;
	trainerSection.insertAdjacentHTML('afterbegin', `
    <div style="display: flex; justify-content: space-between;">
      <button class="move-to-party">Move to Party</button>
	  <button class="check-party">Check Party</button>
      <button class="move-to-box">Move to Box</button>
    </div>
`);

	// Then add event listeners
	trainerSection.querySelector('.move-to-party')?.addEventListener('click', promoteCurrentPokemonToParty);
	trainerSection.querySelector('.move-to-box')?.addEventListener('click', demoteCurrentPokemonToBox);
	trainerSection.querySelector('.check-party')?.addEventListener('click', async () => {
		const outputElement = document.querySelector<HTMLTextAreaElement>('textarea.import-team-text')!;
		outputElement.value = "Checking...";
		try {
			const path = await findPathForParty(getTrainerNameByPokemonIndex(nextTrainerId - 1), getActiveCollection());
			outputElement.value = `${path}`;
		} catch (error) {
			outputElement.value = `Error: ${error}`;
		}
	});
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

	connectFileInput("#importSave", "#importSaveInput", async (fileList: FileList) => {
		if (fileList.length !== 2) {
			alert("Please select both a .sav file and a .gba file");
			return;
		}
		
		const files = [fileList[0], fileList[1]];
		const savFile = files.find(file => file.name.endsWith('.sav'));
		const gbaFile = files.find(file => file.name.endsWith('.gba'));

		if (!savFile) {
			alert("Please select a .sav file");
			return;
		}

		if (!gbaFile) {
			alert("Please select a .gba file");
			return;
		}

		const [saveBuffer, romBuffer] = await Promise.all([savFile.arrayBuffer(), gbaFile.arrayBuffer()]);
		const gameState = parseSaveFile(RomType.PokemonNull, saveBuffer, romBuffer);
		const team = formatAllPokemon(gameState);
		navigator.clipboard.writeText(team);
		alert("Team copied to clipboard!");
	});

	connectFileInput("#importBox", "#importBoxInput", (files) => {
		const file = files[0];
		file.text().then((value: string) => {
			saveSetCollection(JSON.parse(value));
		});
	});
}

function connectFileInput(buttonSelector: string, inputSelector: string, callback: (files: FileList) => void): void {
	const fileInput = document.querySelector<HTMLInputElement>(inputSelector)!;
	const button = document.querySelector<HTMLButtonElement>(buttonSelector)!;

	button.addEventListener("click", () => {
		fileInput.click();
	});

	fileInput.addEventListener("change", (e: any) => {
		const file = e.target!.files[0];
		callback(e.target!.files);
	});
}

/**
 * Helper to parse Pokemon ID in format "species (setName)"
 */
export function parsePokemonId(pokemonId: string): { species: string; setName: string } | null {
	const match = /^(.+) \((.+)\)$/.exec(pokemonId);
	if (!match) return null;
	return { species: match[1], setName: match[2] };
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