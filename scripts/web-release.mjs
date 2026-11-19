import {createHash, createPrivateKey, createPublicKey, sign, verify} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const repository = 'tnclark8012/runbuncalc';
const assetName = 'bundle.zip';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateRun(run) {
  assert(run.repository?.full_name === repository && run.head_repository?.full_name === repository,
    'Only this repository can publish updates.');
  assert(run.path === '.github/workflows/ci.yml' && run.event === 'push' &&
    run.head_branch === 'master' && run.status === 'completed' && run.conclusion === 'success',
    'Updates require a successful master push run of CI.');
  assert(/^[a-f0-9]{40}$/.test(run.head_sha), 'Invalid source commit.');
  for (const field of ['id', 'run_attempt', 'run_number']) {
    assert(Number.isSafeInteger(run[field]) && run[field] > 0, `Invalid CI ${field}.`);
  }
}

export function createManifest(run, bytes, nativeCompatibility) {
  validateRun(run);
  assert(Number.isSafeInteger(nativeCompatibility) && nativeCompatibility > 0,
    'nativeCompatibility must be a positive integer.');
  const version = `web-${run.id}-${run.run_attempt}`;
  return {
    schemaVersion: 1,
    version,
    commit: run.head_sha,
    runId: run.id,
    runAttempt: run.run_attempt,
    runNumber: run.run_number,
    nativeCompatibility,
    bundle: {
      url: `https://github.com/${repository}/releases/download/${version}/${assetName}`,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      size: bytes.length,
    },
  };
}

export function validateManifest(manifest, run, bytes) {
  const expected = createManifest(run, bytes, manifest.nativeCompatibility);
  assert(JSON.stringify(manifest) === JSON.stringify(expected),
    'Bundle metadata does not match the selected CI build or archive.');
}

export function signManifest(manifest, key) {
  const bytes = Buffer.from(JSON.stringify(manifest));
  return {
    payload: bytes.toString('base64'),
    signature: sign(null, bytes, key).toString('base64'),
  };
}

export function verifyManifest(envelope, publicKey) {
  assert(typeof envelope.payload === 'string' && typeof envelope.signature === 'string',
    'Invalid signed update envelope.');
  const bytes = Buffer.from(envelope.payload, 'base64');
  assert(verify(null, bytes, publicKey, Buffer.from(envelope.signature, 'base64')),
    'Update signature verification failed.');
  return JSON.parse(bytes.toString('utf8'));
}

