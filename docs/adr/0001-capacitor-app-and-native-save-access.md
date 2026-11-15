# Use Capacitor for the web-based Android companion

RnB Calc will keep its UI in web technology, so use Capacitor under `app/` rather
than grow the throwaway WebView shell or rewrite the UI natively. Keep Android
document permissions, versioned URI selection persistence, and file I/O behind a
local typed save-access plugin: the phone-tested Storage Access Framework approach
supports repeat reads without root, whereas a browser-only PWA does not establish
the same retained-access contract. This accepts Capacitor's native build/tooling
dependency while isolating platform storage from presentation; it does not choose
the simulator architecture or imply iOS/browser save access is implemented.
The user explicitly chose Android 17 (API 37) as the minimum supported version.
