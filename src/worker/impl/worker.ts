/// <reference path="../../extensions/trainer-sets.types.ts" />
/// <reference lib="webworker" />
import { WorkerMessage } from '../worker.api';
import '../../extensions/trainer-sets.types';

// Import the SETDEX_SS data
// This will be available globally when gen8.js is loaded by the worker
importScripts('../js/data/sets/gen8.js');

interface CalculationResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const request = event.data;

  switch (request.type) {
    case 'GET_TRAINER_NAMES':
      handleGetTrainerNames();
      break;
    default:
      self.postMessage({
        success: false,
        error: `Unknown message type: ${request.type}`
      } as CalculationResult);
  }
});


function handleGetTrainerNames(): void {
  try {
    const trainerNames: string[] = [];
    
    for (const [pokemonName, trainers] of Object.entries(SETDEX_SS)) {
      const trainerList = Object.keys(trainers);
      for (const trainerName of trainerList) {
        const index = trainers[trainerName].index;
        trainerNames.push(`[${index}]${pokemonName} (${trainerName})`);
      }
    }
    
    self.postMessage({
      success: true,
      data: trainerNames
    } as CalculationResult);
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as CalculationResult);
  }
}