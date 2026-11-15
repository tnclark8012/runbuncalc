# RnB Calc

The Android companion lives here independently of the existing calculator build.
Its UI is React/TypeScript, bundled locally inside Capacitor. Android save access
uses the Storage Access Framework; no root, internet, or broad storage permission
is requested. Android 17+ (API 37) is required.

## Layout

- `src/`: web UI, presentational components, hooks, and typed native-plugin contract.
- `android/`: checked-in Capacitor host, local `SaveAccess` plugin, storage adapters,
  Gradle wrapper, and native tests.
- `capacitor.config.ts`: application identity and bundled web directory.

`dist/`, copied Android web assets, and generated Capacitor plugin configuration
are ignored. Recreate them with `android:sync`, not manual edits. The legacy
calculator and `calc/` are not part of this app build.

## Development

Install Node 22+, JDK 21, and Android SDK platform/build-tools 37. Set
`ANDROID_HOME` to your SDK directory and `JAVA_HOME` to JDK 21.

```sh
npm ci --prefix app
npm --prefix app run android:build
```

The APK is `android/app/build/outputs/apk/debug/app-debug.apk` relative to this
directory. Open the native project in Android Studio with
`npm --prefix app run android:open`. After web changes, run
`npm --prefix app run android:sync` before rebuilding/relaunching Android.
`npm --prefix app run dev` watches web assets; it does not serve a development
website or update the installed APK.

For web type checking and bundling only, use `npm --prefix app run build`.
The page can render in a browser but explicitly reports Android save access as
unsupported; no browser upload or iOS implementation is provided yet.

## GitHub APK builds

The **RnB Calc Android** workflow builds the web UI, syncs Capacitor, runs Android
unit tests and lint, and uploads `rnb-calc-debug` containing `app-debug.apk`.
It runs for app changes on pushes and pull requests, or manually after the
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
requests arbitrary file reads, or receives save bytes. Plugin calls return
connection state, metadata, or the latest read's byte count and SHA-256.

On Android:

- `SaveAccessPlugin` owns document-picker callbacks, operation serialization, and
  promise rejection with explicit error codes.
- `SaveDocumentRepository` owns granted URI access, provider queries, validating
  child selections, replacing/releasing grants, and background file reads.
- `SaveSelectionStore` owns a versioned, app-private record of selected document
  URIs. Android, not that record, owns the persisted permission grant.
- `SaveFileReader` streams and hashes bytes without loading the complete save
  into the WebView or retaining a save copy.

All document I/O and preference commits run off the UI thread. Picker
cancellation leaves the previous connection unchanged. Access is checked again
when reading; revoked grants and deleted documents require reselection.
**Forget connection** clears the app's selection and releases its known grant.
Invalid/unknown preference schemas are reported explicitly and require forgetting
the connection; migrations must be added when a future schema changes.
Backup is disabled because restoring URI strings would not restore permission.

Connecting a different folder clears the old selected file. Folder listings
contain at most 200 direct child files, with explicit truncation; subfolders
require their own selection. Reads have an explicit 32 MiB limit. Metadata is
checked before and after a read to detect common concurrent-write cases, but
providers may omit metadata or reuse timestamps: this is not an atomic snapshot
guarantee. Wait for the emulator to finish saving.

The built-in page intentionally remains a minimal diagnostic: connect, select,
read, inspect metadata/hash, refresh, or forget. Save decoding, retained imported
snapshots, emulator save-state parsing, live memory, background sync, and battle
planning are not implemented. Future parsing/import code should consume native
storage through this boundary rather than exposing arbitrary URI reads to the UI.

## Device acceptance check

Connect a local save folder or file, read it, force-stop/reopen the app, and
read again without another picker. Save changed progress in the emulator and
confirm the SHA-256 changes after another read. Test cancellation, forgetting,
replacing a folder, and revoked/missing access as well.

The earlier lightweight-shell prototype passed the central read/reopen/changed
hash trial on the user's phone. That is evidence for the Android storage approach,
not a completed device trial of this Capacitor app.
