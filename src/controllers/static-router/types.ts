import { ResourceStoreContext, Routes, Loader } from '../../common/types';

export type RequestResourcesParams = {
  location: string;
  routes: Routes;
  resourceContext?: ResourceStoreContext;
  timeout?: number;
  loader?: Loader;
};
