import { getResourceStore } from '../resource-store';

export const addResourcesListener = (fn: (...args: any) => any) =>
  getResourceStore().storeState.subscribe(fn);
