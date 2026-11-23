import { getTrainerMetadata } from "./trainer-sets.metadata";
import type { TrainerNames } from "./trainer-sets.data";
import type { FieldState } from "./ux/store/fieldSlice";
export * from './ux/update-color-codes';
export { importBoxJson } from './ux/party';
export const PerformCalculationsEventName = 'performCalculations';

export function performCalculations() {
  const event = new Event(PerformCalculationsEventName);
  document.dispatchEvent(event);
}
export function getTrainerFieldState(trainerName: string): Partial<FieldState> | undefined {
  return getTrainerMetadata(trainerName as TrainerNames)?.fieldState;
}
