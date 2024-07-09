
export enum WorkerMessageType {
    log,
    loadChunk,
}

export interface WorkerMessageInterface {
    type: WorkerMessageType;
    payload: any;
}