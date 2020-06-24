import { ReactNode } from 'react';

import {
  BrowserHistory,
  ResourceStoreContext,
  ResourceStoreData,
  Routes,
} from '../../common/types';

export type UniversalRouterProps = {
  history?: BrowserHistory;
  isStatic?: boolean;
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
