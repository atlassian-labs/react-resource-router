import { ReactNode } from 'react';

import {
  BrowserHistory,
  ResourceStoreContext,
  ResourceStoreData,
  Routes,
} from '../../common/types';

export type UniversalRouterProps = {
  history?: BrowserHistory;
  isGlobal?: boolean;
  location?: string;
  resourceContext?: ResourceStoreContext;
  resourceData?: ResourceStoreData;
  routes: Routes;
  children: ReactNode;
};

export type RequestResourcesParams = {
  location: string;
  routes: Routes;
  resourceContext?: ResourceStoreContext;
};
