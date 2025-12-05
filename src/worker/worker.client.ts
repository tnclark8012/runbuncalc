import { Deferred } from "../deferred";
import { SetCollectionData } from "../extensions/core/storage.contracts";
import { TrainerNames } from "../extensions/trainer-sets.data";
import { WorkerMessage, WorkerResponse } from "./worker.api";

// Web Worker API
let calculationWorker: Worker | null = null;

let activeRequest: Deferred<any> | undefined;

function initializeWorker(): void {
    if (calculationWorker) {
        return; // Worker already initialized
    }

    calculationWorker = new Worker('worker.bundle.js');

    calculationWorker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const { success, error, type, payload } = event.data;

        if (success) {
            console.log('Worker calculation result:');
            activeRequest?.resolve(payload);
            // Handle successful calculation
        } else {
            console.error('Worker calculation error:', error);
            activeRequest?.reject(new Error(error));
            // Handle error
        }
    });

    calculationWorker.addEventListener('error', (event: ErrorEvent) => {
        console.error('Worker error:', event.message);
        activeRequest?.reject(new Error(event.message));
    });
}

export function findPathForParty(trainerName: TrainerNames, setData: SetCollectionData): Promise<string> {
    return sendMessage({ type: 'GET_TRAINER_PATH', payload: {
        trainerName, setCollection: setData
    } });
}

function sendMessage<T = void>(message: WorkerMessage): Promise<T> {
    if (!calculationWorker) {
        initializeWorker();
    }

    if (activeRequest) {
        activeRequest.reject(new Error('A new request has been made'));
    }

    activeRequest = new Deferred<T>();
    calculationWorker!.postMessage(message);
    return activeRequest.promise;
}

export function terminateWorker(): void {
    if (calculationWorker) {
        calculationWorker.terminate();
        calculationWorker = null;
    }
}