function gh(...args) {
  return execFileSync('gh', args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
}

async function api(endpoint, optional = false) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (optional && response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub ${endpoint}: HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function release(tag) {
  return api(`releases/tags/${encodeURIComponent(tag)}`, true);
}

async function publishRelease(tag, commit, directory, files, prerelease) {
  const existing = await release(tag);
  assert(!existing || existing.draft, `Published release ${tag} cannot be replaced.`);
  if (!existing) {
    gh('release', 'create', tag, '--repo', repository, '--target', commit, '--draft',
      '--title', tag, '--notes', `Web update from ${commit}. Native APK updates are separate.`,
      ...(prerelease ? ['--prerelease'] : []));
  }
  gh('release', 'upload', tag, '--repo', repository, '--clobber',
    ...files.map(file => path.join(directory, file)));
  gh('release', 'edit', tag, '--repo', repository, '--draft=false',
    `--prerelease=${prerelease}`, `--latest=${!prerelease}`);
}

async function resolveRun(event, eventName, ref) {
  if (eventName === 'workflow_run') {
    const run = await api(`actions/runs/${event.workflow_run.id}`);
    // A rerun must not substitute a different attempt for the event that triggered publishing.
    assert(run.run_attempt === event.workflow_run.run_attempt, 'CI attempt changed; use the newer completion.');
    return {run, channel: 'continuous'};
  }
  if (eventName === 'workflow_dispatch') {
    assert(ref === 'refs/heads/master', 'Run promotions from master.');
    assert(/^[1-9][0-9]*$/.test(event.inputs.run_id), 'Provide a numeric CI run ID.');
    return {run: await api(`actions/runs/${event.inputs.run_id}`), channel: 'stable'};
  }
  assert(eventName === 'push' && /^refs\/tags\/v\d+\.\d+\.\d+$/.test(ref),
    'Stable tags must have the form v1.2.3.');
  const tag = ref.slice('refs/tags/'.length);
  const commit = await api(`commits/${encodeURIComponent(tag)}`);
  const runs = await api(`actions/workflows/ci.yml/runs?event=push&branch=master&status=success&head_sha=${commit.sha}&per_page=100`);
  const run = runs.workflow_runs.find(candidate => candidate.head_sha === commit.sha);
  assert(run, `No successful master CI build exists for ${tag}. Wait for CI, then rerun this workflow.`);
  return {run: await api(`actions/runs/${run.id}`), channel: 'stable', tag};
}

async function publish() {
  assert(process.env.GITHUB_REPOSITORY === repository, 'Publishing from forks is disabled.');
  assert(process.env.GH_TOKEN, 'GH_TOKEN is required.');
  assert(process.env.WEB_UPDATE_PRIVATE_KEY,
    'Configure the WEB_UPDATE_PRIVATE_KEY Actions secret before publishing web updates.');
  const key = createPrivateKey(process.env.WEB_UPDATE_PRIVATE_KEY);
  assert(key.asymmetricKeyType === 'ed25519', 'The update signing key must be Ed25519.');
  const publicKey = createPublicKey(key);
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const {run, channel, tag} = await resolveRun(event, process.env.GITHUB_EVENT_NAME, process.env.GITHUB_REF);
  validateRun(run);
  const version = `web-${run.id}-${run.run_attempt}`;
  const directory = mkdtempSync(path.join(process.env.RUNNER_TEMP || tmpdir(), 'web-release-'));
  try {
    const existing = await release(version);
    if (existing && !existing.draft) {
      gh('release', 'download', version, '--repo', repository, '--dir', directory,
        '--pattern', assetName, '--pattern', 'update.json');
    } else {
      gh('run', 'download', String(run.id), '--repo', repository,
        '--name', `web-release-${run.run_attempt}`, '--dir', directory);
      const manifest = JSON.parse(readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
      const bytes = readFileSync(path.join(directory, assetName));
      validateManifest(manifest, run, bytes);
      writeFileSync(path.join(directory, 'update.json'), JSON.stringify(signManifest(manifest, key)) + '\n');
      await publishRelease(version, run.head_sha, directory, [assetName, 'update.json'], true);
    }
    const update = JSON.parse(readFileSync(path.join(directory, 'update.json'), 'utf8'));
    const manifest = verifyManifest(update, publicKey);
    validateManifest(manifest, run, readFileSync(path.join(directory, assetName)));

    if (tag) {
      const tagged = await release(tag);
      if (tagged && !tagged.draft) {
        assert(tagged.target_commitish === run.head_sha, `Release ${tag} already targets another commit.`);
        const taggedDirectory = path.join(directory, 'tagged');
        gh('release', 'download', tag, '--repo', repository, '--dir', taggedDirectory,
          '--pattern', 'update.json', '--pattern', assetName);
        assert(readFileSync(path.join(taggedDirectory, 'update.json'), 'utf8') ===
          readFileSync(path.join(directory, 'update.json'), 'utf8') &&
          readFileSync(path.join(taggedDirectory, assetName)).equals(readFileSync(path.join(directory, assetName))),
          `Release ${tag} already contains different assets.`);
      } else {
        await publishRelease(tag, run.head_sha, directory, [assetName, 'update.json'], false);
      }
    }

    const channelTag = `web-${channel}`;
    const channelRelease = await release(channelTag);
    if (channelRelease && !channelRelease.draft) {
      if (channel === 'continuous') {
        const currentDirectory = path.join(directory, 'current');
        gh('release', 'download', channelTag, '--repo', repository, '--dir', currentDirectory,
          '--pattern', 'update.json');
        const current = verifyManifest(JSON.parse(readFileSync(path.join(currentDirectory, 'update.json'), 'utf8')), publicKey);
        if (current.runNumber > run.run_number ||
            (current.runNumber === run.run_number && current.runAttempt > run.run_attempt)) {
          console.log(`Published ${version}; continuous already points to a newer build.`);
          return;
        }
      }
      gh('release', 'upload', channelTag, path.join(directory, 'update.json'),
        '--repo', repository, '--clobber');
    } else {
      await publishRelease(channelTag, run.head_sha, directory, ['update.json'], true);
    }
    console.log(`Published ${version} to ${channel}${tag ? ` as ${tag}` : ''}.`);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
}

function pack() {
  const run = {
    repository: {full_name: repository},
    head_repository: {full_name: repository},
    path: '.github/workflows/ci.yml',
    event: process.env.GITHUB_EVENT_NAME,
    head_branch: process.env.GITHUB_REF_NAME,
    status: 'completed',
    conclusion: 'success',
    head_sha: process.env.GITHUB_SHA,
    id: Number(process.env.GITHUB_RUN_ID),
    run_attempt: Number(process.env.GITHUB_RUN_ATTEMPT),
    run_number: Number(process.env.GITHUB_RUN_NUMBER),
  };
  const archive = path.resolve('web-release/bundle.zip');
  assert(!existsSync(archive), 'Remove the previous web-release/bundle.zip before packaging again.');
  mkdirSync(path.dirname(archive), {recursive: true});
  execFileSync('zip', ['-q', '-r', archive, '.'], {cwd: 'app/dist'});
  const config = JSON.parse(readFileSync('app/web-release.json', 'utf8'));
  const manifest = createManifest(run, readFileSync(archive), config.nativeCompatibility);
  writeFileSync('web-release/manifest.json', JSON.stringify(manifest) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const command = process.argv[2];
  assert(command === 'pack' || command === 'publish', 'Expected pack or publish.');
  if (command === 'pack') pack();
  else await publish();
}
