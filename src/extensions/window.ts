export * from './ux/update-color-codes';
export { importBoxJson } from './ux/party';
export const PerformCalculationsEventName = 'performCalculations';

export function performCalculations() {
  const event = new Event(PerformCalculationsEventName);
  document.dispatchEvent(event);
}