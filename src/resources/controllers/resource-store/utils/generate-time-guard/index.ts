import { GenerateTimeGuardReturn } from './types';

export const generateTimeGuard = (
  duration: number
): GenerateTimeGuardReturn => {
  const promiseState: GenerateTimeGuardReturn = {
    timerId: null,
    isPending: true,
    promise: undefined,
  };

  promiseState.promise = new Promise<void>(r => {
    const timerId = setTimeout(() => {
      promiseState.isPending = false;
      r();
    }, duration);
    promiseState.timerId = timerId;
  });

  return promiseState;
};
