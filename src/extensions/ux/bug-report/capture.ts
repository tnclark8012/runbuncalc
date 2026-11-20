import html2canvas from 'html2canvas';
import {currentJgFiles, decodedSnapshots, errorMessage, prepareBundle} from './bundle';
import type {PreparedReport, ReportFile} from './bundle';
import type {DiagnosticBridge} from './contracts';

declare const __REPORT_BUILD__: {revision: string; builtAt: string; dexVersion: string};

const STORAGE_KEYS = [
  'activeCollection', 'setCollection', 'customsets', 'darkTheme', 'theme-mode',
  'lasttimetrainer', 'doubleLegacy', 'hsidearrow', 'truckMsg', 'isNotNew',
];
const LIVE_KEYS = [
  'CALC_STATUS', 'gen', 'genWasChanged', 'notation', 'nextTrainerId', 'previousTrainerId',
  'CURRENT_TRAINER', 'CURRENT_TRAINER_POKS', 'AUTO_REFRESH', 'NO_CALC',
  'lastManualWeather', 'lastAutoWeather', 'lastManualTerrain',
  'lastAutoTerrain', 'lastManualStatus', 'lastAutoStatus', 'lockerMove', 'screenDivCount',
];

export function capturePageState(): unknown {
  const storage: Record<string, string | null> = {};
  for (const key of STORAGE_KEYS) storage[key] = localStorage.getItem(key);
  const controls = Array.from(document.querySelectorAll('input, select, textarea'))
    .filter(element => !element.closest('#bug-report-dialog'))
    .filter((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
    .filter(element => !(element instanceof HTMLInputElement && ['password', 'file'].includes(element.type)))
    .map(element => ({
      id: element.id,
      name: element.name,
      tag: element.tagName,
      type: element.type,
      className: element.className,
      parentId: element.closest('[id]')?.id,
      path: elementPath(element),
      value: element.value,
      checked: element instanceof HTMLInputElement ? element.checked : undefined,
      selected: element instanceof HTMLSelectElement
        ? Array.from(element.selectedOptions, option => ({index: option.index, value: option.value, text: option.text}))
        : undefined,
    }));
  const live: Record<string, unknown> = {};
  for (const key of LIVE_KEYS) live[key] = Reflect.get(window, key);
  return {
    storage,
    controls,
    live,
    bodyClass: document.body.className,
    scroll: {x: window.scrollX, y: window.scrollY},
    panels: Array.from(document.querySelectorAll('.box-frame'), panel => ({
      id: panel.id, hidden: panel.hasAttribute('hidden'), style: panel.getAttribute('style'),
      text: panel.textContent,
    })),
    results: document.querySelector('.move-result-group')?.textContent,
    teams: Array.from(document.querySelectorAll<HTMLElement>('.trainer-pok, .opposite-pok'), element => ({
      className: element.className, id: element.id, data: {...element.dataset},
      parentPath: element.parentElement ? elementPath(element.parentElement) : null,
    })),
  };
}

function elementPath(element: Element): string {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== document.body) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    parts.unshift(`${node.tagName.toLowerCase()}:nth-child(${Array.from(parent.children).indexOf(node) + 1})`);
    node = parent;
  }
  return `body > ${parts.join(' > ')}`;
}

export async function captureReport(native?: DiagnosticBridge): Promise<PreparedReport> {
  const capturedAt = new Date().toISOString();
  const files: ReportFile[] = [];
  const missing: string[] = [];
  const environment: Record<string, unknown> = {
    build: __REPORT_BUILD__,
    platform: native ? 'android' : 'browser',
    userAgent: navigator.userAgent,
    language: navigator.language,
    page: location.pathname,
    viewport: {width: innerWidth, height: innerHeight, devicePixelRatio},
  };
  try {
    files.push({name: 'calculator-state.json', data: JSON.stringify(capturePageState(), null, 2)});
  } catch (error) {
    missing.push(`Calculator state: ${errorMessage(error)}`);
  }
  try {
    const snapshots = decodedSnapshots(localStorage.getItem('setCollection'));
    if (!Object.keys(snapshots).length) missing.push('Decoded JG: no imported snapshot is available.');
    else files.push({name: 'decoded-jg.json', data: JSON.stringify(snapshots, null, 2)});
  } catch (error) {
    missing.push(`Decoded JG: ${errorMessage(error)}`);
  }
  // Start the viewport capture before the report dialog or save picker is shown.
  const screenshot = captureScreenshot(native).then(
    data => { files.push({name: 'screenshot.png', data, base64: true}); },
    error => { missing.push(`Screenshot: ${errorMessage(error)}`); },
  );
  const currentJg = native ? native.readCurrentJg().then(
    file => { files.push(...currentJgFiles(file)); },
  ).catch(error => { missing.push(`Current JG: ${errorMessage(error)}`); })
    : Promise.resolve().then(() => { missing.push('Current JG: native linked-file access is unavailable in this browser.'); });
  const appInfo = native ? native.getAppInfo().then(
    info => { environment.app = info; },
    error => { missing.push(`Android build info: ${errorMessage(error)}`); },
  ) : Promise.resolve();
  await Promise.all([screenshot, currentJg, appInfo]);
  return prepareBundle(capturedAt, files, missing, environment);
}

async function captureScreenshot(native?: DiagnosticBridge): Promise<string> {
  if (native) {
    const data = await native.captureScreenshot();
    if (!data) throw new Error('The screenshot was empty.');
    return data;
  }
  const canvas = await html2canvas(document.body, {
    x: window.scrollX,
    y: window.scrollY,
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    logging: false,
    imageTimeout: 10000,
  });
  const url = canvas.toDataURL('image/png');
  if (!url.startsWith('data:image/png;base64,')) throw new Error('The screenshot could not be encoded.');
  return url.substring(url.indexOf(',') + 1);
}
