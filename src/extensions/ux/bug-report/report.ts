import {errorMessage} from './bundle';
import type {PreparedReport} from './bundle';
import {captureReport} from './capture';
import './contracts';

const ACKNOWLEDGMENT = 'bug-report-public-sharing-v1';

export function initializeBugReport(): void {
  const button = document.querySelector<HTMLButtonElement>('#report-bug');
  if (!button) return;
  const dialog = document.querySelector<HTMLDialogElement>('#bug-report-dialog')!;
  const status = document.querySelector<HTMLElement>('#report-bug-status')!;
  const progress = document.querySelector<HTMLElement>('#bug-report-progress')!;
  const missing = document.querySelector<HTMLElement>('#bug-report-missing')!;
  const filename = document.querySelector<HTMLElement>('#bug-report-filename')!;
  const privacy = document.querySelector<HTMLElement>('#bug-report-privacy')!;
  const save = document.querySelector<HTMLButtonElement>('#bug-report-save')!;
  const close = document.querySelector<HTMLButtonElement>('#bug-report-close')!;
  const open = document.querySelector<HTMLAnchorElement>('#bug-report-open')!;
  let report: PreparedReport | undefined;
  let saving = false;

  button.addEventListener('click', async () => {
    button.disabled = true;
    status.setAttribute('role', 'status');
    status.textContent = 'Preparing diagnostic ZIP...';
    try {
      // Capture before opening the dialog or native save picker.
      report = await captureReport(window.runbunDiagnostics);
      filename.textContent = report.filename;
      missing.textContent = report.missing.length
        ? `Partial report. Missing diagnostics: ${report.missing.join(' ')} You can still report this bug.`
        : 'All diagnostics captured.';
      try {
        privacy.hidden = localStorage.getItem(ACKNOWLEDGMENT) === 'true';
        progress.textContent = 'Ready. Nothing has been uploaded.';
      } catch (error) {
        privacy.hidden = false;
        progress.textContent = `Ready. Nothing has been uploaded. Cannot read sharing acknowledgment: ${errorMessage(error)}`;
      }
      open.hidden = true;
      save.hidden = false;
      save.disabled = false;
      close.textContent = 'Cancel';
      status.textContent = '';
      dialog.showModal();
    } catch (error) {
      status.setAttribute('role', 'alert');
      status.textContent = `Cannot prepare report: ${errorMessage(error)}`;
    } finally {
      button.disabled = false;
    }
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  save.addEventListener('click', async () => {
    if (!report || saving) return;
    const native = window.runbunDiagnostics;
    // Reserve a tab during the user gesture, avoiding popup blocking after async ZIP/save work.
    const tab = native ? null : window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    saving = true;
    save.disabled = true;
    close.disabled = true;
    progress.setAttribute('role', 'status');
    progress.textContent = 'Saving ZIP...';
    let saved = false;
    try {
      let acknowledgmentStatus = '';
      try {
        localStorage.setItem(ACKNOWLEDGMENT, 'true');
        privacy.hidden = true;
      } catch (error) {
        acknowledgmentStatus = `Sharing acknowledgment could not be remembered: ${errorMessage(error)}. `;
      }
      const options = {compression: 'DEFLATE' as const, compressionOptions: {level: 6}};
      let actualName = report.filename;
      if (native) {
        const base64 = await report.zip.generateAsync({...options, type: 'base64'});
        checkZipSize(Math.floor(base64.length * 3 / 4));
        actualName = await native.saveZip(report.filename, base64);
      } else {
        const blob = await report.zip.generateAsync({...options, type: 'blob'});
        checkZipSize(blob.size);
        downloadZip(report.filename, blob);
      }
      saved = true;
      filename.textContent = actualName;
      const url = new URL(report.issueUrl);
      if (actualName !== report.filename) {
        url.searchParams.set('body', url.searchParams.get('body')!.replace(report.filename, actualName));
      }
      open.href = url.href;
      open.hidden = false;
      let copyStatus = 'Filename copied to clipboard.';
      try {
        if (native) await native.copyFilename(actualName);
        else await navigator.clipboard.writeText(actualName);
      } catch (error) {
        copyStatus = `Could not copy filename: ${errorMessage(error)} Copy the filename shown above manually.`;
      }
      progress.textContent = `${native ? 'ZIP saved.' : 'ZIP download started; check your downloads.'} ${copyStatus} ${acknowledgmentStatus}Attach the ZIP manually in GitHub.`;
      save.hidden = true;
      close.textContent = 'Close';
      if (native) await native.openIssue(url.href);
      else if (tab && !tab.closed) tab.location.replace(url.href);
      else progress.textContent += ' The browser blocked the new tab; use Open GitHub issue editor below.';
    } catch (error) {
      if (tab && !tab.closed) tab.close();
      progress.setAttribute('role', 'alert');
      progress.textContent = `${saved ? 'ZIP saved, but GitHub could not open' : 'ZIP was not saved; GitHub was not opened'}: ${errorMessage(error)}`;
    } finally {
      saving = false;
      save.disabled = false;
      close.disabled = false;
    }
  });
}

function downloadZip(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function checkZipSize(bytes: number): void {
  if (bytes > 25000000) throw new Error('The ZIP exceeds GitHub\'s 25 MB attachment limit.');
}
