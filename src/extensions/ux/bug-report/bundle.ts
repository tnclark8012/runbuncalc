import JSZip from 'jszip';
import type {DiagnosticFile} from './contracts';

export interface ReportFile {
  name: string;
  data: string;
  base64?: boolean;
}

export interface PreparedReport {
  filename: string;
  zip: JSZip;
  missing: string[];
  issueUrl: string;
}

export function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return String(error);
}

export function decodedSnapshots(collections: string | null): Record<string, unknown> {
  if (!collections) return {};
  const parsed: unknown = JSON.parse(collections);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Stored set collections are not an object.');
  }
  const snapshots: Record<string, unknown> = {};
  for (const [name, collection] of Object.entries(parsed)) {
    if (typeof collection === 'object' && collection !== null && 'gameStateSnapshot' in collection) {
      snapshots[name] = collection.gameStateSnapshot;
    }
  }
  return snapshots;
}

export function currentJgFiles(file: DiagnosticFile): ReportFile[] {
  if (!file.dataBase64) throw new Error('The connected JG file returned no bytes.');
  // Keep the original display name in metadata, never as an unchecked ZIP path.
  const basename = file.name.split(/[\\/]/).pop() || 'snapshot.jg0';
  const name = basename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '') || 'snapshot.jg0';
  return [
    {name: `current-jg/${name}`, data: file.dataBase64, base64: true},
    {name: 'current-jg/metadata.json', data: JSON.stringify({
      ...file.metadata,
      originalName: file.name,
      note: 'Read at report time. This file may differ from the previously decoded/synced snapshot.',
    }, null, 2)},
  ];
}

export function prepareBundle(
  capturedAt: string,
  files: ReportFile[],
  missing: string[],
  environment: Record<string, unknown>,
): PreparedReport {
  const filename = `runbuncalc-report-${capturedAt.replace(/[:.]/g, '-')}.zip`;
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, file.data, {base64: file.base64 ?? false});
  zip.file('manifest.json', JSON.stringify({
    schemaVersion: 1,
    capturedAt,
    environment,
    files: files.map(file => file.name),
    missing,
    limitations: [
      'Export only: no automatic state restoration, click history, or RNG replay.',
      'Decoded JG content is the imported snapshot, not necessarily the currently connected JG file.',
      'Browser screenshots are rendered from the page DOM, not operating-system screenshots.',
    ],
  }, null, 2));
  const body = [
    '## What went wrong?',
    '<!-- Describe the bug and the steps that led to it. -->',
    '',
    '## What did you expect?',
    '',
    '## Diagnostics',
    `Attach \`${filename}\` here using the paperclip or drag and drop.`,
    'Copying the filename does not attach the ZIP. Review its contents before posting publicly.',
    ...(missing.length ? ['', 'Missing diagnostics:', ...missing.map(item => `- ${item}`)] : []),
  ].join('\n');
  const query = new URLSearchParams({title: 'Bug report', body});
  return {
    filename,
    zip,
    missing,
    issueUrl: `https://github.com/tnclark8012/runbuncalc/issues/new?${query}`,
  };
}
