import { PropsWithChildren } from 'react';

import {
  History,
  Plugin,
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
  routes: Routes;
  plugins?: Plugin[];
}>;

export type MemoryRouterProps = PropsWithChildren<{
  basePath?: string;
  location?: string;
  routes: Routes;
  plugins?: Plugin[];
}>;
