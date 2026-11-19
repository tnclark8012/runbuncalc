import html2canvas from 'html2canvas';
import {captureReport} from './capture';
import type {DiagnosticBridge} from './contracts';

jest.mock('html2canvas', () => ({__esModule: true, default: jest.fn()}));

describe('diagnostic capture', () => {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const storage = new Map<string, string>();
  const htmlCapture = jest.mocked(html2canvas);
  const globals: Record<string, unknown> = {
    __REPORT_BUILD__: {revision: 'test'},
    document: {body: {className: ''}, querySelectorAll: () => [], querySelector: () => null},
    window: {scrollX: 0, scrollY: 0},
    navigator: {userAgent: 'test', language: 'en'},
    location: {pathname: '/index.html'},
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
    localStorage: {getItem: (key: string) => storage.get(key) ?? null},
  };
  beforeAll(() => {
    for (const [key, value] of Object.entries(globals)) {
      originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, {configurable: true, value});
    }
  });
  afterAll(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  beforeEach(() => {
    storage.clear();
    htmlCapture.mockReset();
  });

  function nativeBridge(): DiagnosticBridge {
    return {
      readCurrentJg: jest.fn().mockResolvedValue({
        name: 'active.jg0', dataBase64: 'AP8BAA==', metadata: {sha256: 'current'},
      }),
      captureScreenshot: jest.fn().mockResolvedValue('cGl4ZWxz'),
      getAppInfo: jest.fn().mockResolvedValue({versionName: 'test'}),
      saveZip: jest.fn(),
      copyFilename: jest.fn(),
      openIssue: jest.fn(),
    };
  }

  it('exports stored decoded data and separately reads the currently linked file without saving or uploading', async () => {
    storage.set('setCollection', JSON.stringify({
      Imported: {customSets: {}, gameStateSnapshot: {source: {sha256: 'last-sync'}}},
    }));
    const native = nativeBridge();
    const report = await captureReport(native);
    expect(report.missing).toEqual([]);
    expect(await report.zip.file('current-jg/active.jg0')!.async('base64')).toBe('AP8BAA==');
    expect(JSON.parse(await report.zip.file('decoded-jg.json')!.async('string'))).toEqual({
      Imported: {source: {sha256: 'last-sync'}},
    });
    expect(native.readCurrentJg).toHaveBeenCalledTimes(1);
    expect(native.saveZip).not.toHaveBeenCalled();
    expect(native.openIssue).not.toHaveBeenCalled();
    expect(htmlCapture).not.toHaveBeenCalled();
  });

  it('retains the calculator state and discloses independent diagnostic failures', async () => {
    storage.set('setCollection', '{broken');
    const native = nativeBridge();
    jest.mocked(native.readCurrentJg).mockRejectedValue({message: 'Permission revoked'});
    jest.mocked(native.captureScreenshot).mockRejectedValue(new Error('Capture unavailable'));
    const report = await captureReport(native);
    expect(report.zip.file('calculator-state.json')).not.toBeNull();
    expect(report.zip.file('screenshot.png')).toBeNull();
    expect(report.missing).toEqual(expect.arrayContaining([
      expect.stringContaining('Decoded JG:'),
      'Current JG: Permission revoked',
      'Screenshot: Capture unavailable',
    ]));
    const manifest = JSON.parse(await report.zip.file('manifest.json')!.async('string'));
    expect(manifest.missing).toEqual(report.missing);
  });

  it('allows a browser report without any save and surfaces a failed browser screenshot', async () => {
    htmlCapture.mockRejectedValue(new Error('Canvas unavailable'));
    const report = await captureReport();
    expect(report.zip.file('calculator-state.json')).not.toBeNull();
    expect(report.missing).toEqual(expect.arrayContaining([
      'Decoded JG: no imported snapshot is available.',
      'Screenshot: Canvas unavailable',
      expect.stringContaining('Current JG: native linked-file access is unavailable'),
    ]));
  });
});
