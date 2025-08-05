export class NotImplementedError extends Error {
    constructor(message?: string) {
        super(message || 'Not implemented');
    }
}

export function notImplemented(message?: string): never {
    throw new NotImplementedError(message);
}