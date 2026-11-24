# RnB Calc

The Android companion bundles the calculator's `index.html` locally inside
Capacitor, with React/TypeScript app settings. Android save access
uses the Storage Access Framework; no root or broad storage permission is
requested. Internet permission is used only to fetch public calculator updates
from GitHub; saves remain local. Android 17+ (API 37) is required.

## Layout

- `src/`: web UI, presentational components, hooks, and typed native-plugin contract.
- `android/`: checked-in Capacitor host, local `SaveAccess` plugin, storage adapters,
  Gradle wrapper, and native tests.
- `capacitor.config.ts`: application identity and bundled web directory.

`dist/`, copied Android web assets, and generated Capacitor plugin configuration
are ignored. Recreate them with `android:sync`, not manual edits. The app build
first builds the root calculator, then copies its pages, bundles and assets.
The installed app opens the calculator; `settings.html` configures file access.

## Development

### App icon

The launcher uses the supplied pixel-art Wigglytuff-at-a-laptop artwork, with
lettering removed for readability. `assets/icon.png` is the approved 1024px
master. The generator updates all Android density variants, round icons,
transparent adaptive foreground layers, and the matching teal background.
Round and adaptive variants trim the original frame and white margin; Android
controls the adaptive icon's final shape.

To regenerate from the repository root:

```sh
python3 -m venv /tmp/runbuncalc-icon-tools
/tmp/runbuncalc-icon-tools/bin/pip install -r app/scripts/requirements.txt
/tmp/runbuncalc-icon-tools/bin/python app/scripts/generate-icons.py
```

Icon-only changes do not require a web build or Capacitor sync; rebuild the
Android app to see them.

### Building

Install Node 22+, JDK 21, Android SDK platform `android-37.0`, and build-tools
`37.0.0`. Set
`ANDROID_HOME` to your SDK directory and `JAVA_HOME` to JDK 21.

```sh
npm ci
npm ci --prefix app
npm --prefix app run android:build
```

The APK is `android/app/build/outputs/apk/debug/app-debug.apk` relative to this
directory. Open the native project in Android Studio with
`npm --prefix app run android:open`. After web changes, run
`npm --prefix app run android:sync` before rebuilding/relaunching Android.
`npm --prefix app run dev` first builds the calculator, then watches app assets;
it does not watch calculator source, serve a website, or update the installed APK.

For web type checking and bundling only, use `npm --prefix app run build`.
The calculator still works in a browser; native Sync and its settings link appear
only on Android. Browser users can use the existing standalone snapshot decoder
and Import box. The settings page explicitly reports native access as unsupported
outside Android.

## Sync into the calculator

1. Open **App settings** from the calculator.
2. Choose your **John GBA save folder**, then tap a save-state tile. Each tile
   pairs a `.jg0` snapshot with the same filename's `.js0` screenshot
   (for example, `save.jg0` and `save.js0`). The screenshot is on the left and
   the filename without its extension is the label. The selected tile is marked
   **Connected** and its `.jg0` is used for Sync. Only slot 0 is supported,
   with one tile per game filename. No ROM file is required.
   Existing connections are retained; choose a folder to switch a legacy
   single-file connection to the tile picker.
3. Return to the calculator. After the emulator finishes writing a snapshot, tap
   **Sync** to reread the selected snapshot, decode, and import boxes and party.

**Sync replaces existing calculator collections**, including manual set/party
edits, just like Import box. No JSON download or second import step is needed.
Nicknames become set names, with numbered duplicates. The richer game-state
snapshot is retained in collection metadata for future planner integration;
it does not hydrate the simulator. The app bundles the decoder's small lookup
tables for the reference Run & Bun revision, not the ROM. Other ROM revisions or
modified games are not verified; snapshot validation cannot identify every
incompatible revision. The decoder's layout limits and unknown battle activity/phase
still apply. Battery `.sav` files and `.jsN`
previews are not snapshots.

Read/decode/conversion failures are reported without importing partial data.
Missing or revoked documents require reselection in settings. Sync is manual,
not a watcher or live emulator-memory connection. During Sync, snapshot bytes
are not uploaded,
cached in web storage, bundled in the APK, or written to an intermediate file.
No ROM is read during Sync.

