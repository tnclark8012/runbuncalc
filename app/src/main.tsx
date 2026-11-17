import {createRoot} from 'react-dom/client';
import {useEffect} from 'react';
import {SaveAccessPage} from './components/SaveAccessPage/SaveAccessPage';
import {useSaveAccess} from './hooks/useSaveAccess';

function App() {
  const snapshot = useSaveAccess('snapshot');
  const rom = useSaveAccess('rom');
  const refreshSnapshot = snapshot.refresh;
  const refreshRom = rom.refresh;
  useEffect(() => {
    void (async () => {
      await refreshSnapshot();
      await refreshRom();
    })();
  }, [refreshSnapshot, refreshRom]);
  const busy = snapshot.busy || rom.busy;
  return <main>
    <h1>App settings</h1>
    <a href="index.html">Back to calculator</a>
    <p>Select your ROM and emulator snapshot once. On the calculator, use <strong>Sync</strong> to
      read the latest saved files, decode them, and replace the imported boxes and party.
      Files and decoded data stay on your device.</p>
    <p>Use a John GBA .jgN snapshot, not a battery .sav or .jsN preview.
      Wait for the emulator to finish saving before syncing.
      Each file is limited to 32 MiB.</p>
    {!snapshot.supported && <p role="status">File connections require the Android app.
      In a browser, use the calculator's snapshot decoder and Import box instead.</p>}
    <SaveAccessPage {...snapshot} busy={busy} />
    <SaveAccessPage {...rom} busy={busy} />
    <p>Sync retains the decoded snapshot for future planner integration; it does not hydrate
      the simulator or infer whether a battle is active. Forgetting a connection does not
      delete files or clear an already imported collection.</p>
  </main>;
}

const root = document.getElementById('root');
if (!root) throw new Error('App root is missing');
createRoot(root).render(<App />);
