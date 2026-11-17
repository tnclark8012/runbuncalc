# RnB Calc

The Android companion bundles the calculator's `index.html` locally inside
Capacitor, with React/TypeScript app settings. Android save access
uses the Storage Access Framework; no root, internet, or broad storage permission
is requested. Android 17+ (API 37) is required.

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
2. Select your **John GBA snapshot (.jgN)** and **Run & Bun ROM (.gba)**. Each
   connection can be a single document or a folder with a selected direct child.
   The existing shell's save connection is retained as the snapshot selection.
3. Return to the calculator. After the emulator finishes writing a snapshot, tap
   **Sync** to reread both selected documents, decode, and import boxes and party.

**Sync replaces existing calculator collections**, including manual set/party
edits, just like Import box. No JSON download or second import step is needed.
Nicknames become set names, with numbered duplicates. The richer game-state
snapshot is retained in collection metadata for future planner integration;
it does not hydrate the simulator. The researched decoder's ROM/layout limits
and unknown battle activity/phase still apply. Battery `.sav` files and `.jsN`
previews are not snapshots.

Read/decode/conversion failures are reported without importing partial data.
Missing or revoked documents require reselection in settings. Sync is manual,
not a watcher or live emulator-memory connection. ROM/save bytes are not uploaded,
cached in web storage, bundled in the APK, or written to an intermediate file.

## GitHub APK builds

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
requests arbitrary file reads, or persists ROM/save bytes. Plugin calls return
connection state, metadata, or the latest read's byte count and SHA-256.
For manual sync, `readSelected({target, includeData: true})` also returns bounded
base64 data from that selected document to the local decoder. Diagnostic reads
omit data. Targets are `snapshot` (the default, preserving the original shell
connection) and `rom`, each with independently persisted selections.

On Android:

- `SaveAccessPlugin` owns document-picker callbacks, operation serialization, and
  promise rejection with explicit error codes.
- `SaveDocumentRepository` owns granted URI access, provider queries, validating
  child selections, replacing/releasing grants, and background file reads.
- `SaveSelectionStore` owns a versioned, app-private record of selected document
  URIs. Android, not that record, owns the persisted permission grant.
- `SaveFileReader` streams and hashes bytes; sync additionally captures at most
  32 MiB per file for transfer to the WebView. Files are read sequentially.

All document I/O and preference commits run off the UI thread. Picker
cancellation leaves the previous connection unchanged. Access is checked again
when reading; revoked grants and deleted documents require reselection.
**Forget connection** clears that selection and releases its known grant unless
the other connection still uses it (for example, both selected the same folder).
Invalid/unknown preference schemas are reported explicitly and require forgetting
the connection; migrations must be added when a future schema changes.
Backup is disabled because restoring URI strings would not restore permission.

Connecting a different folder clears the old selected file. Folder listings
contain at most 200 direct child files, with explicit truncation; subfolders
require their own selection. Reads have an explicit 32 MiB limit. Metadata is
checked before and after a read to detect common concurrent-write cases, but
providers may omit metadata or reuse timestamps: this is not an atomic snapshot
guarantee. Wait for the emulator to finish saving.

Folder lists show only `.jgN` snapshots or `.gba` ROMs for the corresponding
connection (case-insensitive). Other extensions, including `.jsN` previews, are
rejected before changing the selection. Android's single-document picker uses
MIME filters rather than filename-extension filters; providers may still show
unsupported files if they label them as generic binary data. Use the connected
folder list for exact extension filtering.

Settings retains the diagnostic read/hash tools. The calculator's Sync uses the
same granted-document boundary and the reusable Run & Bun decoder, then calls
the same validated box-import function used by the browser's Import box button.
No arbitrary URI reader is exposed.

## Device acceptance check

Connect a local save folder or file, read it, force-stop/reopen the app, and
read again without another picker. Configure both ROM and snapshot, return to
the calculator and sync; check party/box counts and nicknames. Change the
snapshot in the emulator, sync again, and verify the imported changes survive
force-stop/reopen. Test cancellation, forgetting one of two shared-folder
connections, replacing a folder, revoked/missing access, and invalid snapshots.
Failed reads/decodes must leave the previous imported collection intact.

The earlier lightweight-shell prototype passed the central read/reopen/changed
hash trial on the user's phone. That is evidence for the Android storage approach,
not a completed device trial of this integrated Capacitor app.
