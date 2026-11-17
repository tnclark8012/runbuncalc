# John GBA save and battle-state import paths on Android

Research for [#114](https://github.com/tnclark8012/runbuncalc/issues/114), refreshed 2026-11-17 UTC. This replaces the earlier [branch report](https://github.com/tnclark8012/runbuncalc/blob/research/john-gba-import-paths/docs/research/john-gba-import-paths.md), retaining its useful SAF/file-versus-memory distinctions while correcting its evidence gaps and overclaims. The Android, Chrome/Chromium, and John GBA sources below were retrieved directly; the previous environment's fetch failures are no longer blockers.

**Scope:** feasible, user-authorized access/import paths, not architecture selection or importer implementation. No attachments, ROMs, saves, decoder code, or binary layouts were inspected for this report. Detailed format and core-data coverage belongs to the separate [Run & Bun decoder research](run-and-bun-decoder.md); byte access alone does not establish that coverage.

## Answer and evidence boundary

**The bounded access-feasibility question is sufficiently answered.** Ordinary-save access after setup and an explicit reread is both supported by Android's documented grant model and demonstrated on the user's setup. Snapshot-file access is also user-confirmed. Neither requires live-process memory access as the baseline. This conclusion does not select a native-shell product architecture, certify browser/PWA equivalence, or claim universal John GBA compatibility.

| Path | Established evidence | Boundary |
|---|---|---|
| Native Android document/tree grant, including a shell with bundled web UI | Android documents persistent file and directory grants. The #121 phone trial retained ordinary-save access through force-stop/reopen and reread changed bytes without another picker. [A1–A3, U1] | The trial did not record whether the file or folder picker was used; it is not separate device proof of both. No Android/John GBA versions were recorded. |
| User-accessible emulator snapshot file | The user explicitly confirmed Android access to snapshot files. [U2] | This is access evidence, not proof of every decoded field, every snapshot variant, or retained snapshot access across restart. See the separate decoder report. |
| Browser/PWA file selection | HTML defines user-selected files; Chrome documents filesystem handles, and Chromium has Android document/tree-picker plumbing. [W1–W4] | Browser-controlled APIs and permissions are distinct from a companion app's native SAF grants. The user's browser behavior was not tested. No minimum Chrome Android version is asserted. |
| John DataSync/Dropbox | John GBA's developer listing advertises Dropbox support requiring John DataSync. [J1] | Listing-level alternative only: no verified export workflow, synced-file inventory, timing, or offline cloud-sync claim. Not needed for baseline. |
| Emulator cooperation/live memory | Android isolates app processes by default; deliberately exposed interfaces are a different possibility. [A7] | No sanctioned John GBA live-state API was identified in the first-party material reviewed. This is not proof that every cooperation or debugging technique is impossible. |

### User-tested evidence, not platform documentation

- **U1 — Ordinary save:** [#121's recorded user trial](https://github.com/tnclark8012/runbuncalc/issues/121#issuecomment-6901236586) establishes that the native-shell/bundled-web-UI app could reread the remembered ordinary save after force-stop/reopen, without another picker, and obtain a different SHA-256 after changed progress was saved in John GBA. Its prototype requested neither root nor internet/broad storage permission. A separate airplane-mode test was **not** reported. The result establishes updated-byte access on that setup, not an emulator flush deadline or atomic reads during writes.
- **U2 — Snapshot access:** the user's additional confirmation, recorded in [#114's scope clarification](https://github.com/tnclark8012/runbuncalc/issues/114#issuecomment-6941131852), establishes working Android access to emulator snapshot files. Another phone access experiment is unnecessary.
- The user's Android and John GBA versions remain unknown. **Collecting versions, building support matrices, and broad compatibility/error-detection design are explicitly outside this investigation**, not prerequisites to accepting these tested-sample findings. [U2]

## 1. Native Android: explicit sync with retained grants

### File grant and directory grant are different capabilities

Android's Storage Access Framework (SAF) uses a system picker and document providers. `ACTION_OPEN_DOCUMENT` selects an individual document (API 19+); `ACTION_OPEN_DOCUMENT_TREE` selects a directory and grants access to its files and subdirectories (API 21+). User selection avoids the need for broad storage/system permissions for this mechanism. A read-only import does not require `MANAGE_EXTERNAL_STORAGE` or permission to write the emulator's files. [A1, A2]

The result is a provider URI, not a promise of an ordinary filesystem pathname. Android documents querying metadata and opening content through `ContentResolver`, including `openInputStream()` and `openFileDescriptor()`. A URI grant must not be treated as permission to manufacture a raw `/storage/...` path. SAF can represent local or cloud providers; a cloud provider's appearance in the picker does not make its bytes available offline. [A1, A2]

**Implication:** a persisted file grant can support rereading the selected document; a tree grant additionally supports discovering children within the chosen tree. Re-enumerating a still-authorized tree can locate a newly created child document, whereas remembering one old file URI does not establish that it follows a replacement file. This is a consequence of the documented tree/document model, not a tested claim about John GBA's replacement behavior. [A1, A2]

### Persistence, loss, and availability

- A grant must actually be taken with `ContentResolver.takePersistableUriPermission()`, using the offered read/write modes. `FLAG_GRANT_PERSISTABLE_URI_PERMISSION` only offers persistence; receiving a URI or remembering its text is insufficient. Once taken, the grant is remembered across device reboots. [A1, A3]
- Persistence is not irrevocable access. Android explicitly warns that moving or deleting the associated document loses URI access and requires permission again. Grants can also be explicitly revoked or relinquished with `releasePersistableUriPermission()`. Do not promise that deleting/recreating a directory preserves its previous grant. [A1, A3]
- Availability is separate from permission: Android documents transient USB roots and roots changing with account login/logout. A persisted grant does not ensure the provider, volume, account, or document is currently available. [A2]
- The force-stop/reopen behavior is directly established by U1; reboot survival is documented by Android, not a separately reported user reboot trial. This report does not promise persistence through uninstall/reinstall, app-data reset, or every provider change.

**Explicit-sync feasibility:** after one-time selection and persistence, a foreground sync action can reopen the authorized document, or list the authorized tree and open a child, without routinely showing the picker again while authorization and availability remain valid. That model is documented; U1 demonstrates the ordinary-save reread outcome on the user's setup. Neither filesystem polling nor a background service is necessary to establish it. [A1–A3, U1]

### Restricted locations

The current SAF guide lists these Android 11+ restrictions; the Android 11 migration page explains the target-API qualification for the introduced SAF behavior changes. These are platform facts, not a requested compatibility matrix. [A1, A4]

- Tree selection cannot grant the internal-storage volume root, roots of SD-card volumes the manufacturer considers reliable, or the `Download` directory itself.
- `Android/data/` and `Android/obb/`, including their subdirectories, are restricted for document selection with the document/tree actions.
- Android also restricts access to other apps' private internal data and app-specific external directories. A picker is not a general bypass for those restrictions. [A4]

A normal shared-storage subfolder outside the listed restrictions is therefore a **documented candidate**, not an inferred universal John GBA save path. Do not infer the save location from the ROM location. No hard-coded `Johnemulators/GBA/...` layout is needed for the feasibility conclusion: the user has already demonstrated ordinary-save and snapshot-file access. If files in some other setup were private, an emulator-supported export/share/provider route would need to make them accessible; such a route is conditional, not established for every John GBA installation. [A1, A2, A4, U1, U2]

## 2. Refresh: explicit reads are not cross-app monitoring

**A retained grant authorizes access; it does not itself schedule reads or report emulator save completion.** Reopening a document on sync obtains bytes exposed by the provider at that time. U1 demonstrates a changed result after an in-game save, but neither SAF documentation nor that trial establishes when John GBA flushes every save, that a concurrent read is atomic, or that a timestamp identifies the desired game/state. No universal write-timing guarantee is claimed. [A1, U1]

Android supports `ContentResolver.registerContentObserver()`. The provider contract describes setting a cursor's notification URI and calling `notifyChange()` to deliver changes. Thus provider-backed notifications are a possible mechanism, **not an entitlement to monitor every cross-app write merely because a tree was granted**. Notification behavior for the user's provider/John GBA writes was not tested; this report neither promises reliable automatic monitoring nor claims observers can never help. [A5]

Scheduled background reads are also a different capability. WorkManager's periodic work has a minimum repeat interval of 15 minutes; execution depends on constraints and system optimization and can be delayed or skipped. That mechanism is not immediate per-save refresh. These limits do not prevent an explicit foreground read after the user saves and returns to the companion. [A6]

Consequently, the feasible baseline is **save or create a snapshot in the emulator, then explicitly sync/read it**. Automatic refresh, cross-app save-completion signals, and read-during-write guarantees are optional future investigations, not prerequisites to #114's bounded access answer.

## 3. Native-shell access versus browser/PWA access

### A web UI does not imply browser-only permissions

Android officially supports bundled HTML/JavaScript/CSS in a `WebView` without internet access, and interfaces between JavaScript and native app code. The native side can own SAF selection, persistence, and reading; the page need not possess a browser directory-picker API. Android warns that exposed native interfaces must not be made available to untrusted page content. This explains the feasibility distinction, not a mandate to use a particular bridge or architecture. [A8]

U1 tested this native-shell category. It **did not test** Chrome, an installed browser PWA, browser permission retention, or WebView's own implementation of `showDirectoryPicker()`.

### Browser APIs: what owning sources actually establish

1. **User-selected files:** HTML's file-upload control represents a user-selected list of files with names, types, and bodies. JavaScript can process those selected files; this need not mean uploading them to a server. It is an import fallback, not an API promise of a retained directory grant and future unattended rereads after closing the page. [W1]
2. **Local filesystem handles:** Chrome's own guide describes `showOpenFilePicker()`/`showDirectoryPicker()`, reading through `FileSystemFileHandle.getFile()`, and directory enumeration. It requires a secure context and a user gesture for pickers. Handles can be stored in IndexedDB, but a stored handle and current permission are different: Chrome directs callers to check `queryPermission()` and, if necessary, use `requestPermission()`. [W2]
3. **Android implementation evidence, not a version-table shortcut:** the retrieved Chrome guide broadly includes Android. More concretely, Chromium source at revision `ca715e81caa34f0606f59f5a77118bbcf4dbff65` declares the picker methods behind `FileSystemAccessLocal`, maps Android folder-selection types to `ACTION_OPEN_DOCUMENT_TREE`, and attempts persisted URI grants when handling document selections. That is owning-source evidence of an Android implementation path, **not proof that the user's browser exposes it or that a particular released version guarantees the full experience**. The earlier report's blanket “Chrome Android 132+”/WebView support claim based on generic compatibility snippets is withdrawn; no minimum version or browser support matrix is needed here. [W2, W4]
4. **Permission retention is browser policy:** Chrome documents an “Allow on every visit” option and automatic persistence for installed apps when access is granted under that feature's conditions. It also documents session-only access, permission expiry, and user revocation. These are capabilities of supporting Chrome environments, not a transfer of an Android app's persisted SAF grant to a web origin, nor proof that installing any PWA grants native filesystem access. [W3]
5. **Explicit rereads still matter:** Chrome notes that a `File` returned by `getFile()` becomes unreadable if the underlying file changes; obtain a new `File` to read changed data. Remembering a previous `File` or handle does not automatically refresh imported state. The browser sources establish user-authorized read operations, not a continuous John GBA monitoring contract or guaranteed background execution. [W2]

**Conclusion:** a supporting browser can offer a handle-based import path; ordinary user-selected-file import is a separate fallback. Browser-only one-time-setup/one-action behavior is conditional on the actual API and permission implementation and is not certified by U1. This uncertainty does **not** block the demonstrated native access path, and resolving it does not require another phone experiment for #114.

## 4. What first-party John GBA material establishes

The developer-authored [John GBA Play listing][J1] explicitly advertises:

- “Save States (with previews)”;
- “Dropbox support (requires John DataSync)”;
- searching game files on SD card/internal storage and “No internet connection.”

Those statements establish advertised features only. Searching game files does not establish save/state locations. The offline wording does not make Dropbox synchronization offline. The listing does not specify a save/state export button, filesystem layout, filename extension, serialization format, compression, atomic-write behavior, or a programmatic live-state interface. The developer's linked website did not provide a technical save/export specification in the material retrieved. [J1, J2]

**The user's working files/access add the missing bounded evidence:** ordinary saves can be reread through the demonstrated companion, and snapshots are accessible on Android. There is no need to retain the old report's “must obtain samples/try the picker first” blockers. Conversely, these reports do not establish another emulator's format compatibility, and renaming an extension is not evidence of such compatibility. [U1, U2]

Ordinary-save access and emulator-snapshot access remain separate inputs. Which player-state or live-battle-state facts those supplied inputs actually contain and expose is addressed only in [the decoder/core-data report](run-and-bun-decoder.md), not inferred from a Play listing or from successful byte reads.

## 5. Live memory and emulator cooperation

Android's application sandbox assigns apps separate UIDs/processes and enforces isolation for both native and interpreted code. A document/tree grant is access to provider-exposed documents, not permission to inspect another app's process memory. Root access, private-app-directory extraction, sandbox bypasses, and undocumented memory-reading compatibility are not part of this baseline. [A1, A7]

No sanctioned John GBA live-memory/live-state API was identified in the first-party listing/site material reviewed. **That negative search result is not proof that every technique is impossible or that root is the only conceivable route.** Deliberately exposed emulator interfaces or developer-supported cooperation would be a different integration path, if identified. Android explicitly supports controlled inter-app sharing through content providers; it does not establish that John GBA offers a particular live-state provider. [A7, J1, J2]

Live-memory cooperation is unnecessary to establish ordinary-save import or access to emulator-written snapshot files. A snapshot-based live-battle import still depends on the separate technical decoding evidence; this report makes no additional claim about its field coverage.

## Remaining unknowns and optional follow-ups

| Item | Status for this bounded investigation |
|---|---|
| Native retained ordinary-save access and updated bytes | Answered on the user's tested setup, with documented platform support. No repeated trial required. [A1–A3, U1] |
| Android snapshot-file access | User-confirmed. No repeated access trial required. [U2] |
| Exact Android/John GBA versions, other devices, support boundaries | Unknown and explicitly outside scope; do not make collection or a matrix a resolution requirement. |
| Decoder/core-data completeness for supplied files | Separate technical evidence in [run-and-bun-decoder.md](run-and-bun-decoder.md). Not evaluated or duplicated here. |
| Browser/PWA equivalence, monitoring, concurrent-write consistency | Not established for the user's setup; optional work only if those capabilities become product requirements. |
| John GBA documented export UI, DataSync contents, flush timing, supported cooperation API | Not established by reviewed first-party material. Optional further emulator documentation/developer inquiry; not needed to prove the existing accessible-file paths. |

**Disposition:** the platform/access portion of #114 is complete. Any overall issue resolution should incorporate the separate decoder/core-data findings, without turning unknown versions or optional automation/cooperation paths into new blockers. No architecture decision, production implementation, broad compatibility claim, or GitHub issue mutation is part of this report.

## Primary sources

Sources were directly retrieved for this refresh. Android API levels below describe documented mechanisms/restrictions, not a device-support certification. Chromium links are revision-pinned development source, not a claim about a shipped browser on the user's phone.

- **A1:** Android Developers, [Access documents and other files from shared storage](https://developer.android.com/training/data-storage/shared/documents-files): file/tree selection, full restriction lists, URI operations, persistence and move/delete caveat.
- **A2:** Android Developers, [Storage Access Framework overview](https://developer.android.com/guide/topics/providers/document-provider): provider hierarchy/stable document IDs, transient roots, and `ACTION_OPEN_DOCUMENT` versus importing a copy with `ACTION_GET_CONTENT`.
- **A3:** Android reference, [`takePersistableUriPermission()` and `releasePersistableUriPermission()`](https://developer.android.com/reference/android/content/ContentResolver#takePersistableUriPermission(android.net.Uri,%20int)); [`FLAG_GRANT_PERSISTABLE_URI_PERMISSION`](https://developer.android.com/reference/android/content/Intent#FLAG_GRANT_PERSISTABLE_URI_PERMISSION): offered/taken grant, reboot lifetime, explicit revocation/release.
- **A4:** Android Developers, [Android 11 storage updates](https://developer.android.com/about/versions/11/privacy/storage#document-access-restrictions): target-API qualification, restricted directories, other apps' data, and distinction from broad all-files access.
- **A5:** Android reference, [`registerContentObserver()`](https://developer.android.com/reference/android/content/ContentResolver#registerContentObserver(android.net.Uri,%20boolean,%20android.database.ContentObserver)) and [`DocumentsProvider.queryChildDocuments()`](https://developer.android.com/reference/android/provider/DocumentsProvider#queryChildDocuments(java.lang.String,%20java.lang.String[],%20android.os.Bundle)): observer and provider-notification contracts.
- **A6:** Android Developers, [Define work requests — schedule periodic work](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work#schedule_periodic_work): 15-minute minimum, constraints, inexact/delayed/skipped execution.
- **A7:** Android Open Source Project, [Application Sandbox](https://source.android.com/docs/security/app-sandbox): process/UID isolation and supported controlled sharing through content providers.
- **A8:** Android Developers, [Load in-app content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content) and [Build web apps in WebView — bind JavaScript to Android code](https://developer.android.com/develop/ui/views/layout/webapps/webview#BindingJavaScript): offline bundled resources, native interfaces, and trust warning.
- **W1:** WHATWG HTML, [File Upload state (`type=file`)](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)): selected-file model and user selection.
- **W2:** Chrome for Developers, [The File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access): picker access, reads, reobtaining changed files, handle storage, permission checking, and security conditions.
- **W3:** Chrome for Developers, [Persistent permissions for the File System Access API](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api): session versus persistent permission, installed-app behavior, expiry/revocation. This is not an Android release/support guarantee.
- **W4:** Chromium source at `ca715e81caa34f0606f59f5a77118bbcf4dbff65`: [picker Web IDL](https://github.com/chromium/chromium/blob/ca715e81caa34f0606f59f5a77118bbcf4dbff65/third_party/blink/renderer/modules/file_system_access/window_file_system_access.idl), [`FileSystemAccessLocal` runtime feature](https://github.com/chromium/chromium/blob/ca715e81caa34f0606f59f5a77118bbcf4dbff65/third_party/blink/renderer/platform/runtime_enabled_features.json5), [Android dialog action mapping](https://github.com/chromium/chromium/blob/ca715e81caa34f0606f59f5a77118bbcf4dbff65/ui/shell_dialogs/select_file_dialog_android.cc), and [Android Java document-picker/result handling](https://github.com/chromium/chromium/blob/ca715e81caa34f0606f59f5a77118bbcf4dbff65/ui/android/java/src/org/chromium/ui/base/SelectFileDialog.java).
- **J1:** John emulators, [John GBA developer-authored Google Play listing](https://play.google.com/store/apps/details?id=com.johnemulators.johngba), “About this game.” User reviews were not used as product documentation.
- **J2:** John emulators, [developer website](https://johnemulators.com/), linking to [Johnemulators apps](https://sites.google.com/site/johnemulators/).

[J1]: https://play.google.com/store/apps/details?id=com.johnemulators.johngba
