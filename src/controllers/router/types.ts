import { PropsWithChildren } from 'react';

import {
  BrowserHistory,
  ResourceStoreContext,
  ResourceStoreData,
  Route,
  RouterContext,
  Routes,
  Loader,
} from '../../common/types';

export type RouterProps = PropsWithChildren<{
  isStatic: boolean;
  history: BrowserHistory;
  initialRoute?: Route;
  resourceContext?: ResourceStoreContext;
  resourceData?: ResourceStoreData;
  basePath?: string;
  routes: Routes;
  isGlobal?: boolean;
  onPrefetch?: (routerContext: RouterContext) => void;
  loader?: Loader;
}>;
