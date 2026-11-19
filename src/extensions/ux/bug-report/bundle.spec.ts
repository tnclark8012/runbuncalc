import JSZip from 'jszip';
import {currentJgFiles, decodedSnapshots, prepareBundle} from './bundle';

describe('diagnostic report bundle', () => {
  it('keeps decoded metadata separate from edited sets and the current JG bytes', async () => {
    const snapshot = {party: [{species: 'Caterpie', level: 5}], source: {sha256: 'last-sync'}};
    const decoded = decodedSnapshots(JSON.stringify({
      Imported: {customSets: {Caterpie: {Edited: {level: 100}}}, gameStateSnapshot: snapshot},
      Manual: {customSets: {}},
    }));
    expect(decoded).toEqual({Imported: snapshot});
    const raw = Buffer.from([0, 255, 128, 1, 0]);
    const report = prepareBundle('2026-11-19T15:00:00.000Z', [
      {name: 'decoded-jg.json', data: JSON.stringify(decoded)},
      ...currentJgFiles({name: '../../current.jg0', dataBase64: raw.toString('base64'), metadata: {sha256: 'current'}}),
    ], [], {build: 'test'});
    const zip = await JSZip.loadAsync(await report.zip.generateAsync({type: 'nodebuffer'}));
    expect(await zip.file('current-jg/current.jg0')!.async('nodebuffer')).toEqual(raw);
    expect(JSON.parse(await zip.file('decoded-jg.json')!.async('string'))).toEqual({Imported: snapshot});
    expect(JSON.parse(await zip.file('current-jg/metadata.json')!.async('string'))).toMatchObject({
      sha256: 'current', originalName: '../../current.jg0',
    });
    expect(Object.keys(zip.files).some(name => name.includes('..'))).toBe(false);
  });

  it('discloses missing diagnostics in both the ZIP and the prefilled issue', async () => {
    const missing = ['Current JG: no file connected.', 'Screenshot: capture failed.'];
    const report = prepareBundle('2026-11-19T15:00:00.000Z', [
      {name: 'calculator-state.json', data: '{"notes":"Report this setup"}'},
    ], missing, {platform: 'browser'});
    const manifest = JSON.parse(await report.zip.file('manifest.json')!.async('string'));
    expect(manifest).toMatchObject({
      schemaVersion: 1, missing, files: ['calculator-state.json'], environment: {platform: 'browser'},
    });
    const url = new URL(report.issueUrl);
    expect(url.origin + url.pathname).toBe('https://github.com/tnclark8012/runbuncalc/issues/new');
    expect(url.searchParams.get('body')).toContain(report.filename);
    for (const item of missing) expect(url.searchParams.get('body')).toContain(item);
    expect(url.searchParams.get('body')).toContain('does not attach');
  });

  it('distinguishes an absent decoded save from malformed data', () => {
    expect(decodedSnapshots(null)).toEqual({});
    expect(decodedSnapshots('{"Manual":{"customSets":{}}}')).toEqual({});
    expect(() => decodedSnapshots('{broken')).toThrow();
    expect(() => decodedSnapshots('[]')).toThrow('not an object');
    expect(() => currentJgFiles({name: 'empty.jg0', dataBase64: '', metadata: {}})).toThrow('no bytes');
  });
});
