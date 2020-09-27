import { ReactNode } from 'react';

import {
  BrowserHistory,
  ResourceStoreContext,
  ResourceStoreData,
  Routes,
} from '../../common/types';

export type RouterProps = {
  isStatic: boolean;
  history: BrowserHistory;
  resourceContext?: ResourceStoreContext;
  resourceData?: ResourceStoreData;
  basePath?: string;
  routes: Routes;
  children: ReactNode;
};
