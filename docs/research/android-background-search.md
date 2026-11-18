# Android constraints for resumable offline search

Research for [#130](https://github.com/tnclark8012/runbuncalc/issues/130), under
[map #113](https://github.com/tnclark8012/runbuncalc/issues/113).
Evidence cutoff and access date: **2026-11-18**. Documentation only; not a runtime,
algorithm, persistence-policy or distribution decision.

## Answer and confidence boundary

**A supportable contract is interruptible local computation, not continuous
background execution:** preserve committed progress and candidates; execute while
the app is active and, where eligible, in OS-scheduled background slices; report
deferral/interruption honestly; resume compatible work; pause at five minutes of
active computation and require explicit continuation. Completion notification is
best effort and permission-dependent. Neither a five-minute wall-clock result nor
uninterrupted execution is established. WorkManager provides a supported
persistent scheduling mechanism, not a saved search heap or an execution
deadline. [W1–W4]

There are three materially different possibilities:

1. **Foreground UI plus checkpoint/reopen** is the baseline fallback.
2. **WorkManager/JobScheduler plus checkpointed, bounded computation** supports
   deferrable work without inventing a foreground-service use case. Background
   start/completion time remains outside the application's control. [W1, A3]
3. **A user-visible foreground service** may support more immediate continuation
   when its type and use case are eligible. `shortService` is approximately
   three minutes, not five minutes of compute. `specialUse` is a conditional
   investigation, not approved entitlement. Arbitrary search is **not**
   `dataSync`, media processing or user-initiated network transfer. [A2, A3]

**Important verification limitation:** full `developer.android.com`,
`source.android.com`, `capacitorjs.com` and Play-policy pages could not be fetched
here: direct fetch/curl failed DNS; browser navigation to Android docs was blocked.
Alternative access through GitHub succeeded. This report verifies full current
first-party Capacitor documentation source, released Background Runner source,
current AndroidX source/API documentation, and an older official AOSP Android 16
source baseline. It **does not claim full verification of Android 17/API 37
behavior changes or current Play eligibility**. Search-index snippets were used
only to discover pages, never as verified page contents. This is a useful bounded
inventory, **not API 37 production sign-off**. See the source register and gaps.

## Existing boundaries, unchanged

[#118's resolution](https://github.com/tnclark8012/runbuncalc/issues/118#issuecomment-6950171999)
requires progressive, local, interruptible search; a first useful candidate within
ten seconds **when feasible**; five minutes of active computation by default;
explicit continuation; and stopping at the first qualifying plan.
[#119's resolution](https://github.com/tnclark8012/runbuncalc/issues/119#issuecomment-6971040686)
requires one shared headless rules engine, optional separate search, immutable
revision-identified run inputs, and application-owned orchestration/storage.
The [shell ADR](../adr/0001-capacitor-app-and-native-save-access.md) selects
Capacitor and a minimum device OS of Android 17/API 37.

This report leaves engine/runtime selection to [#143](https://github.com/tnclark8012/runbuncalc/issues/143)
and retention/compatibility policy to [#142](https://github.com/tnclark8012/runbuncalc/issues/142).
No native rewrite, algorithm, database, server fallback or upload is selected.
Persistence and successful resumption **do not certify a battle plan**: preserve
exact/certified versus estimated/incomplete/unsupported evidence, encounter-wide
faint risk within the player's unchanged risk tolerance, and sure eventual victory.
Failure to find a qualifying plan is not proof of impossibility.

## Practical mechanisms matrix

“Supported” below means present in the inspected APIs/source, subject to the
version/access caveat above; it does not mean tested on API 37.

| Mechanism | What it actually permits | Limits and five-minute-budget consequence | Assessment |
| --- | --- | --- | --- |
| WebView JavaScript / Web Worker | Off-UI-thread JS can serve interactive work; it remains dependent on the WebView/renderer/app lifecycle. | Not a durable Android work request; no automatic recovery of worker memory. Do not equate `onPause` with guaranteed JS termination: Android explicitly says `WebView.onPause()` does **not** pause JS, whereas `pauseTimers()` pauses timers globally. Actual worker throttling/suspension and renderer survival require measurement. | Foreground candidate, not an Android background-execution contract. [C1, A6] |
| Native thread/executor without scheduled work/service | Moves CPU work away from the UI; a headless runtime need not be Java/Kotlin. | A thread alone adds no persistent scheduling or guaranteed process survival. | Useful execution primitive, not durable orchestration. [A1, W2] |
| Ordinary one-time WorkManager work | Persistent, observable work using JobScheduler on this minimum OS; no network constraint is needed for local computation. `Worker.doWork()` runs on a background executor. | Ordinary workers document a maximum ten-minute invocation, **not a minimum allocation**. Constraints, quota, device state and preemption can stop them earlier. Re-execution creates a new worker, not a restored call stack. Use smaller cooperative slices; accumulate active time across invocations. | Supported deferred-background candidate; no prompt-start/completion guarantee. [W1–W4] |
| Expedited WorkManager / JobScheduler | Higher-urgency scheduling for suitable user-important short work; native expedited jobs are available from API 31. | Separate, limited quota; system load/constraints still matter. WorkManager exposes an out-of-quota policy; choose and surface downgrade/failure rather than hiding it. Not a guaranteed five-minute CPU reservation. | Optional urgency tool, not a continuation guarantee. [W5, A3] |
| Direct ordinary JobScheduler | Asynchronous job lifecycle, rescheduling and optional persisted job metadata across reboot. | Application supplies an off-main-thread runner, checkpointing and recovery. `setPersisted(true)` requires `RECEIVE_BOOT_COMPLETED`; persisted scheduling does not serialize computation. | Supported lower-level alternative; no reason established here to prefer it over WorkManager. [A3] |
| WorkManager long-running / foreground worker | `setForegroundAsync()` runs an FGS on the application's behalf and supplies its notification. | Inherits foreground-start/type restrictions; it is not an eligibility bypass. Scheduled jobs can still be quota-controlled despite an FGS; see version table. Do not apply ordinary-worker documentation as a universal duration promise for this distinct mode. | Conditional on a legitimate FGS type and version validation. [W2, A2, A4] |
| Direct FGS: `shortService` | Short, user-visible work where the timeout is sufficient; no type-specific permission beyond base FGS permission. | Approximately three-minute elapsed service timeout; not sticky; timeout callback requires prompt stopping or ANR. Cannot simply renew forever from background or start another FGS from it. Five active minutes may exceed even five elapsed minutes. | Not a single five-minute runner. Separate, explicitly user-started eligible short sessions may be explored, never silent timeout evasion. [A2, A1] |
| Direct FGS: `specialUse` | API category for uses not covered by other types; inspected API docs specifically describe cases that also cannot use JobInfo APIs. Requires `FOREGROUND_SERVICE_SPECIAL_USE` and a descriptive manifest subtype property. | Permission is `normal|appop`, not a promise of use-case approval. The source warns use may be restricted. No unlimited execution promise follows from absence of a listed short-service timeout. | Conditional only: justify why deferrable jobs do not meet the use case, verify API 37 and distribution policy. Do **not** declare arbitrary CPU search approved. [A2, A8] |
| `dataSync`, `mediaProcessing`, user-initiated data-transfer job | Their actual documented data-transfer or media use cases. | DataSync's longer timeout is not permission to relabel battle search. The inspected JobInfo API limits user-initiated jobs to network transfers and enforces a network requirement. Search being user-started does not make it data transfer. | Not a supported justification for arbitrary offline search; no dummy network constraint. API 37 expansion, if any, is unverified. [A2, A3] |
| Capacitor Background Runner **4.0.0** | Official separate, restricted JS environment outside the WebView. Released Android implementation uses a WorkManager `Worker`, with one-time/periodic scheduling. | Fresh JS context for every event; no retained in-memory state. Docs say Android maximum ten minutes and repeating interval at least fifteen minutes; neither is guaranteed time delivered. Android-only scope does **not** require adopting its iOS thirty-second recommendation. Engine API compatibility, checkpoint transfer and cancellation must be tested. | Genuine documented alternative to inspect in #143, **not** a durable Web Worker or a chosen runtime. [C2] |
| Local Notifications / notification APIs | Announce progress/completion if delivery is allowed. | They do not execute the search or preserve its state. An alarm at a predicted finish time is not proof computation completed. | Reporting component only; no compute runner. [C3, A7] |

## Device OS, target SDK and source-version boundaries

`minSdkVersion` controls installable device OS; `targetSdkVersion` opts into
target-gated behavior; `compileSdkVersion` supplies build APIs. Choosing minimum
API 37 does **not** itself establish the app's target, Capacitor version or
manifest/service compliance. Record all three plus actual OS build/WebView version
in any experiment. Capacitor's current documentation maps 8.x to target 36 and
9.x to target 37, and says custom target versions are unsupported. Its rolling
documentation also describes Capacitor 9/AGP 9 inferring target from compile SDK.
**Latest stable release returned by GitHub at access time was 8.6.2**, not 9;
rolling 9.x documentation is not evidence that a stable 9 release exists. [C4]

| Condition | Verified boundary / conservative consequence |
| --- | --- |
| Device API 31+ **and target 31+** | Background FGS starts are restricted; `Context.startForegroundService` documents `ForegroundServiceStartNotAllowedException`. Start a legitimate user-requested FGS while the Activity is visible, promptly promote it with a notification, and handle rejection. A past tap is not indefinite background-start permission. Do not build around guessed exemptions. [A1] |
| Device API 34+ **and target 34+** | `Service.startForeground` documents valid manifest service type and corresponding permission requirements; missing/invalid types or missing permission can throw. Minimum OS alone is not the target gate. `shortService` timeout behavior is an API 34-era mechanism. [A1, A2] |
| Device API 35+ **and target 35+** | Inspected implementation gates `dataSync`/`mediaProcessing` FGS time limits on target 35: six-hour type budgets over a 24-hour accounting window, timeout callback and prompt stop. This is a contrast, **not an eligible search budget**. Boot-start restrictions are also target-35-gated and type-specific; a boot receiver is not universal FGS restart authorization. [A2, A9] |
| Android 16/API 36 scheduler baseline | QuotaController contains flag-controlled enforcement of quota on FGS-hosted jobs, with a compatibility override; the enforcement path does not simply grant exemption for an older target. Thus **do not rely on an FGS to remove job quota**, or quote a universal daily CPU allowance. This source snapshot does not establish final API 37 flag activation/configuration. Current Android background-work change pages must be rechecked before sign-off. [A4] |
| Android 13/API 33+ notifications | Capacitor documentation requires runtime notification permission checking/requesting. Ordinary completion notifications can be unavailable even while computation is allowed. FGS notification submission and permission to show ordinary notifications are separate concerns. [C3, A1, A7] |
| Android 17/API 37 | No fully fetched official platform/API 37 behavior-change page or matching AOSP release source was available. Do not infer “no new limits,” a new compute service type, a broadened user-initiated job API, unchanged quotas, or stable Capacitor 9 availability. Those are explicit remaining checks, not conclusions. |

FGS **continuation** after backgrounding is not the same question as permission to
**start** it from background. An app launched by a visible user action can request
eligible execution before losing visibility; restart after death, reboot or a
later scheduler wake-up must independently satisfy applicable rules. Merely
binding a plugin, using “sticky” restart, or choosing a service type does not
restore the search frontier. Services execute lifecycle callbacks on the main
thread and create neither a compute thread nor a checkpoint automatically. [A1, A2]

## Interruption and recovery: distinguish the events

| Event | Platform evidence and product consequence |
| --- | --- |
| Home, another app, screen off | UI visibility/lifecycle changes are not completion or cancellation. Capacitor forwards Activity lifecycle changes. WebView pause behavior is not a promise about worker lifetime. A separately scheduled native runner can be eligible to continue, but must checkpoint before an unannounced loss. [C1, A6, W1] |
| Swipe app from recents | Task removal is not synonymous with force-stop. A running service can receive `onTaskRemoved`; with `FLAG_STOP_WITH_TASK` it is stopped instead. Do not promise either universal survival or universal cancellation: validate selected manifest/runtime and device behavior. [A1] |
| Low memory, crash, renderer/process death | Volatile work is lost. Workers can be reconstructed/rerun; AndroidX recovery reschedules unfinished work after crashes. This is re-execution from application data, not resuming a suspended instruction. Do not rely on a final callback/checkpoint; recover from the last committed checkpoint, with possible rework. [W2–W4] |
| User presses app Pause/Cancel or notification action | App-controlled cooperative stopping can commit progress, revoke the runner's right to publish, and prevent unwanted rescheduling. “Pause and retain” versus “cancel/delete” retention semantics remain #142's decision. Worker cancellation causes results from that stopped worker to be ignored by WorkManager. [W2] |
| Android Task Manager / active-apps **Stop** | The inspected platform `stopAppForUserInternal` halts the app's execution; its source explicitly distinguishes this from full force-stop. Do not count on cleanup callbacks. It does not impose the full stopped-package state, so do not equate it with cancellation of every future scheduled job. For user-initiated jobs the inspected API explicitly prohibits app rescheduling after the user stops them through the system affordance. Treat observed user stop as a halt, not an invitation to relaunch a service. Recovery/re-consent and exact API 37 behavior need testing. [A3, A10] |
| Settings **Force stop** | AndroidX documents cancellation of alarms/jobs on force-stop and detects/re-enqueues eligible work during later initialization. No autonomous “continue anyway” promise; on explicit reopening reconcile the interrupted run and user intent before rescheduling. Persisted app records can support recovery, but force-stop does not run a final save. [W4] |
| Device reboot / battery loss | Running code stops. WorkManager registers reboot rescheduling; direct jobs can persist scheduling metadata. Restore only compatible committed application state, after storage is available; no completion deadline or automatic FGS entitlement. AndroidX's reschedule receiver is not direct-boot-aware. [W4, A3] |
| Clear app data / uninstall | Do not promise recovery of application-owned local checkpoints after the user removes that data. No backup/cloud rescue is authorized by this research. |

A scheduler's `RUNNING` state is not proof that CPU is currently advancing the
search. WorkInfo exposes queued/running/finished states, progress and stop reasons;
its documented reasons include timeout, quota, battery/charging/storage constraints,
Doze/battery-saver/device state, and unknown abrupt interruption. Process-exit
records can assist diagnosis, but are not an infallible business-level reason:
`REASON_USER_REQUESTED` includes multiple kinds of user action. Show **unknown**
when the cause is not established; never fabricate “user cancelled” or “completed.”
[W3, A10]

## Power and notification constraints

- **Doze and standby still matter offline.** PowerManager documents idle
  maintenance windows and light-idle batching of jobs; WorkInfo documents stopping
  for Doze/battery saver and exhausted quota. Removing network access from the
  design does not remove CPU scheduling/power constraints. Constraints such as
  charging/battery-not-low may defer work further if selected. [A5, W3]
- **FGS is not a wake lock or immunity.** The inspected Low Power Standby API
  explicitly includes apps with foreground services: outside maintenance windows,
  network may be disabled and wake locks ignored. Normal partial wake locks keep
  CPU awake only within applicable power rules; JobScheduler manages a job wake
  lock. Do not require a blanket battery-optimization exemption or assume it
  defeats timeouts, user stops, quota or OEM behavior. [A3, A5]
- **Thermal throttling changes throughput.** PowerManager exposes thermal
  severity/headroom information and warns throttling can affect CPU/GPU.
  Five active minutes may explore much less work on a hot device; support
  yielding/stopping and truthful status rather than overheat-based time promises.
  Temperature callbacks and practical cooling policy need device evidence. [A5]
- **Permission and channels:** request notification permission in a clear user
  flow; check current permission and channel settings, not merely a remembered
  grant. Use valid Android notification channels; user blocking, importance and
  DND can suppress delivery/alerting. Current Capacitor docs explicitly expose
  channels and Android 13 permission checks, and warn that Android 15+ Private
  Space can hide push notifications while locked; do not assume completion alerts
  are always visible in every installation mode. API 37-specific notification
  changes remain unverified. [C3, A7]
- **FGS disclosure is separate from completion alerting:** supply the required
  FGS notification even if notification-drawer visibility is denied. Notification
  permission is not itself the FGS-start permission; the inspected notification
  service suppresses non-media/non-call notifications from blocked apps. The
  documented Android active-apps/Task Manager surface must not be confused with a
  delivered completion notification; exact denied-permission visibility on API 37
  is a device/doc-check item. [A1, A7, A10]
- **No alarm or push workaround:** completion is an event after committed result
  publication, not a timer estimate. Notification plugins are not compute
  runners. Exact alarms, full-screen intents, notification-listener access and
  remote push are not needed to justify ordinary local completion reporting;
  no network/server mechanism is authorized. [C3, A7; product scope]

## Feasible run contract to carry into #142 / #143

The following are derived requirements, **not selected implementations**:

1. **Start:** fix input/ruleset revisions and a run ID before dispatch. Persist
   enough application-owned state to distinguish “accepted/queued” from
   “runner started.” UI editing never mutates those inputs.
2. **Budget:** record cumulative **active computation**, separately from wall
   time, queue delay, suspension, checkpoint I/O and UI time. Five minutes is the
   default active budget; interruption/retry/reboot must not reset it. #143 must
   define an auditable measurement (e.g. active monotonic execution intervals
   versus actual runner-thread CPU time, including parallelism), not count the
   entire lifetime of an async request. Conservative accounting/limited rework
   after a crash must be explicit, not an invented exact five-minute guarantee.
3. **Progress:** publish useful candidates and analyzed/unresolved outcomes at
   cooperative safe points. Keep the ten-second first-candidate goal a feasibility
   target, not a qualification promise. Engine/search work and checkpoint size
   must allow timely yielding before OS/session limits; this needs benchmarks.
4. **Checkpoint:** store the frontier or resumable search state, best candidates,
   evidence and accounting through application-owned interfaces. A JS heap,
   WorkManager progress `Data`, or an outstanding Capacitor promise is not a
   general checkpoint. Metadata/progress and the durable continuation state must
   not contradict each other. #142 decides consistency, retention, update and
   compatibility/rejection policy; #143 measures serialization/reconstruction.
5. **Interruption:** stop cooperatively when notified, but assume abrupt death
   without callbacks. Recover only the last committed compatible state; expose
   possible lost work/rework. Fence stale runner publications and reconcile
   duplicate/retried dispatches so older results cannot overwrite edits or a
   successor run.
6. **Status:** distinguish queued/deferred, actually executing with last-progress
   time, paused at budget, user-paused/cancelled, interrupted/unknown, incompatible
   checkpoint/restart-required, and completed. An OS-deferred job is not “still
   searching” without qualification. Persist terminal status/candidate before
   attempting a best-effort completion notification; in-app status remains the
   authority when notifications are unavailable.
7. **Continue:** at the active budget, preserve progress and stop; only explicit
   user continuation authorizes additional budget. Recovery within an already
   authorized budget is distinct from granting more budget. Recheck compatibility,
   current input identity and applicable initiation eligibility. Stop earlier at
   the first qualifying plan, with all original victory/risk evidence intact.

## Bounded follow-ups and device-experiment checklist

This is not a broad validation campaign or permission to implement production
services. One disposable lifecycle harness for a small representative
checkpointable workload is enough to inform #143; #129 supplies actual search
performance evidence separately.

1. **Close the access gap first:** fully read current Android 17 all-app and
   target-37 behavior changes, service types/start/timeouts, job quota/long-running
   worker guidance, notification permission and user-stop docs (URLs below).
   Record page update dates and OS-versus-target gates. Verify a supported
   Capacitor release/target-37 combination; a rolling doc is insufficient.
   If `specialUse` remains attractive, verify current distribution/declaration
   policy and the concrete use-case rationale. An accepted manifest or successful
   device start is **not** Play approval.
2. **Record environment:** API 37 OS build/security patch, device/OEM, physical
   versus emulator, actual min/compile/target SDKs, Capacitor/plugin/AndroidX
   released versions, WebView version, permissions/channels, battery/standby
   settings and thermal state. Compare target SDKs only if supported by the
   chosen toolchain; do not make unsupported Capacitor target changes.
3. **Execution/lifecycle:** compare only remaining candidates (foreground worker
   baseline, one-time native job/worker, separate JS runner if engine-compatible;
   FGS only with a defensible type). Test Home, lock screen, app switching,
   recents swipe, renderer loss, process death/crash, reboot/unlock, Settings
   force-stop/reopen, and Task Manager Stop **as separate events**. Observe
   eligibility, actual CPU/progress, last committed checkpoint, callbacks,
   duplicate starts and truthful recovery status. Do not simulate every event
   with `force-stop`.
4. **Scheduling/power:** use controlled idle/battery-saver/background restriction
   and quota-exhaustion tests; inspect actual stop reasons and delay. For
   `shortService`, verify timeout/stop and a new visible-user continuation without
   background renewal tricks. Measure an ordinary cool and naturally throttled
   run, checkpoint overhead, active-budget accounting and UI responsiveness;
   no hazardous thermal stress.
5. **Results/notifications:** deny then grant permission, block the channel, use
   DND, stop/kill around checkpoint/result commit, and reopen offline. Verify no
   false completion, no lost already-committed candidate, no reset budget,
   idempotent result publication and no stale revision gaining a guarantee.
   Measure notifications separately from compute eligibility.

**Stop condition:** the verified inventory supports the deferred/checkpointed
contract, with foreground-only recovery as fallback. It does not yet justify
promising immediate five-minute background execution on API 37. Only the narrow
platform/version check, conditional service eligibility check, and small lifecycle
experiment above are necessary handoffs; no server or algorithm decision follows.

## Source register: exact primary material inspected

Dates below are **snapshot commit dates**, not invented “last updated” dates for
unreachable rendered pages. All snapshots predate the stated cutoff. Links are
immutable; section/member names identify the evidence. Android source links are
the official `aosp-mirror` Android 16 branch snapshot
`99b01a65cc4c104933788b3143285ab6bae65827` (**2025-05-07**), not Android 17.
AndroidX links use development snapshot
`2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9` (**2026-11-18**), not a selected
released dependency.

### Capacitor

- **C1 — Native bridge/lifecycle:** [BridgeActivity `onPause`/`onStop`](https://github.com/ionic-team/capacitor/blob/599fb14bd1ba128b1abc5b2629b9fb1a59bec1be/android/capacitor/src/main/java/com/getcapacitor/BridgeActivity.java#L103-L124), released **8.6.2**, snapshot **2026-11-12**. This verifies lifecycle forwarding, not continued WebView worker execution.
- **C2 — Released Background Runner:** [4.0.0 README: JavaScript API, Runner Lifetimes, Limitations of Background Tasks](https://github.com/ionic-team/capacitor-background-runner/blob/4ef6766ad91cbe10f135ee34b53bb71fd37715d5/packages/capacitor-plugin/README.md#L235-L283); [RunnerWorker](https://github.com/ionic-team/capacitor-background-runner/blob/4ef6766ad91cbe10f135ee34b53bb71fd37715d5/packages/capacitor-plugin/android/src/main/java/io/ionic/backgroundrunner/plugin/RunnerWorker.kt); [BackgroundRunner scheduling](https://github.com/ionic-team/capacitor-background-runner/blob/4ef6766ad91cbe10f135ee34b53bb71fd37715d5/packages/capacitor-plugin/android/src/main/java/io/ionic/backgroundrunner/plugin/BackgroundRunner.kt#L55-L82). Snapshot/release **2026-10-30**; source commit identifies release 4.0.0, unlike the separately inspected `next` branch. [Release](https://github.com/ionic-team/capacitor-background-runner/releases/tag/4.0.0).
- **C3 — Current Local Notifications docs source:** [Android permission, exact-alarm/private-space notes; Doze; channel/permission APIs](https://github.com/ionic-team/capacitor-docs/blob/4029543ef027d76519440f580c7ae9493aee3820/docs/apis/local-notifications.md). Docs snapshot **2026-11-13**; rolling documentation, not certification of every plugin release.
- **C4 — Current Android target guidance:** [Setting Android Target SDK / matrix / Capacitor 9 note](https://github.com/ionic-team/capacitor-docs/blob/4029543ef027d76519440f580c7ae9493aee3820/docs/main/android/setting-target-sdk.md); [Android Support](https://github.com/ionic-team/capacitor-docs/blob/4029543ef027d76519440f580c7ae9493aee3820/docs/main/android/index.md). Snapshot **2026-11-13**. [Latest stable Capacitor release observed: 8.6.2, published 2026-11-12](https://github.com/ionic-team/capacitor/releases/tag/8.6.2). No inference that rolling 9.x guidance is a released stable runtime.

### AndroidX WorkManager

- **W1 — Persistent scheduling and ordinary-worker execution window:** [WorkManager API class documentation](https://github.com/androidx/androidx/blob/2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9/work/work-runtime/src/main/java/androidx/work/WorkManager.kt#L30-L44); [Worker `doWork`, reconstruction, executor](https://github.com/androidx/androidx/blob/2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9/work/work-runtime/src/main/java/androidx/work/Worker.kt#L25-L74).
- **W2 — Progress, FGS and stopping:** [ListenableWorker: ten-minute ordinary invocation, `setProgressAsync`, `setForegroundAsync`, `getStopReason`, `onStopped`](https://github.com/androidx/androidx/blob/2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9/work/work-runtime/src/main/java/androidx/work/ListenableWorker.java). In particular `onStopped` says results are ignored and callback work must be lightweight.
- **W3 — Observable status and causes:** [WorkInfo `State`, `progress`, stop-reason definitions](https://github.com/androidx/androidx/blob/2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9/work/work-runtime/src/main/java/androidx/work/WorkInfo.kt).
- **W4 — Recovery and reboot:** [ForceStopRunnable: class documentation, `isForceStopped`, `forceStopRunnable`, `cleanUp`](https://github.com/androidx/androidx/blob/2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9/work/work-runtime/src/main/java/androidx/work/impl/utils/ForceStopRunnable.java); [package API docs: reboot rescheduling](https://github.com/androidx/androidx/blob/2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9/work/work-runtime/src/main/java/androidx/work/package-info.java); [manifest RescheduleReceiver and permissions](https://github.com/androidx/androidx/blob/2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9/work/work-runtime/src/main/AndroidManifest.xml#L19-L63).
- **W5 — Expedited API and quota policy:** [WorkRequest `Builder.setExpedited(OutOfQuotaPolicy)`](https://github.com/androidx/androidx/blob/2d78fd6ed70cf0f37d5494c87c7f2cf0bd2e04e9/work/work-runtime/src/main/java/androidx/work/WorkRequest.kt).

### Android platform baseline, not API 37 sign-off

- **A1 — Service lifecycle/start restrictions:** [Service: “What is a Service?”, `startForeground`, `onTaskRemoved`, sticky restart and timeout callbacks](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/java/android/app/Service.java); [Context `startForegroundService`](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/java/android/content/Context.java#L3815-L3866).
- **A2 — FGS type use cases/restrictions:** [ServiceInfo `FOREGROUND_SERVICE_TYPE_DATA_SYNC`, `SHORT_SERVICE`, `MEDIA_PROCESSING`, `SPECIAL_USE`](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/java/android/content/pm/ServiceInfo.java). These are API/source documentation, not approval of this app's declared use.
- **A3 — Scheduler eligibility/lifecycle:** [JobInfo.Builder `setExpedited`, `setUserInitiated`, `setPersisted`; validation requiring network for user-initiated transfer](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/apex/jobscheduler/framework/java/android/app/job/JobInfo.java); [JobService: main-thread callbacks, `jobFinished`, `onStopJob`, notification API](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/apex/jobscheduler/framework/java/android/app/job/JobService.java).
- **A4 — FGS-hosted job quota implementation:** [QuotaController `OVERRIDE_QUOTA_ENFORCEMENT_TO_FGS_JOBS` and `getProcessStateQuotaFreeThreshold`](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/apex/jobscheduler/service/java/com/android/server/job/controllers/QuotaController.java#L2726-L2735). Feature/compatibility configuration is a reason not to turn this baseline implementation into an unconditional API 37 claim.
- **A5 — Power and thermal API contracts:** [PowerManager `isDeviceIdleMode`, `isDeviceLightIdleMode`, `isLowPowerStandbyEnabled`, `PARTIAL_WAKE_LOCK`, thermal status/headroom](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/java/android/os/PowerManager.java).
- **A6 — WebView pause distinction:** [WebView `pauseTimers`, `onPause`, `onResume`](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/java/android/webkit/WebView.java#L1367-L1405).
- **A7 — Notification permission/channel/suppression:** [NotificationManager `createNotificationChannel`, `areNotificationsEnabled`, channel importance](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/java/android/app/NotificationManager.java); [NotificationManagerService: blocked-app suppression](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/services/core/java/com/android/server/notification/NotificationManagerService.java#L9143-L9155); [POST_NOTIFICATIONS dangerous permission](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/res/AndroidManifest.xml#L1915-L1923).
- **A8 — Special-use permission classification:** [platform manifest `FOREGROUND_SERVICE_SPECIAL_USE`](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/res/AndroidManifest.xml#L8038-L8045).
- **A9 — FGS target gates:** [ActiveServices `FGS_BOOT_COMPLETED_RESTRICTIONS`, `FGS_INTRODUCE_TIME_LIMITS`, time-limited-FGS accounting](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/services/core/java/com/android/server/am/ActiveServices.java).
- **A10 — Stop semantics:** [ActivityManagerService `stopAppForUserInternal` versus `forceStopPackage`](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/services/core/java/com/android/server/am/ActivityManagerService.java#L4243-L4285); [ApplicationExitInfo reason definitions](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/core/java/android/app/ApplicationExitInfo.java); [JobParameters stop reasons](https://github.com/aosp-mirror/platform_frameworks_base/blob/99b01a65cc4c104933788b3143285ab6bae65827/apex/jobscheduler/framework/java/android/app/job/JobParameters.java).

### Primary rendered pages requiring a fresh full read

These are **unverified retrieval targets**, not source evidence for new claims.
No “last updated” date is attributed from a search snippet.

- [Android 17 changes: all apps](https://developer.android.com/about/versions/17/behavior-changes-all), [targeting API 37](https://developer.android.com/about/versions/17/behavior-changes-17), [features/changes index](https://developer.android.com/about/versions/17/summary).
- [FGS types: Short service, Special use, Data sync](https://developer.android.com/develop/background-work/services/fgs/service-types), [background-start restrictions](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start), [timeouts](https://developer.android.com/develop/background-work/services/fgs/timeout), [version changes](https://developer.android.com/develop/background-work/services/fgs/changes), [user stopping](https://developer.android.com/develop/background-work/services/fgs/handle-user-stopping).
- [Background execution limits/quotas](https://developer.android.com/develop/background-work/background-tasks/bg-work-restrictions), [long-running workers](https://developer.android.com/develop/background-work/background-tasks/persistent/how-to/long-running), [expedited work](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work#expedited), [user-initiated data-transfer jobs](https://developer.android.com/develop/background-work/background-tasks/uidt).
- [Doze and App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby), [notification runtime permission and FGS exemption distinction](https://developer.android.com/develop/ui/views/notifications/notification-permission), [notification channels](https://developer.android.com/develop/ui/views/notifications/channels).
- [Play FGS requirements/declarations](https://support.google.com/googleplay/android-developer/answer/13392821). API availability, user initiation and successful device execution do not establish distribution-policy eligibility.
- [Capacitor Background Runner](https://capacitorjs.com/docs/apis/background-runner), [Android target SDK](https://capacitorjs.com/docs/android/setting-target-sdk), [Local Notifications](https://capacitorjs.com/docs/apis/local-notifications). Full first-party repository sources were verified above despite these rendered hosts being unavailable.
