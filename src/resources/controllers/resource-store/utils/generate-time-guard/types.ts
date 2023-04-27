export type GenerateTimeGuardReturn = {
  timerId: null | NodeJS.Timeout;
  isPending: boolean;
  promise: undefined | Promise<void>;
};
