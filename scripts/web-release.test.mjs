import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {createManifest, signManifest, validateManifest, validateRun, verifyManifest} from './web-release.mjs';

const run = {
  repository: {full_name: 'tnclark8012/runbuncalc'},
  head_repository: {full_name: 'tnclark8012/runbuncalc'},
  path: '.github/workflows/ci.yml',
  event: 'push',
  head_branch: 'master',
  status: 'completed',
  conclusion: 'success',
  head_sha: 'a'.repeat(40),
  id: 123,
  run_attempt: 2,
  run_number: 45,
};
const archive = Buffer.from('archive fixture');
const {privateKey, publicKey} = generateKeyPairSync('ed25519');

test('only successful master push CI builds from this repository are eligible', () => {
  assert.doesNotThrow(() => validateRun(run));
  for (const change of [
    {repository: {full_name: 'someone/fork'}},
    {head_repository: {full_name: 'someone/fork'}},
    {path: '.github/workflows/android-app.yml'},
    {event: 'pull_request'},
    {event: 'workflow_dispatch'},
    {head_branch: 'feature'},
    {status: 'in_progress'},
    {conclusion: 'failure'},
    {head_sha: 'master'},
    {id: 0},
    {run_attempt: 1.5},
    {run_number: -1},
  ]) {
    assert.throws(() => validateRun({...run, ...change}), JSON.stringify(change));
  }
});

test('manifest binds the immutable URL and archive to the exact CI attempt and native contract', () => {
  const manifest = createManifest(run, archive, 1);
  assert.equal(manifest.version, 'web-123-2');
  assert.equal(manifest.bundle.url,
    'https://github.com/tnclark8012/runbuncalc/releases/download/web-123-2/bundle.zip');
  assert.doesNotThrow(() => validateManifest(manifest, run, archive));
  assert.throws(() => validateManifest(manifest, {...run, run_attempt: 3}, archive));
  assert.throws(() => validateManifest(manifest, {...run, head_sha: 'b'.repeat(40)}, archive));
  assert.throws(() => validateManifest(manifest, run, Buffer.from('different archive')));
  assert.throws(() => validateManifest({...manifest, bundle: {...manifest.bundle, url: 'https://example.com/bundle.zip'}}, run, archive));
  for (const compatibility of [undefined, '1', 0, -1, 1.1]) {
    assert.throws(() => createManifest(run, archive, compatibility));
  }
});

test('signed envelopes can be promoted unchanged and authenticate the exact payload bytes', () => {
  const manifest = createManifest(run, archive, 1);
  const envelope = signManifest(manifest, privateKey);
  assert.deepEqual(verifyManifest(JSON.parse(JSON.stringify(envelope)), publicKey), manifest);
  const tampered = {...envelope, payload: Buffer.from(JSON.stringify({...manifest, nativeCompatibility: 2})).toString('base64')};
  assert.throws(() => verifyManifest(tampered, publicKey), /signature verification failed/);
  const wrongKey = generateKeyPairSync('ed25519').publicKey;
  assert.throws(() => verifyManifest(envelope, wrongKey), /signature verification failed/);
  assert.throws(() => verifyManifest({payload: envelope.payload}, publicKey), /Invalid signed update envelope/);
});

