const crypto = require('node:crypto');

function createServiceWorker(version, assets) {
  return `const PREFIX = 'runbuncalc-sandbox:' + self.registration.scope + ':';
const CACHE = PREFIX + ${JSON.stringify(version)};
const ASSETS = ${JSON.stringify(assets)}.map(asset => new URL(asset, self.registration.scope).href);
const PATHS = new Set(ASSETS.map(asset => new URL(asset).pathname));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => key.startsWith(PREFIX) && key !== CACHE)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !PATHS.has(url.pathname)) return;
  event.respondWith(caches.open(CACHE)
    .then(async cache => (await cache.match(event.request, {ignoreSearch: true})) || fetch(event.request)));
});
`;
}

class OfflinePlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('OfflinePlugin', compilation => {
      compilation.hooks.processAssets.tap({
        name: 'OfflinePlugin',
        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
      }, () => {
        const assets = compilation.getAssets().filter(asset =>
          /^(sandbox\.html|(?:sandbox|worker)\.bundle\.js|css\/theme-variables\.css)$/.test(asset.name) ||
          /^(extensions\/ux\/svgs\/|pokemon-sprites\/|vendor\/rbdex\/)/.test(asset.name)
        ).sort((a, b) => a.name.localeCompare(b.name));
        const hash = crypto.createHash('sha256');
        for (const asset of assets) hash.update(asset.name).update(asset.source.buffer());
        const worker = createServiceWorker(hash.digest('hex'), assets.map(asset => './' + asset.name));
        compilation.emitAsset('service-worker.js', new compiler.webpack.sources.RawSource(worker));
      });
    });
  }
}

module.exports = {OfflinePlugin, createServiceWorker};