## Bug reports (Android and browser)

The calculator's center column has an **App** section above Notes. Select
**Report bug** to prepare a diagnostic ZIP locally. The first report explains
public sharing; acknowledgment is remembered on that device/browser.

1. Review the capture status and any missing diagnostics.
2. Select **Save ZIP and open GitHub**. Android asks where to save the ZIP;
   browsers download it. The ZIP filename is copied to the clipboard when
   possible, or displayed for manual copying.
3. In the GitHub issue editor, describe the bug and expected behavior, then use
   the paperclip to attach the saved ZIP. Review its contents before posting.
   The filename on the clipboard does not attach the file.

The ZIP includes calculator controls (including unsaved notes), app-specific
stored collections/settings, selected calculator runtime state, available decoded
JG snapshots, a visible-viewport screenshot, and build/environment metadata.
On Android it also reads the **currently connected JG file at report time**.
That file may differ from the previously synced decoded snapshot; both are
labelled separately. No additional JG copy is retained at sync time, and ROMs
are not included. Native screenshots exclude Android system UI; browser
screenshots render the visible page DOM and may differ from native rendering.

Missing/disconnected JG data or other capture failures are listed in
`manifest.json` and the report dialog; partial reports are allowed. A failed
or cancelled Android ZIP save does not open GitHub. Browser downloads must be
checked by the user because the page cannot verify that a download was retained.
Nothing is uploaded automatically, and the app needs no GitHub token. Attaching
the ZIP to a public issue makes its save, notes, and screenshot public.
This is export-only, not an automatic restore, interaction-history, or RNG replay.

Android keeps the prepared ZIP in memory, not in activity saved state, while
the document picker is open. If Android destroys the app during the picker,
prepare the report again; the ZIP payload is not restored.

## GitHub APK builds

Web-only update bundles have a separate [release pipeline](../docs/web-releases.md)
with continuous and stable channels, CI-run promotion, and version tags.
The app automatically checks the continuous channel after the calculator starts.
App settings shows update status and offers a manual check. Downloads are
verified using the pinned Ed25519 public key, native compatibility generation,
archive size, and SHA-256, then extracted into app-private storage with path,
file-count, and expanded-size limits.

Updates never replace an open calculator. Fully close and reopen the app to
activate a staged update. The first launch must acknowledge calculator
initialization within 30 foreground seconds; otherwise the app restores the
previous working download or the calculator bundled in the APK. Killing the app
before that acknowledgement also rolls back on the next launch. A failed
version is not downloaded again until the channel points to a different
version. The installed calculator works offline, including first use, and
network/signature/download failures leave it intact and appear in settings.
Automatic checks run once per activity lifetime, not continuously in the
background; there is no mobile-data restriction.

This APK supports native compatibility generation 2, which adds the startup
acknowledgement contract. Earlier generation-1 web releases are intentionally
rejected. Merge this change and wait for its generation-2 web release before
expecting a successful update check. Native changes, pinned-key changes, or
incompatible web changes still need a new APK. Installing a new APK discards
downloaded web versions in favor of its bundled assets; imported collections
and document grants are not cleared. Updates retain the same local WebView
origin, so browser storage stays local and is not reset by activation.

For a device acceptance check: install this APK, launch offline, then go online
and check for updates. Confirm a pending version appears without reloading the
calculator; fully close/reopen and verify the active version, save access, and
collections. Reopen offline. Exercise invalid signatures, interrupted downloads,
and a signed test bundle without startup acknowledgement in a nonproduction
test channel/build; verify rollback and quarantine without touching production
channel assets. Native automated tests cover signature/compatibility validation,
archive tampering/traversal/size limits, and persisted activation/rollback.

APK distribution remains separate:

The **RnB Calc Android** workflow builds the web UI, syncs Capacitor, runs Android
unit tests and lint, and uploads `rnb-calc-debug` containing `app-debug.apk`.
It runs for app or calculator changes on pushes and pull requests, or manually after the
workflow exists on the default branch. Review/approve a run if GitHub requires it.
Signed-in GitHub users can download the ZIP artifact from a successful run,
extract the APK, and sideload it without a Play Store account.

