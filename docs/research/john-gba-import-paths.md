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

## Addendum: narrow follow-up — SAF folder access to an ordinary shared-storage subfolder (Android 11+)

Scope: only whether a native Android app, unrooted, without `MANAGE_EXTERNAL_STORAGE`, can read a normal shared-storage folder such as `/storage/emulated/0/Johnemulators/GBA/save/` (user-reported path, S1; not verified for any John GBA version). No file name or content from the user's sample was recorded; no file format support is claimed.

### Evidence quality
`developer.android.com` still cannot be fetched directly (DNS). The text below is from web-search excerpts of the official pages (page-unread, excerpt-verified), crawled 2026-11-14/15 per the search index. One list (restricted directories) is **not fully visible** in official excerpts: the excerpts end with "the following directories:" and elide the bullets. Items marked *(secondary)* come from Stack Overflow posts that quote the official page; items marked *(provisional)* are recalled, not seen.

### Findings
1. **Tree picker is the right mechanism, and a subfolder is allowed.** Official (documents-files page): `ACTION_OPEN_DOCUMENT_TREE` (API 21+) "allows users to select a specific directory, granting your app access to all of the files and sub-directories within that directory"; the app gets access "only to the files in the directory that the user selects", with "some exceptions starting in Android 11". It needs no storage permission (the page states the picker mechanism "requires no system permissions", seen in the zh-CN excerpt). So `…/Johnemulators/GBA/save/` (or `Johnemulators/GBA/`, which would also cover `state` folders) is selectable **if** it is not in the blocked list below.
2. **Android 11+ blocked list for tree selection** *(secondary, quoting the official page)*: root of the internal-storage volume; root of each SD-card volume the OEM considers reliable (emulated or removable); the `Download` directory. Official zh-CN excerpt confirms `Download` is in the first list. A separate official list covers directories from which **individual files** cannot be selected via `ACTION_OPEN_DOCUMENT`/tree; its contents are elided in the excerpts. The Android 11 storage page names other apps' data directories and other apps' app-specific external directories (`Android/data/<pkg>`, `Android/obb`) as inaccessible (E5); that `Android/data` and `Android/obb` plus subdirectories are the elided entries is *(provisional)*. A path like `/Johnemulators/GBA/save` is a non-root, non-Download, non-`Android` folder, so none of these entries applies — but this is inference from the lists, not tested on a device. Practical consequence: the user must pick `Johnemulators` (or `GBA`/`save`), not "Internal storage" itself.
3. **Persisted grants.** Official: the grant from opening lasts until reboot unless the app calls `takePersistableUriPermission()` with `FLAG_GRANT_READ_URI_PERMISSION` (|WRITE); it then persists across restarts. Caveat (official): access is lost "if the associated document is moved or deleted"; the app must ask again. So one-time setup followed by one-action imports (re-list the tree, read the newest file) is supported by the documented model. Not found in excerpts: the per-app cap on persisted grants (recalled as 128, 512 on newer releases — *provisional*, irrelevant for one folder), and what happens if the user renames/recreates the folder or the emulator replaces a file (replacing a file inside the tree should keep the tree grant, *provisional*; delete+recreate of the **folder itself** drops it per the official caveat).
4. **Content URI ≠ filesystem path.** The result is a `content://com.android.externalstorage.documents/tree/primary:Johnemulators%2FGBA%2Fsave`-style URI *(shape recalled, provisional)*. The app reads via `ContentResolver`/`DocumentFile`/`DocumentsContract` (children listing gives display name, size, last-modified). It must not convert it into `/storage/emulated/0/...` and open with `File`. The Android 11 page says direct file paths are available for **media** files through other APIs (MediaStore-indexed media), and that "all files" access beyond that needs the all-files-access permission (E6); `.sav` files are not media, so that route is both inapplicable and unnecessary here. `MANAGE_EXTERNAL_STORAGE` is not required for this approach.
5. **Saves vs states vs live RAM (unchanged, restated):** a battery `.sav` is a regular file and is what this SAF route can read. Emulator save states are also regular files in a sibling folder (S1) and are readable the same way, but decoding them is a separate, unverified question about John GBA's format. Live emulator RAM is another process's memory: not reachable by any sanctioned API without root (E5); only files the emulator writes can be imported.
6. **Freshness limits.** SAF offers file metadata (modified time, size) so a "sync" tap can pick the newest file. Whether John GBA flushes `.sav` promptly, and background auto-refresh, remain unestablished (see "Unknowns" 5).

### Verdict
Provisional: on documentation alone, `ACTION_OPEN_DOCUMENT_TREE` on a non-root, non-Download subfolder with a persisted read grant is sufficient for one-time setup plus later one-tap reads, with no all-files permission. **Not proven**: no device test, no direct page read, and the exact restricted-directory list is partly secondary. Whether John GBA really writes to that folder on the user's Android version, and whether the files are the full save image, still needs the user's device (e.g. try picking the folder in a file picker; report any "can't use this folder" message).

### Sources (excerpt-verified unless noted)
- https://developer.android.com/training/data-storage/shared/documents-files (tree action, restrictions, persistable grants, caveat)
- https://developer.android.com/about/versions/11/privacy/storage (other apps' dirs, all-files access, raw paths for media)
- https://developer.android.google.cn/training/data-storage/shared/documents-files?hl=zh-cn (Download listed; no permissions needed)
- https://stackoverflow.com/questions/69838420/ and https://stackoverflow.com/questions/76401193/ (secondary: quote the full blocked-directory list)
