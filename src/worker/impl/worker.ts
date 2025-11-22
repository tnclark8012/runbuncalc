import { BattleFieldStateBuilder } from '../../extensions/simulator/battle-field-state-builder';
import { findPlayerWinningPath, printDecisionTree } from '../../extensions/simulator/path-finder';
import { GetTrainerPathRequest, GetTrainerPathResponse, WorkerRequest, WorkerResponseBase } from '../worker.api';

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  switch (request.type) {
    case 'GET_TRAINER_PATH':
      handleGetTrainerPath(request.payload);
      break;
    default:
      self.postMessage({
        success: false,
        error: `Unknown message type: ${request.type}`
      } as WorkerResponseBase);
  }
});


function handleGetTrainerPath({ trainerName, setCollection }: GetTrainerPathRequest['payload']): void {
  try {
    const state = BattleFieldStateBuilder.buildTrainerBattle(setCollection, trainerName);
    const path = findPlayerWinningPath(state);
    self.postMessage({
      success: true,
      type: 'GET_TRAINER_PATH',
      payload: path ? printDecisionTree(path) : 'No path found'
    } as GetTrainerPathResponse);
  } catch (error) {
    self.postMessage({
      success: false,
      type: 'GET_TRAINER_PATH',
      payload: JSON.stringify(error),
      error: error instanceof Error ? error.message : 'Unknown error'
    } as GetTrainerPathResponse);
  }
}