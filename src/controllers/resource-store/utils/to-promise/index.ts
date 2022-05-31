export const toPromise = <T>(candidate: T | Promise<T>): Promise<T> =>
  candidate instanceof Promise ? candidate : Promise.resolve(candidate);
