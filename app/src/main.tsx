import {createRoot} from 'react-dom/client';
import {useEffect} from 'react';
import {SaveAccessPage} from './components/SaveAccessPage/SaveAccessPage';
import {useSaveAccess} from './hooks/useSaveAccess';

function App() {
  const snapshot = useSaveAccess('snapshot');
  const refreshSnapshot = snapshot.refresh;
  useEffect(() => {
    void refreshSnapshot();
  }, [refreshSnapshot]);
  return <main>
    <h1>App settings</h1>
    <a href="index.html">Back to calculator</a>
    <p>Select your emulator snapshot once. No ROM file is needed.
      On the calculator, use <strong>Sync</strong> to
      read the latest snapshot, decode it, and replace the imported boxes and party.
      Files and decoded data stay on your device.</p>
    <p>The supported Run &amp; Bun game-data tables are included.
      Other ROM revisions or modified games are not verified.</p>
    <p>Use a John GBA .jgN snapshot, not a battery .sav or .jsN preview.
      Wait for the emulator to finish saving before syncing.
      The snapshot is limited to 32 MiB.</p>
    {!snapshot.supported && <p role="status">File connections require the Android app.
      In a browser, use the calculator's snapshot decoder and Import box instead.</p>}
    <SaveAccessPage {...snapshot} />
    <p>Sync retains the decoded snapshot for future planner integration; it does not hydrate
      the simulator or infer whether a battle is active. Forgetting a connection does not
      delete files or clear an already imported collection.</p>
  </main>;
}

const root = document.getElementById('root');
if (!root) throw new Error('App root is missing');
createRoot(root).render(<App />);
