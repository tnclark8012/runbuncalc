import { runInNewContext } from 'node:vm';

const { createServiceWorker }: {
  createServiceWorker: (version: string, assets: string[]) => string;
} = require('../../offline-plugin.cjs');

function createWorker() {
  const handlers: Record<string, (event: unknown) => void> = {};
  const cache = {
    addAll: jest.fn().mockResolvedValue(undefined),
    match: jest.fn().mockResolvedValue('cached response'),
  };
  const caches = {
    open: jest.fn().mockResolvedValue(cache),
    keys: jest.fn().mockResolvedValue([
      'runbuncalc-sandbox:https://example.com/calc/:old',
      'runbuncalc-sandbox:https://example.com/calc/:new',
      'runbuncalc-sandbox:https://example.com/other/:old',
      'unrelated-cache',
    ]),
    delete: jest.fn().mockResolvedValue(true),
  };
  const self = {
    registration: {scope: 'https://example.com/calc/'},
    location: {origin: 'https://example.com'},
    addEventListener: (type: string, handler: (event: unknown) => void) => { handlers[type] = handler; },
    skipWaiting: jest.fn().mockResolvedValue(undefined),
    clients: {claim: jest.fn().mockResolvedValue(undefined)},
  };
  const fetch = jest.fn().mockResolvedValue('network response');
  runInNewContext(createServiceWorker('new', ['./sandbox.html', './sandbox.bundle.js', './pokemon-sprites/25.png']), {
    self, caches, fetch, URL,
    Request: class {
      constructor(public url: string, public options: {cache: string}) {}
    },
  });
  return {handlers, cache, caches, self, fetch};
}

describe('offline sandbox service worker', () => {
  it('precaches nested deployment URLs before activating', async () => {
    const {handlers, cache, self} = createWorker();
    const waitUntil = jest.fn();
    handlers.install({waitUntil});
    await waitUntil.mock.calls[0][0];
    expect(cache.addAll.mock.calls[0][0].map((request: {url: string}) => request.url)).toEqual([
      'https://example.com/calc/sandbox.html',
      'https://example.com/calc/sandbox.bundle.js',
      'https://example.com/calc/pokemon-sprites/25.png',
    ]);
    expect(self.skipWaiting).toHaveBeenCalled();
  });

  it('does not activate after an incomplete precache', async () => {
    const {handlers, cache, self} = createWorker();
    cache.addAll.mockRejectedValue(new Error('offline'));
    const waitUntil = jest.fn();
    handlers.install({waitUntil});
    await expect(waitUntil.mock.calls[0][0]).rejects.toThrow('offline');
    expect(self.skipWaiting).not.toHaveBeenCalled();
  });

  it('serves cache-busted bundle URLs offline and only falls back to the network for missing entries', async () => {
    const {handlers, cache, fetch} = createWorker();
    const request = {url: 'https://example.com/calc/sandbox.bundle.js?v=123', method: 'GET'};
    const respondWith = jest.fn();
    handlers.fetch({request, respondWith});
    await expect(respondWith.mock.calls[0][0]).resolves.toBe('cached response');
    expect(cache.match).toHaveBeenCalledWith(request, {ignoreSearch: true});
    expect(fetch).not.toHaveBeenCalled();

    cache.match.mockResolvedValue(undefined);
    handlers.fetch({request, respondWith});
    await expect(respondWith.mock.calls[1][0]).resolves.toBe('network response');
  });

  it('leaves other pages, origins and non-GET requests alone', () => {
    const {handlers} = createWorker();
    const respondWith = jest.fn();
    for (const request of [
      {url: 'https://example.com/calc/', method: 'GET', mode: 'navigate'},
      {url: 'https://example.com/calc/index.html', method: 'GET', mode: 'navigate'},
      {url: 'https://example.com/calc/randoms.html', method: 'GET'},
      {url: 'https://elsewhere.com/calc/sandbox.html', method: 'GET'},
      {url: 'https://example.com/calc/sandbox.html', method: 'POST'},
    ]) handlers.fetch({request, respondWith});
    expect(respondWith).not.toHaveBeenCalled();
  });

  it('removes only old caches for its own deployment scope', async () => {
    const {handlers, caches, self} = createWorker();
    const waitUntil = jest.fn();
    handlers.activate({waitUntil});
    await waitUntil.mock.calls[0][0];
    expect(caches.delete.mock.calls).toEqual([['runbuncalc-sandbox:https://example.com/calc/:old']]);
    expect(self.clients.claim).toHaveBeenCalled();
  });
});
