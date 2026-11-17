import {syncSelectedSnapshot} from './sync';
import {decodeRunAndBunSnapshot} from '../../../src/exporter/run-and-bun/decoder';
import {snapshotToBoxExport} from '../../../src/exporter/run-and-bun/box-export';
import type {SaveAccessState, SaveRead, SaveTargetOptions} from '../storage/save-access.contracts';

jest.mock('../../../src/exporter/run-and-bun/decoder', () => ({
  decodeRunAndBunSnapshot: jest.fn(async () => ({source: {format: 'john-gba-v10'}})),
}));
jest.mock('../../../src/exporter/run-and-bun/box-export', () => ({
  snapshotToBoxExport: jest.fn(() => ({
    collection: {Imported: {
      customSets: {Bulbasaur: {Leaf: {moves: ['Tackle']}}},
      party: ['Bulbasaur (Leaf)'], gameStateSnapshot: {schemaVersion: 1},
    }},
    warnings: ['An egg was retained only in snapshot metadata.'],
  })),
}));

const ready: SaveAccessState = {
  source: 'file', access: 'ready', folderUri: null, selectedUri: 'content://test/save',
  selectedFile: {uri: 'content://test/save', name: 'save.jg0', size: 3, modifiedAt: 1},
};
const read: SaveRead = {
  document: ready.selectedFile!, bytes: 3, dataBase64: 'YWJj', sha256: 'hash', readAt: 'now',
};

function setup() {
  const access = {
    getState: jest.fn(async (_options?: SaveTargetOptions) => ready),
    readSelected: jest.fn(async (_options?: SaveTargetOptions & {includeData?: boolean}) => read),
  };
  const importer = jest.fn<void, [string]>();
  return {access, importer};
}

describe('manual snapshot sync', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads both saved selections sequentially, decodes, and sends compatible JSON to Import box', async () => {
    const {access, importer} = setup();
    let reading = false;
    access.readSelected.mockImplementation(async options => {
      if (reading) throw new Error('BUSY');
      reading = true;
      await Promise.resolve();
      reading = false;
      return options?.target === 'rom' ? {...read, document: {...read.document, name: 'game.gba'}} : read;
    });
    const result = await syncSelectedSnapshot(access, importer);
    expect(access.readSelected.mock.calls).toEqual([
      [{target: 'rom', includeData: true}], [{target: 'snapshot', includeData: true}],
    ]);
    expect(decodeRunAndBunSnapshot).toHaveBeenCalledWith(
      new Uint8Array([97, 98, 99]), new Uint8Array([97, 98, 99]),
      {stateFileName: 'save.jg0', romFileName: 'game.gba'},
    );
    const imported = JSON.parse(importer.mock.calls[0][0]);
    expect(imported.Imported.party).toEqual(['Bulbasaur (Leaf)']);
    expect(imported.Imported.gameStateSnapshot).toEqual({schemaVersion: 1});
    expect(result).toEqual({pokemon: 1, warnings: ['An egg was retained only in snapshot metadata.']});
  });

  it.each(['rom', 'snapshot'] as const)('rejects missing %s access without reading or importing', async target => {
    const {access, importer} = setup();
    access.getState.mockImplementation(async options => options?.target === target
      ? {...ready, access: 'permission-required'} : ready);
    await expect(syncSelectedSnapshot(access, importer)).rejects.toThrow('App settings');
    expect(access.readSelected).not.toHaveBeenCalled();
    expect(importer).not.toHaveBeenCalled();
  });

  it.each([
    {...read, dataBase64: undefined},
    {...read, bytes: 4},
  ])('does not import an incomplete native read', async incomplete => {
    const {access, importer} = setup();
    access.readSelected.mockResolvedValueOnce(incomplete);
    await expect(syncSelectedSnapshot(access, importer)).rejects.toThrow();
    expect(importer).not.toHaveBeenCalled();
  });

  it('preserves the current collection if the snapshot changes while being read', async () => {
    const {access, importer} = setup();
    access.readSelected.mockResolvedValueOnce(read).mockRejectedValueOnce(new Error('The save changed during the read.'));
    await expect(syncSelectedSnapshot(access, importer)).rejects.toThrow('changed during the read');
    expect(importer).not.toHaveBeenCalled();
  });

  it('does not import when decoding or calculator conversion fails', async () => {
    const {access, importer} = setup();
    jest.mocked(decodeRunAndBunSnapshot).mockRejectedValueOnce(new Error('Invalid snapshot'));
    await expect(syncSelectedSnapshot(access, importer)).rejects.toThrow('Invalid snapshot');
    expect(importer).not.toHaveBeenCalled();
    jest.mocked(snapshotToBoxExport).mockImplementationOnce(() => { throw new Error('Unsupported species'); });
    await expect(syncSelectedSnapshot(access, importer)).rejects.toThrow('Unsupported species');
    expect(importer).not.toHaveBeenCalled();
  });

  it('propagates persistence failures instead of reporting a successful sync', async () => {
    const {access, importer} = setup();
    importer.mockImplementation(() => { throw new Error('Storage full'); });
    await expect(syncSelectedSnapshot(access, importer)).rejects.toThrow('Storage full');
  });
});