test('publication, retry, promotion and tags reuse the same signed bundle without regressing continuous', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'web-release-test-'));
  try {
    const stateFile = path.join(directory, 'state.json');
    const eventFile = path.join(directory, 'event.json');
    const preload = path.join(directory, 'api.cjs');
    const bin = path.join(directory, 'bin');
    mkdirSync(bin);
    writeFileSync(preload, `
      const fs = require('node:fs');
      global.fetch = async url => {
        const state = JSON.parse(fs.readFileSync(process.env.TEST_STATE));
        const endpoint = url.replace('https://api.github.com/repos/tnclark8012/runbuncalc/', '');
        const data = endpoint.startsWith('releases/tags/')
          ? state.releases[decodeURIComponent(endpoint.slice('releases/tags/'.length))]
          : state.api[endpoint];
        return new Response(JSON.stringify(data || {}), {status: data ? 200 : 404});
      };
    `);
    writeFileSync(path.join(bin, 'gh'), `#!/usr/bin/env node
      const fs = require('node:fs');
      const path = require('node:path');
      const [command, operation, tag, ...args] = process.argv.slice(2);
      const state = JSON.parse(fs.readFileSync(process.env.TEST_STATE));
      const option = name => args[args.indexOf(name) + 1];
      if (command === 'run' && operation === 'download') {
        const files = state.artifact;
        fs.mkdirSync(option('--dir'), {recursive: true});
        for (const [name, bytes] of Object.entries(files))
          fs.writeFileSync(path.join(option('--dir'), name), Buffer.from(bytes, 'base64'));
      } else if (command === 'release') {
        if (operation === 'create') state.releases[tag] = {
          draft: true, target_commitish: option('--target'), assets: {}
        };
        else if (operation === 'upload') {
          for (const file of args.filter(arg => fs.existsSync(arg) && fs.statSync(arg).isFile()))
            state.releases[tag].assets[path.basename(file)] = fs.readFileSync(file).toString('base64');
        } else if (operation === 'edit') state.releases[tag].draft = false;
        else if (operation === 'download') {
          fs.mkdirSync(option('--dir'), {recursive: true});
          for (let i = 0; i < args.length; i++) {
            if (args[i] !== '--pattern') continue;
            const name = args[++i];
            if (!state.releases[tag].assets[name]) throw new Error('Missing asset: ' + name);
            fs.writeFileSync(path.join(option('--dir'), name),
              Buffer.from(state.releases[tag].assets[name], 'base64'));
          }
        } else throw new Error('Unexpected release operation');
      } else throw new Error('Unexpected command');
      fs.writeFileSync(process.env.TEST_STATE, JSON.stringify(state));
    `, {mode: 0o700});
    const state = {
      api: {'actions/runs/123': run},
      releases: {},
      artifact: {
        'bundle.zip': archive.toString('base64'),
        'manifest.json': Buffer.from(JSON.stringify(createManifest(run, archive, 1))).toString('base64'),
      },
    };
    writeFileSync(stateFile, JSON.stringify(state));
    const execute = (eventName, ref, event) => {
      writeFileSync(eventFile, JSON.stringify(event));
      return execFileSync(process.execPath, ['--require', preload, 'scripts/web-release.mjs', 'publish'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PATH: `${bin}${path.delimiter}${process.env.PATH}`,
          TEST_STATE: stateFile,
          RUNNER_TEMP: directory,
          GITHUB_REPOSITORY: 'tnclark8012/runbuncalc',
          GITHUB_EVENT_PATH: eventFile,
          GITHUB_EVENT_NAME: eventName,
          GITHUB_REF: ref,
          GH_TOKEN: 'test-token',
          WEB_UPDATE_PRIVATE_KEY: privateKey.export({type: 'pkcs8', format: 'pem'}),
        },
      });
    };
    const readState = () => JSON.parse(readFileSync(stateFile, 'utf8'));
    const saveState = value => writeFileSync(stateFile, JSON.stringify(value));
    const auto = () => execute('workflow_run', 'refs/heads/master', {workflow_run: run});
    const corrupt = readState();
    corrupt.artifact['bundle.zip'] = Buffer.from('tampered archive').toString('base64');
    saveState(corrupt);
    assert.throws(auto, /metadata does not match/);
    assert.deepEqual(readState().releases, {});
    saveState(state);
    auto();
    const published = readState().releases['web-123-2'].assets;
    assert.deepEqual(readState().releases['web-continuous'].assets, {'update.json': published['update.json']});
    auto();
    assert.deepEqual(readState().releases['web-123-2'].assets, published);

    // Promotion works after the CI artifact has expired.
    const promoted = readState();
    delete promoted.artifact;
    saveState(promoted);
    execute('workflow_dispatch', 'refs/heads/master', {inputs: {run_id: '123'}});
    assert.equal(readState().releases['web-stable'].assets['update.json'], published['update.json']);

    const newer = readState();
    const newerManifest = createManifest({...run, id: 124, run_number: 46}, archive, 1);
    const newerEnvelope = Buffer.from(JSON.stringify(signManifest(newerManifest, privateKey))).toString('base64');
    newer.releases['web-continuous'].assets['update.json'] = newerEnvelope;
    newer.api['commits/v0.2.0'] = {sha: run.head_sha};
    newer.api[`actions/workflows/ci.yml/runs?event=push&branch=master&status=success&head_sha=${run.head_sha}&per_page=100`] =
      {workflow_runs: [run]};
    saveState(newer);
    assert.match(auto(), /continuous already points to a newer build/);
    assert.equal(readState().releases['web-continuous'].assets['update.json'], newerEnvelope);
    execute('push', 'refs/tags/v0.2.0', {});
    assert.deepEqual(readState().releases['v0.2.0'].assets, published);
    assert.equal(readState().releases['web-stable'].assets['update.json'], published['update.json']);
    assert.equal(readState().releases['web-continuous'].assets['update.json'], newerEnvelope);
    execute('push', 'refs/tags/v0.2.0', {});
    assert.deepEqual(readState().releases['v0.2.0'].assets, published);

    const invalid = readState();
    invalid.api['actions/runs/123'].conclusion = 'failure';
    saveState(invalid);
    assert.throws(auto, /successful master push run/);
    assert.deepEqual(readState().releases, invalid.releases);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
