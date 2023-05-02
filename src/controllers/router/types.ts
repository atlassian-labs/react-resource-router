import { PropsWithChildren } from 'react';

import {
  History,
  Plugin,
  Route,
  RouterContext,
  Routes,
} from '../../common/types';
import type { ResourceStoreContext, ResourceStoreData } from '../../resources';
export type RouterProps = PropsWithChildren<{
  basePath?: string;
  history: History;
  initialRoute?: Route;
  isGlobal?: boolean;
  onPrefetch?: (routerContext: RouterContext) => void;
  resourceContext?: ResourceStoreContext;
  resourceData?: ResourceStoreData;
  routes: Routes;
  plugins?: Plugin[];
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
