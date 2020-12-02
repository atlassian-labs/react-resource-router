import { ReactNode } from 'react';

import {
  BrowserHistory,
  ResourceStoreContext,
  ResourceStoreData,
  Route,
  Routes,
} from '../../common/types';

export type RouterProps = {
  isStatic: boolean;
  history: BrowserHistory;
  initialRoute?: Route;
  resourceContext?: ResourceStoreContext;
  resourceData?: ResourceStoreData;
  basePath?: string;
  routes: Routes;
  children: ReactNode;
};
