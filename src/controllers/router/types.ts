import { PropsWithChildren } from 'react';

import {
  History,
  ResourceStoreContext,
  ResourceStoreData,
  Route,
  RouterContext,
  Routes,
} from '../../common/types';

export type RouterProps = PropsWithChildren<{
  basePath?: string;
  history: History;
  initialRoute?: Route;
  isGlobal?: boolean;
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
  history?: History;
  location: string;
  resourceContext?: ResourceStoreContext;
  routes: Routes;
  timeout?: number;
};
