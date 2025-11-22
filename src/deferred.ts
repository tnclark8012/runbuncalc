export class Deferred<T> {
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: any) => void;
  public promise: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  public resolve(value: T | PromiseLike<T>): void {
    this._resolve(value);
  }

  public reject(reason: Error): void {
    this._reject(reason);
  }
}