import { decodeRunAndBunSnapshot } from './decoder';
import { snapshotToBoxExport } from './box-export';

const form = document.querySelector<HTMLFormElement>('#decoder')!;
const stateInput = document.querySelector<HTMLInputElement>('#state')!;
const nameInput = document.querySelector<HTMLInputElement>('#collection-name')!;
const decodeButton = document.querySelector<HTMLButtonElement>('#decode')!;
const downloadButton = document.querySelector<HTMLButtonElement>('#download')!;
const status = document.querySelector<HTMLElement>('#status')!;
const errorOutput = document.querySelector<HTMLElement>('#error')!;
const summary = document.querySelector<HTMLElement>('#summary')!;
let json: string | undefined;

function clearResult(): void {
  json = undefined;
  downloadButton.disabled = true;
  summary.hidden = true;
  summary.textContent = '';
  status.textContent = '';
  errorOutput.textContent = '';
}

form.addEventListener('input', clearResult);
form.addEventListener('change', clearResult);
form.addEventListener('submit', async event => {
  event.preventDefault();
  clearResult();
  const stateFile = stateInput.files?.[0];
  if (!stateFile) {
    errorOutput.textContent = 'Select a John GBA snapshot.';
    return;
  }
  decodeButton.disabled = true;
  for (const input of [stateInput, nameInput]) input.disabled = true;
  status.textContent = 'Decoding locally...';
  try {
    const state = await stateFile.arrayBuffer();
    const snapshot = await decodeRunAndBunSnapshot(new Uint8Array(state), {
      stateFileName: stateFile.name,
    });
    const output = snapshotToBoxExport(snapshot, nameInput.value);
    json = JSON.stringify(output.collection, null, 2);
    const boxed = snapshot.player.boxes.reduce((count, box) => count + box.pokemon.length, 0);
    summary.textContent = JSON.stringify({
      partyPokemon: snapshot.player.party.length, boxedPokemon: boxed,
      occupiedBagSlots: snapshot.player.bag.reduce((count, pocket) => count + pocket.items.length, 0),
      battleMemoryRecords: snapshot.battleMemory.battlers.length,
      coverage: snapshot.coverage, limitations: snapshot.limitations, exportWarnings: output.warnings,
    }, null, 2);
    summary.hidden = false;
    status.textContent = 'Decoded. Download the JSON and import it using Import box.';
    downloadButton.disabled = false;
  } catch (error) {
    status.textContent = '';
    errorOutput.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    decodeButton.disabled = false;
    for (const input of [stateInput, nameInput]) input.disabled = false;
  }
});

downloadButton.addEventListener('click', () => {
  if (!json) return;
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'run-and-bun-snapshot.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
});
