import {decodeRunAndBunSnapshot} from '../../../src/exporter/run-and-bun/decoder';
import {snapshotToBoxExport} from '../../../src/exporter/run-and-bun/box-export';
import type {SaveAccessPlugin, SaveRead} from '../storage/save-access.contracts';

function bytesFromRead(read: SaveRead): Uint8Array {
  if (typeof read.dataBase64 !== 'string') throw new Error('The native file read returned no data. Update the app and retry.');
  const binary = atob(read.dataBase64);
  if (binary.length !== read.bytes) throw new Error('The native file read was incomplete. Retry sync.');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function syncSelectedSnapshot(
  access: Pick<SaveAccessPlugin, 'getState' | 'readSelected'>,
  importBox: (json: string) => void,
): Promise<{pokemon: number; warnings: string[]}> {
  const state = await access.getState({target: 'snapshot'});
  if (state.access !== 'ready' || !state.selectedFile) {
    throw new Error('The snapshot is unavailable. Select or reconnect it in App settings.');
  }
  const read = await access.readSelected({target: 'snapshot', includeData: true});
  const snapshot = await decodeRunAndBunSnapshot(bytesFromRead(read), {
    stateFileName: read.document.name,
  });
  const exported = snapshotToBoxExport(snapshot);
  importBox(JSON.stringify(exported.collection));
  const pokemon = Object.values(exported.collection).reduce((total, collection) =>
    total + Object.values(collection.customSets).reduce((count, sets) => count + Object.keys(sets).length, 0), 0);
  return {pokemon, warnings: exported.warnings};
}
