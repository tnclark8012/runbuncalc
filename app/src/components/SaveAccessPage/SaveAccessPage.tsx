import type {SaveAccessPageProps} from './SaveAccessPageProps';

export function SaveAccessPage(props: SaveAccessPageProps) {
  const {state, files, result, busy, supported, error} = props;
  const ready = state?.access === 'ready';
  return <main>
    <h1>RnB Calc</h1>
    <p>Connect an emulator save once, then read the latest stored bytes with one tap.
      Everything stays on your device. Save decoding and battle planning are not connected yet.</p>
    {!supported && <p role="status">Save connections currently require the Android app.
      Browser and iOS storage integrations are not implemented.</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {supported && <p role="status">{busy ? 'Working...' : `Save access: ${state?.access ?? 'loading'}`}</p>}
    {(state?.access === 'permission-required' || state?.access === 'missing')
      && <p>The save is unavailable. Reconnect its file or folder to restore access.</p>}
    <fieldset disabled={busy || !supported}>
      <legend>Save connection</legend>
      <button onClick={props.chooseFolder}>Connect save folder</button>
      <button onClick={props.chooseFile}>Connect single file</button>
      <button onClick={props.refresh}>Refresh connection</button>
      <button onClick={props.forget}>Forget connection</button>
      {state?.source === 'folder' && <>
        <label htmlFor="save-file">Files in the connected folder</label>
        <select id="save-file" value={state.selectedUri ?? ''}
          onChange={event => props.selectFile(event.target.value)} disabled={!ready}>
          <option value="" disabled>Select a file</option>
          {files.map(file => <option key={file.uri} value={file.uri}>{file.name}</option>)}
        </select>
        {props.truncated && <p>Only the first 200 files are shown. Connect a narrower folder.</p>}
        {!files.length && ready && <p>No direct child files found. Subfolders are not scanned.</p>}
      </>}
      <button onClick={props.read} disabled={!ready || !state?.selectedFile}>
        Read latest save
      </button>
    </fieldset>
    <h2>Latest read</h2>
    {result ? <dl>
      <dt>File</dt><dd>{result.document.name}</dd>
      <dt>Bytes read</dt><dd>{result.bytes.toLocaleString()}</dd>
      <dt>SHA-256</dt><dd>{result.sha256}</dd>
      <dt>Read at</dt><dd>{result.readAt}</dd>
    </dl> : <p>No read in this session.</p>}
    <p>Compare hashes after an in-game save to see whether stored bytes changed.
      Reads are limited to 32 MiB. This does not read live emulator memory or decode save states.</p>
    <details>
      <summary>Connection details</summary>
      <p>Android grants document URIs, not unrestricted filesystem paths.
        Avoid sharing details containing private filenames.</p>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </details>
  </main>;
}
