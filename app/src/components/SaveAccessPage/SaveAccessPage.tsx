import type {SaveAccessPageProps} from './SaveAccessPageProps';
import {SaveStateTile} from '../SaveStateTile/SaveStateTile';

export function SaveAccessPage(props: SaveAccessPageProps) {
  const {target, state, files, result, busy, supported, error} = props;
  const ready = state?.access === 'ready';
  const title = target === 'rom' ? 'Run & Bun ROM (.gba)' : 'John GBA snapshot (.jgN)';
  return <section aria-label={title}>
    <h2>{title}</h2>
    {error && <p role="alert" className="error">{error}</p>}
    {supported && <p role="status">{busy ? 'Working...' : `File access: ${state?.access ?? 'loading'}`}</p>}
    {(state?.access === 'permission-required' || state?.access === 'missing')
      && <p>The save is unavailable. Select another tile or reconnect its folder to restore access.</p>}
    <fieldset disabled={busy || !supported}>
      <legend>File connection</legend>
      <button onClick={props.chooseFolder}>{state?.source === 'folder' ? 'Change folder' : 'Choose folder'}</button>
      <button onClick={props.refresh}>Refresh folder</button>
      <button onClick={props.forget}>Forget connection</button>
      {state?.source === 'folder' && <>
        <h3>Save states</h3>
        <div className="save-state-list" aria-label="Save states">
          {files.map(file => <SaveStateTile
            key={`${file.uri}:${file.preview?.uri}:${file.preview?.modifiedAt}:${file.preview?.size}`}
            file={file} selected={state.selectedUri === file.uri} onSelect={props.selectFile} />)}
        </div>
        {props.truncated && <p>Only the first 200 snapshots are checked for matching screenshots. Choose a narrower folder.</p>}
        {!files.length && (ready || state.access === 'missing')
          && <p>No matching .jgN/.jsN pairs found. Both files must have the same name and slot number.
            Subfolders are not scanned.</p>}
      </>}
    </fieldset>
    {state?.selectedFile && <p>Connected: <strong>{state.selectedFile.name}</strong></p>}
    <details>
      <summary>Connection diagnostics</summary>
      <fieldset disabled={busy || !supported}>
        <button onClick={props.read} disabled={!ready || !state?.selectedFile}>
          Check latest file
        </button>
      </fieldset>
      <h3>Latest connection check</h3>
      {result ? <dl>
        <dt>File</dt><dd>{result.document.name}</dd>
        <dt>Bytes read</dt><dd>{result.bytes.toLocaleString()}</dd>
        <dt>SHA-256</dt><dd>{result.sha256}</dd>
        <dt>Read at</dt><dd>{result.readAt}</dd>
      </dl> : <p>No read in this session.</p>}
      <p>Android grants document URIs, not unrestricted filesystem paths.
        Avoid sharing details containing private filenames.</p>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </details>
  </section>;
}
