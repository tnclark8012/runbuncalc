import { SetCollectionData } from "../extensions/core/storage.contracts";
import { TrainerNames } from "../extensions/trainer-sets.data";

export type WorkerRequest = GetTrainerPathRequest;
export interface GetTrainerPathRequest extends WorkerRequestBase {
    type: 'GET_TRAINER_PATH';
    payload: {
        trainerName: TrainerNames;
        setCollection: SetCollectionData;
    }
}

export type WorkerResponse = GetTrainerPathResponse;

export type WorkerMessage = WorkerRequest | WorkerResponse;

export interface GetTrainerPathResponse extends WorkerResponseBase {
    type: 'GET_TRAINER_PATH';
    payload: string;
}

export interface WorkerRequestBase {
}

export interface WorkerResponseBase {
    success: boolean;
    error?: string;
}