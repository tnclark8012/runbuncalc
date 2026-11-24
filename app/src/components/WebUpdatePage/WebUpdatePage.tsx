import type {WebUpdateState} from '../../updates';

interface WebUpdatePageProps {
  supported: boolean;
  state?: WebUpdateState;
  error: string;
  busy: boolean;
  check(): Promise<void>;
}

export function WebUpdatePage({supported, state, error, busy, check}: WebUpdatePageProps) {
  if (!supported) return null;
  return <section aria-labelledby="web-updates-title">
    <h2 id="web-updates-title">Calculator updates</h2>
    <p>Updates are checked automatically from the continuous GitHub release channel.
      Downloaded updates apply when you close and reopen the app, not during a battle.
      Your current calculator remains available offline.</p>
    <p>Current version: {state?.active ?? 'Loading...'}</p>
    {state?.pending && <p>Ready for next launch: {state.pending}</p>}
    {state?.message && <p role={state.error ? 'alert' : 'status'}>{state.message}</p>}
    {error && <p role="alert">{error}</p>}
    <button type="button" disabled={busy} onClick={() => void check()}>
      {busy ? 'Checking for updates...' : 'Check for updates'}
    </button>
    <p>Native features still require installing a new APK. An update that cannot
      start is rolled back automatically; it will not be retried until a different release appears.</p>
  </section>;
}
