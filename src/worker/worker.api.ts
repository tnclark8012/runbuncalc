export type WorkerMessage = GetTrainersRequest;

export interface GetTrainersRequest {
    type: 'GET_TRAINER_NAMES';
}

export type WorkerResponse = WorkerResponseBase;

export interface GetTrainersResponse extends WorkerResponseBase {
    data?: string[];
}

export interface WorkerResponseBase {
    success: boolean;
    error?: string;
}