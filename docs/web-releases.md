# Web update releases

This pipeline publishes Android-ready web bundles to the public
`tnclark8012/runbuncalc` GitHub Releases. The Android app checks the continuous
channel, verifies signatures using its pinned public key, and stages updates for
the next launch with offline fallback and startup rollback. Native APK builds
remain in the Android workflow; see [app behavior](../app/README.md#github-apk-builds).

## One-time signing setup

An administrator must configure the `WEB_UPDATE_PRIVATE_KEY` Actions secret
before the first publication. Generate an Ed25519 key outside the repository:

```sh
key_dir=$(mktemp -d)
openssl genpkey -algorithm ED25519 -out "$key_dir/private.pem"
openssl pkey -in "$key_dir/private.pem" -pubout -out "$key_dir/public.pem"
gh secret set WEB_UPDATE_PRIVATE_KEY --repo tnclark8012/runbuncalc < "$key_dir/private.pem"
```

Keep the private key in a secure backup and the public key for pinning in the
app updater. Its pinned public key is in
`app/android/app/src/main/java/com/runbuncalc/app/updates/UpdateManifest.java`.
Do not commit the private key or upload it as an artifact.
After securely retaining the keys, remove these two temporary files and their
directory. A release must fail, not publish unsigned, if signing is unavailable.
Do not replace the signing key without a key-rotation plan and an app update:
existing releases and channel manifests are verified with this key.

## Build and publish

On each master push, CI runs the tests and builds both the website and the
Android-ready web UI. Pages deploys the root `dist` artifact from that same build;
it no longer rebuilds the website in the deployment job.

CI uploads `web-release-<attempt>` containing:

- `bundle.zip`: the contents of `app/dist`, with `index.html` at the archive root.
- `manifest.json`: unsigned build metadata checked before release signing.

After the entire CI workflow succeeds, **Web releases** verifies the run through
the GitHub API and publishes prerelease `web-<run-id>-<attempt>` containing
`bundle.zip` and signed `update.json`. Published version assets are never
overwritten by the pipeline. Retrying publication reuses and verifies them.
It then advances the **continuous** channel. Older CI runs finishing late cannot
move continuous backwards. Every successful master push can therefore create a
prerelease; no update is published from pull requests, forks, failed CI, or a
manually dispatched CI build.

The publishing workflow runs trusted scripts from master, not the triggering
branch or an extracted bundle. Publication is serialized to avoid concurrent
channel writes. GitHub Actions can replace an older pending run in the same
concurrency group; a skipped publication can be rerun. The release workflow must
exist on the default branch before its `workflow_run` trigger works.

## Promote a particular build

Find the successful master push run under **Actions > CI**, and use its numeric
run ID (from the run URL, not its display number):

```sh
gh workflow run web-release.yml --repo tnclark8012/runbuncalc \
  --ref master -f run_id=123456789
```

This advances **stable** to the selected build without rebuilding or changing
continuous. Selecting an older build is an explicit stable rollback. Permanent
release assets are preferred over CI artifacts, so already-published builds can
be promoted after artifact expiration. If the build has never been published,
its CI artifact must still exist (retained for 30 days). The private signing key
is also required for promotion and verification.

## Tag a stable release

After master CI succeeds for a commit:

```sh
git tag v0.2.0 <commit-sha>
git push origin v0.2.0
```

Tags must have the form `vMAJOR.MINOR.PATCH`. The release workflow finds a
successful master push CI run for that exact commit, reuses its bundle, creates
the named stable GitHub Release, and advances stable. No rebuild occurs. If the
tag arrives before CI succeeds, the workflow fails explicitly; rerun it after
CI completes. Do not move an existing version tag. Tags do not build APKs.

## Consumer contract

Channel endpoints are:

```text
https://github.com/tnclark8012/runbuncalc/releases/download/web-continuous/update.json
https://github.com/tnclark8012/runbuncalc/releases/download/web-stable/update.json
```

These are prereleases with a single replaceable asset, not immutable version
releases. The stable channel is created on its first promotion. Consumers must
use an explicit channel endpoint, not GitHub's "latest release" ordering. No
GitHub token belongs in the app.

`update.json` is a JSON envelope with base64 `payload` and `signature`. Verify
the Ed25519 signature over the decoded payload bytes using the pinned public
key **before** parsing/trusting its metadata. The decoded UTF-8 JSON has this
shape:

```json
{
  "schemaVersion": 1,
  "version": "web-123456789-1",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "runId": 123456789,
  "runAttempt": 1,
  "runNumber": 42,
  "nativeCompatibility": 1,
  "bundle": {
    "url": "https://github.com/tnclark8012/runbuncalc/releases/download/web-123456789-1/bundle.zip",
    "sha256": "<64 lowercase hexadecimal characters>",
    "size": 123456
  }
}
```

The same signed envelope and ZIP are reused for channel promotion and named
releases. Its URL always points to the immutable build release. Signatures
authenticate metadata; size and SHA-256 bind it to the downloaded archive.
HTTPS alone or a checksum beside an unsigned bundle is not this trust boundary.

`app/web-release.json` defines the native compatibility generation. Increment it
when the bundle requires incompatible native APIs, plugins, or updater behavior,
and ship a matching APK. The updater must accept only its supported
generation and schema, restrict download destinations, validate archive paths
and limits, stage and verify the whole bundle before activation, and retain a
working offline fallback. It must handle channel/network/cache failures without
discarding the working version. Signing does not provide freshness or prevent
replay of an older signed release; stable rollback is intentionally supported.
The current app consumes continuous only. Generation 2 adds an explicit startup
acknowledgement after calculator UI initialization; generation-1 releases cannot
be activated by this APK. Changing channels or verification keys requires an APK
change; publishing infrastructure supports stable independently.

Channel release tags themselves do not identify the currently selected commit;
the signed manifest is authoritative. Release management must permit replacing
channel assets. Do not enable repository-wide release immutability without
moving the mutable channel pointers elsewhere.

## Local checks

```sh
npm run test:releases
npm --prefix app run build
```

Packing and publishing require GitHub Actions metadata. Publishing also requires
`gh`, network access, and the signing secret. Never test publishing against the
production channels just to validate a pull request.
