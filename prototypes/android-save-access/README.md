# Android save access PROTOTYPE

Throwaway experiment for [Verify offline web UI and retained Android save-file access on a phone](https://github.com/tnclark8012/runbuncalc/issues/121).
Not a production architecture choice, save parser, or PWA.

The interface is bundled HTML/CSS/JavaScript in an Android WebView. A small Java
bridge uses the Storage Access Framework to read user-selected documents.
No root, internet permission, broad storage permission, server, or uploaded saves.
Android 8.0+ is required. Only selected document URIs and Android permission grants
are persisted; file contents are streamed locally to compute byte count and SHA-256.

## Get an APK from GitHub

Push this branch, then open the **Android save access PROTOTYPE** run under the
repository's Actions tab. The push workflow runs only on
`prototype/android-save-access`; no merge is needed. Download the
`save-access-prototype-debug` artifact from a successful run, unzip it, and install
`app-debug.apk` on the phone. Android may require allowing installation from the
browser or file manager used to open it. No Play Store account is required.

This is a debug-signed APK, not a Play Store release. GitHub-hosted runners
generate a debug key per build, so later builds may require uninstalling the
previous app, which clears its remembered selection. This is separate from the
force-stop/reopen retention check, which must keep the same installed build.
GitHub artifact downloads normally require being signed into GitHub and expire
after 14 days. The Actions run must be permitted by repository policy.

## Build locally

With JDK 17, Gradle 8.11.1, and Android SDK platform/build-tools 35 installed:

```sh
gradle -p prototypes/android-save-access :app:assembleDebug :app:lintDebug
```

Set `ANDROID_HOME` to the SDK location. The output is
`app/build/outputs/apk/debug/app-debug.apk` under this directory.
The prototype has no npm dependencies and does not build the calculator.

## Phone trial

1. Select the local save folder with Android's system picker. Pick a file from
   the listing and read it. Confirm the displayed actual byte count and SHA-256.
2. Force-stop the app through Android settings, reopen it, and use **Reread
   remembered file**. No second picker should be needed.
3. Make an in-game save with changed progress, then reread. Record whether the
   hash changes. Whether or when John GBA flushes saves is not controlled here.
4. Repeat a read in airplane mode. If folder access is refused, try the
   single-file picker and note the exact behavior.

For feedback, share Android/John GBA versions and success/failure of these steps,
not the save itself or screenshots containing private filenames.

## Limits

Only direct child files are listed (up to 200); choose a narrower folder for
subfolders. Reads are capped at 32 MiB with an explicit error. Access may need
renewal if revoked or a document is moved, deleted, or replaced by its provider.
The bridge is available only to the bundled page: navigation and resource loads
are blocked, and no internet permission is requested.

Reading `.sav` bytes does not prove that Pokemon data can be decoded. Emulator
save states can be selected as files but their format is not decoded. Live
emulator memory and background monitoring are not tested. No phone result has
been established until a human completes the trial.
