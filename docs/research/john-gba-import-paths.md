# John GBA save and battle-state import paths on Android

Research for tnclark8012/runbuncalc#114 (parent map #113). Planning evidence only; no architecture is selected and no implementation is proposed. No user saves, ROMs, or private data were accessed.

## Sourcing limitation (read first)

In the research environment, direct page fetches (`web_fetch`, `curl`) could reach only GitHub; developer.android.com, MDN, play.google.com and johnemulators.com failed DNS resolution. All "primary" quotes below come from search-tool excerpts of those first-party pages (the excerpt text is quoted; the full pages were **not** read). Treat each as "excerpt-verified, page-unread". No first-party John GBA documentation of save/state paths or file formats was found at all; those facts come only from community posts and are labelled **secondary/unverified**.

## Established (first-party excerpt)

| # | Claim | Source |
|---|---|---|
| E1 | John GBA's Play listing: "GBA emulator for android 6.0+"; features include "Search game files in SDCard & Internal Storage", "Save States (with previews)", "Dropbox support (requires John DataSync)", "No internet connection". Data safety (JA listing): no data collected or shared. | https://play.google.com/store/apps/details?id=com.johnemulators.johngba (search excerpts, en-NZ and ja locales) |
| E2 | An Android app using `ACTION_OPEN_DOCUMENT_TREE` gains access only to the directory the user selects. | https://developer.android.com/training/data-storage/shared/documents-files |
| E3 | `takePersistableUriPermission()` preserves a grant across device restarts, but "your app doesn't retain access to the URI if the associated document is moved or deleted"; the user must then be asked again. | same page |
| E4 | On Android 11 (API 30)+, `ACTION_OPEN_DOCUMENT_TREE` cannot be used to request certain directories, and individual files cannot be selected from some directories (the excerpt elides the list; the Android 11 storage page names `Android/data/` and `Android/obb/` as not shown by `ACTION_OPEN_DOCUMENT`, and the root of the Download directory as non-selectable by tree). | same page; https://developer.android.com/about/versions/11/privacy/storage |
| E5 | An app targeting Android 11 cannot access any other app's data directory, nor other apps' app-specific directories in external storage. | https://developer.android.com/about/versions/11/privacy/storage |
| E6 | Broad "all files" access via `READ_EXTERNAL_STORAGE` is read-only for apps targeting Android 11; read/write needs the all-files-access permission. | same page (excerpt: "this access to 'all files' is read-only … you must have the all files access permission"). Google Play policy on that permission was **not** retrieved. |
| E7 | `Window.showDirectoryPicker()` (File System Access API): Chrome 86, Edge 86, Opera 72, Chrome Android 132, Opera Android 87, Samsung Internet 29, WebView Android 132; **no** support in Firefox, Firefox Android, Safari, iOS. Marked Experimental. | https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker (compat table excerpt) |

## Secondary / unverified (community)

- S1: Users report John GBA keeps battery saves in a `save` folder and save states in `state`/`autostate` folders under a `Johnemulators/GBA` directory on shared storage; one user says the `.sav` files were 128 KB flash saves and that stale states override a replaced `.sav`. Sources: https://www.reddit.com/r/EmulationOnAndroid/comments/6rztg4/rejohn_gba_save_statesfiles/ (2017-era), https://tech-insider.org/john-gba-lite-pokemon-setup-2026/ (a third-party blog, cites wikiHow). Not first-party, may differ by app version (Lite vs paid, John GBA vs John GBA 2, Android version, SD card). Do **not** assume this path applies to the user's device, and do not derive it from the ROM location.
- S2: The same threads describe renaming `.sav` to `.sgm` for VBA import. This is a report about another emulator's tooling and is **not** evidence that save-state format is compatible.

## What this implies (possibilities, not selection)

1. **Ordinary battery save via user-picked folder.** If the saves sit in a shared-storage folder outside `Android/data`, a native app or a Chromium-based browser/PWA could ask the user once to pick that folder (SAF tree / `showDirectoryPicker`) and read it on a later "Sync" tap. Version dependencies: E4/E5 mean that if John GBA on a given Android version stores saves in its app-specific external directory (`Android/data/<pkg>`), the picker route is blocked on Android 11+ and would need the user to export via the emulator or use a file manager copy. Whether John GBA does this is **unknown**.
2. **Native app persistence.** E3 gives persisted folder grants surviving reboot; the grant is lost if the folder is moved/deleted. Android's docs excerpt gives no mechanism for background change notification to a third-party app's tree grant; whether a background observer or scheduled job could refresh automatically (and OS restrictions on it) is **not established** here — follow up with `ContentObserver`/WorkManager docs. Explicit tap-to-sync after setup is consistent with E2/E3.
3. **Browser/PWA.** E7 limits directory picking to Chromium browsers on Android (Chrome Android 132+ per MDN table). Firefox/Safari have no such API; a fallback is per-sync file upload via `<input type=file>` (not researched here). Persistence of handles across sessions, permission re-prompts and whether the grant requires a user gesture per session were **not** retrieved (see web.dev / MDN `FileSystemHandle.requestPermission`). Offline-capable use needs a service worker/installed PWA; not researched.
4. **Cloud route (listing-only).** E1 says Dropbox support needs "John DataSync". What it syncs (saves vs states), and the file layout in Dropbox, is unknown. It would add an online dependency at setup, contradicting "no private access" only if tokens are stored; not evaluated.
5. **Ordinary saves vs save states.** A battery save is the game's own save-RAM image (progress at the last in-game save). A save state is emulator-specific and captures full machine state (including RAM, where in-battle data would live). Nothing first-party documents John GBA's state format, compression or versioning. Without samples, a parser cannot be claimed feasible.
6. **Live memory.** Android's app sandbox (E5) prevents reading another process's memory without root; no sanctioned API exists. Any in-battle import is therefore only plausible through emulator-written save states (if decodable) or emulator-exposed features, both unverified. Root/private access is excluded as a baseline.
7. **Battle state from save states** would also need: mapping of RAM offsets for the specific ROM hack's build (not researched), and detecting in-battle vs overworld. Out of scope here.

## Unknowns and sample/version questions for follow-up

1. Exact John GBA package and version (John GBA vs John GBA Lite, build number) and Android version/API level and device/OEM (Samsung etc.).
2. Real folder paths on the device for battery saves, states, auto-states; is it `/storage/emulated/0/Johnemulators/GBA/…` or under `Android/data/…`? Does an SD card change this?
3. Does the app expose an in-app export/import of saves or a "choose folder" setting? (Needs first-party app inspection or manual.)
4. Is the `.sav` file the whole save-RAM image (sizes, e.g. 128 KB flash) for the user's ROM, and does it have any wrapper or footer? Please supply an anonymized sample or just its size, file name pattern and hex header.
5. Does the app write the battery save promptly after in-game save, or only on exit/pause (affects "sync now" freshness)?
6. Sample save state(s) from the user: file size, compression, header magic, whether they differ across app versions; a pair of states (in-battle and overworld) for the same save.
7. Do saves appear in the Android file picker (SAF) for the chosen folder on the user's Android version?
8. Does the user's browser (Chrome Android ≥132?) support the directory picker on that folder; are there blocked-folder messages?
9. Google Play policy and review constraints for all-files access (E6) were not retrieved.

## Not answered by this report

- John GBA's actual save/state file paths and formats (first-party documentation not found/reachable).
- Automatic-refresh restrictions (background execution limits, file observers) for either native or PWA.
- Persistence/permission-prompt behavior of File System Access handles in installed PWAs.
- Compatibility of John GBA files with any other emulator's formats: unverified and not claimed.
