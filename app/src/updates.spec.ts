const ready = jest.fn<Promise<void>, []>(() => Promise.resolve());
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: jest.fn(() => 'android'),
    isPluginAvailable: jest.fn(() => true),
  },
  registerPlugin: jest.fn(() => ({ready})),
}));

import {Capacitor} from '@capacitor/core';

describe('web update startup acknowledgement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ready.mockResolvedValue(undefined);
  });

  it('does not call the native updater in a browser or an older APK without the plugin', () => {
    jest.mocked(Capacitor.getPlatform).mockReturnValueOnce('web');
    jest.isolateModules(() => {
      require('./updates').reportWebReady();
    });
    expect(ready).not.toHaveBeenCalled();
    jest.mocked(Capacitor.isPluginAvailable).mockReturnValueOnce(false);
    jest.isolateModules(() => {
      require('./updates').reportWebReady();
    });
    expect(ready).not.toHaveBeenCalled();
  });

  it('acknowledges readiness on supported Android and reports native acknowledgement failures', async () => {
    let reportWebReady: () => void = () => { throw new Error('Module was not loaded.'); };
    jest.isolateModules(() => {
      reportWebReady = require('./updates').reportWebReady;
    });
    reportWebReady();
    expect(ready).toHaveBeenCalledTimes(1);

    const status = {setAttribute: jest.fn(), textContent: ''};
    const prepend = jest.fn();
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {createElement: jest.fn(() => status), body: {prepend}},
    });
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      ready.mockRejectedValueOnce(new Error('Cannot persist readiness.'));
      reportWebReady();
      await Promise.resolve();
      expect(status.setAttribute).toHaveBeenCalledWith('role', 'alert');
      expect(prepend).toHaveBeenCalledWith(status);
      expect(status.textContent).toContain('may be rolled back');
      expect(log).toHaveBeenCalled();
    } finally {
      log.mockRestore();
      if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
      else Reflect.deleteProperty(globalThis, 'document');
    }
  });
});
