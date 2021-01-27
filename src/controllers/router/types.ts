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
  isStatic: boolean;
  history: BrowserHistory;
  initialRoute?: Route;
  resourceContext?: ResourceStoreContext;
  resourceData?: ResourceStoreData;
  basePath?: string;
  routes: Routes;
  onPrefetch?: (routerContext: RouterContext) => void;
}>;
