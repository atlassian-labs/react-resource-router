import { PropsWithChildren } from 'react';

import {
  BrowserHistory,
  ResourceStoreContext,
  ResourceStoreData,
  Route,
  RouterContext,
  Routes,
} from '../../common/types';

export type RouterProps = PropsWithChildren<{
  basePath?: string;
  history?: BrowserHistory;
  initialRoute?: Route;
  isGlobal?: boolean;
  location?: string;
  onPrefetch?: (routerContext: RouterContext) => void;
  resourceContext?: ResourceStoreContext;
  resourceData?: ResourceStoreData;
  routes: Routes;
}>;

export type MemoryRouterProps = PropsWithChildren<{
  basePath?: string;
  location?: string;
  routes: Routes;
}>;

export type RequestResourcesParams = {
  history?: BrowserHistory;
  location: string;
  resourceContext?: ResourceStoreContext;
  routes: Routes;
  timeout?: number;
};
