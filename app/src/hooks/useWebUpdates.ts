import {useEffect, useState} from 'react';
import {describeSaveError} from '../storage/save-access';
import {supportsWebUpdates, webUpdates, type WebUpdateState} from '../updates';

export function useWebUpdates() {
  const [state, setState] = useState<WebUpdateState>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!supportsWebUpdates) return;
    let active = true;
    const refresh = () => {
      void webUpdates.getState().then(value => {
        if (active) setState(value);
      }).catch(failure => {
        if (active) setError(describeSaveError(failure));
      });
    };
    refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const check = async () => {
    setBusy(true);
    setError('');
    try {
      setState(await webUpdates.check());
    } catch (failure) {
      setError(describeSaveError(failure));
    } finally {
      setBusy(false);
    }
  };
  return {supported: supportsWebUpdates, state, error, busy: busy || !!state?.checking, check};
}
