export class TimeoutError extends Error {
  constructor(message: string) {
    super('Resource timed out: ' + message);
    this.name = 'TimeoutError';
  }
}
