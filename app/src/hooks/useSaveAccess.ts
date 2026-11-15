import {useCallback, useEffect, useRef, useState} from 'react';
import {
  describeSaveError, saveAccess, supportsSaveAccess, wasPickerCancelled,
  type SaveAccessState, type SaveDocument, type SaveRead,
} from '../storage/save-access';

export function useSaveAccess() {
  const [state, setState] = useState<SaveAccessState | null>(null);
  const [files, setFiles] = useState<SaveDocument[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [result, setResult] = useState<SaveRead | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const run = useCallback(async (action: () => Promise<void>) => {
    if (running.current || !supportsSaveAccess) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      if (!wasPickerCancelled(failure)) setError(describeSaveError(failure));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const next = await saveAccess.getState();
    setState(next);
    if (next.source === 'folder' && next.access === 'ready') {
      const listing = await saveAccess.listFiles();
      setFiles(listing.files);
      setTruncated(listing.truncated);
    } else {
      setFiles([]);
      setTruncated(false);
    }
  }, []);

  useEffect(() => { void run(refresh); }, [run, refresh]);

  const choose = (kind: 'file' | 'folder') => run(async () => {
    const next = await (kind === 'file' ? saveAccess.chooseFile() : saveAccess.chooseFolder());
    setState(next);
    setResult(null);
    setFiles([]);
    await refresh();
  });

  return {
    state, files, truncated, result, busy, error, supported: supportsSaveAccess,
    chooseFile: () => choose('file'),
    chooseFolder: () => choose('folder'),
    refresh: () => run(refresh),
    selectFile: (uri: string) => run(async () => {
      setState(await saveAccess.selectFile({uri}));
      setResult(null);
    }),
    read: () => run(async () => {
      setResult(null);
      try {
        setResult(await saveAccess.readSelected());
      } catch (failure) {
        try {
          await refresh();
        } catch (refreshFailure) {
          throw new Error(`${describeSaveError(failure)} Connection refresh also failed: ${describeSaveError(refreshFailure)}`);
        }
        throw failure;
      }
      await refresh();
    }),
    forget: () => run(async () => {
      setState(await saveAccess.forget());
      setFiles([]);
      setTruncated(false);
      setResult(null);
    }),
  };
}
