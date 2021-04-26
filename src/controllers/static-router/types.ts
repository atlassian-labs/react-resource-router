import { ResourceStoreContext, Routes } from '../../common/types';

export type RequestResourcesParams = {
  location: string;
  routes: Routes;
  resourceContext?: ResourceStoreContext;
  maxWaitTime?: number;
};
