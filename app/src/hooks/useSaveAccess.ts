import {useCallback, useRef, useState} from 'react';
import {
  describeSaveError, saveAccess, supportsSaveAccess, wasPickerCancelled,
  type SaveAccessState, type SaveDocument, type SaveRead, type SaveTarget,
} from '../storage/save-access';

export function useSaveAccess(target: SaveTarget) {
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
    const next = await saveAccess.getState({target});
    setState(next);
    if (next.source === 'folder' && next.access === 'ready') {
      const listing = await saveAccess.listFiles({target});
      setFiles(listing.files);
      setTruncated(listing.truncated);
    } else {
      setFiles([]);
      setTruncated(false);
    }
  }, [target]);
  const refreshConnection = useCallback(() => run(refresh), [run, refresh]);

  const choose = (kind: 'file' | 'folder') => run(async () => {
    const next = await (kind === 'file' ? saveAccess.chooseFile({target}) : saveAccess.chooseFolder({target}));
    setState(next);
    setResult(null);
    setFiles([]);
    await refresh();
  });

  return {
    target, state, files, truncated, result, busy, error, supported: supportsSaveAccess,
    chooseFile: () => choose('file'),
    chooseFolder: () => choose('folder'),
    refresh: refreshConnection,
    selectFile: (uri: string) => run(async () => {
      setState(await saveAccess.selectFile({uri, target}));
      setResult(null);
    }),
    read: () => run(async () => {
      setResult(null);
      try {
        setResult(await saveAccess.readSelected({target}));
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
      setState(await saveAccess.forget({target}));
      setFiles([]);
      setTruncated(false);
      setResult(null);
    }),
  };
}