Artifacts expire after 14 days. The hosted runner's debug key is not a stable
release signing key: a later APK may require uninstalling the previous build.
Uninstalling clears the saved connection and its permissions. Do not confuse
this with force-stop/reopen, which retains the same installed build.
The app has a different application ID from the throwaway prototype and requires
its own initial document grant.

## Storage boundary

The web UI calls the typed `SaveAccessPlugin` contract in
`src/storage/save-access.ts`. It never persists an absolute filesystem path,
requests arbitrary file reads, or persists snapshot bytes. Plugin calls return
connection state, metadata, or the latest read's byte count and SHA-256.
For manual sync, `readSelected({target, includeData: true})` also returns bounded
base64 data from that selected document to the local decoder. Diagnostic reads
omit data. The UI and Sync use only `snapshot` (the default, preserving the
original shell connection). The native contract retains the legacy `rom` target
for compatibility; previous ROM grants/selections are not read or required.

On Android:

- `SaveAccessPlugin` owns document-picker callbacks, operation serialization, and
  promise rejection with explicit error codes.
- `SaveDocumentRepository` owns granted URI access, provider queries, validating
  child selections, replacing/releasing grants, and background file reads.
- `SaveSelectionStore` owns a versioned, app-private record of selected document
  URIs. Android, not that record, owns the persisted permission grant.
- `SaveFileReader` streams and hashes bytes; sync additionally captures at most
  32 MiB for transfer to the WebView.

All document I/O and preference commits run off the UI thread. Picker
cancellation leaves the previous connection unchanged. Access is checked again
when reading; revoked grants and deleted documents require reselection.
**Forget connection** clears that selection and releases its known grant unless
the other connection still uses it (for example, both selected the same folder).
Invalid/unknown preference schemas are reported explicitly and require forgetting
the connection; migrations must be added when a future schema changes.
Backup is disabled because restoring URI strings would not restore permission.

Connecting a different folder clears the old selected file. Folder listings
check at most 200 direct child snapshots for matching screenshots, with explicit truncation; subfolders
require their own selection. Reads have an explicit 32 MiB limit. Metadata is
checked before and after a read to detect common concurrent-write cases, but
providers may omit metadata or reuse timestamps: this is not an atomic snapshot
guarantee. Wait for the emulator to finish saving.

The snapshot folder list shows only matching `.jg0`/`.js0` pairs
(case-insensitive). Other slots, unpaired files, and directories
are not shown. Screenshot documents are displayed locally through Capacitor's
content-URI bridge using the folder's read grant; they are not uploaded or decoded
as snapshots. A screenshot that cannot be displayed is marked unavailable, but
its snapshot can still be selected. **Refresh folder** reloads the listing after
the emulator creates or removes saves. Only `.jg0` documents can become the
snapshot selection; previews and other extensions are rejected before changing it.

Settings retains the read/hash tools under **Connection diagnostics**. The calculator's Sync uses the
same granted-document boundary and the reusable Run & Bun decoder, then calls
the same validated box-import function used by the browser's Import box button.
No arbitrary URI reader is exposed.

## Device acceptance check

Choose a local save folder and verify that only matching `.jg0`/`.js0` pairs
appear, with screenshots and extension-free labels. Select a tile, read it,
force-stop/reopen the app, and read again without another picker. Verify that
the connected tile is retained and choosing another tile changes the snapshot
used by Sync. Configure only the snapshot, return to
the calculator and sync; check party/box counts and nicknames. Change the
snapshot in the emulator, sync again, and verify the imported changes survive
force-stop/reopen. Verify Sync ignores a missing/revoked legacy ROM selection.
Test cancellation, forgetting the snapshot connection (including a folder shared
with a legacy ROM selection), replacing a folder, revoked/missing access, and invalid snapshots.
Failed reads/decodes must leave the previous imported collection intact.

The earlier lightweight-shell prototype passed the central read/reopen/changed
hash trial on the user's phone. That is evidence for the Android storage approach,
not a completed device trial of this integrated Capacitor app.
