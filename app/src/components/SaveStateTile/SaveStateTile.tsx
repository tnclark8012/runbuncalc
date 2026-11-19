import {Capacitor} from '@capacitor/core';
import {useState} from 'react';
import type {SaveStateTileProps} from './SaveStateTileProps';

export function SaveStateTile({file, selected, onSelect}: SaveStateTileProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const label = file.name.replace(/\.jg[0-9]+$/i, '');
  return <button type="button" className="save-state-tile" aria-pressed={selected}
    aria-label={file.name} title={file.name} onClick={() => onSelect(file.uri)}>
    {file.preview && !previewFailed
      ? <img src={Capacitor.convertFileSrc(file.preview.uri)} alt="" loading="lazy"
        onError={() => setPreviewFailed(true)} />
      : <span className="save-state-preview-error">Screenshot unavailable</span>}
    <span className="save-state-label">{label}</span>
    {selected && <span className="save-state-connected">Connected</span>}
  </button>;
}
