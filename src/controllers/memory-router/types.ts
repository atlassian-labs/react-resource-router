import { ReactNode } from 'react';

import {
  ResourceStoreContext,
  ResourceStoreData,
  Routes,
} from '../../common/types';

export type MemoryRouterProps = {
  isStatic?: boolean;
  location?: string;
  routes: Routes;
  children: ReactNode;
  resourceData?: ResourceStoreData;
  resourceContext?: ResourceStoreContext;
};
