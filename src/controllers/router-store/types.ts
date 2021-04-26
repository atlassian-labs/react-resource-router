import { ReactNode } from 'react';

import { Action, BoundActions } from 'react-sweet-state';

import {
  BrowserHistory,
  HistoryAction,
  HistoryBlocker,
  Href,
  Location,
  Match,
  MatchParams,
  Query,
  ResourceStoreContext,
  ResourceStoreData,
  Route,
  RouterContext,
  Routes,
} from '../../common/types';
import { MemoryHistory, UnregisterCallback } from 'history';

type PublicStateProperties = {
  basePath: string;
  location: Location;
  query: Query;
  route: Route;
  match: Match;
  action: HistoryAction;
};

export type UnlistenHistory = () => void;

type PrivateStateProperties = {
  routes: Routes;
  history: BrowserHistory;
  unlisten: UnlistenHistory | null;
  isStatic: boolean;
  onPrefetch?: (routerContext: RouterContext) => void;
};

export type EntireRouterState = PublicStateProperties & PrivateStateProperties;

export type ContainerProps = {
  isStatic?: boolean;
  history: BrowserHistory | MemoryHistory;
  initialRoute?: Route;
  location?: Location;
  basePath?: string;
  routes: Routes;
  resourceData?: ResourceStoreData;
  resourceContext?: ResourceStoreContext;
  onPrefetch?: (routerContext: RouterContext) => void;
};

export type UniversalRouterContainerProps = { isGlobal?: boolean } & Omit<
  ContainerProps,
  'isStatic'
>;

export type RouterAction = Action<EntireRouterState, AllRouterActions>;

export type HistoryUpdateType = 'push' | 'replace';

type ToAttributes = {
  params?: MatchParams;
  query?: Query;
};

type RequestRouteResourcesOptions = {
  maxWaitTime?: number;
};

type PrivateRouterActions = {
  bootstrapStore: (initialState: ContainerProps) => RouterAction;
  bootstrapStoreUniversal: (
    initialState: UniversalRouterContainerProps
  ) => RouterAction;
  requestRouteResources: (
    options?: RequestRouteResourcesOptions
  ) => Action<EntireRouterState, AllRouterActions, Promise<unknown[]>>;
  prefetchNextRouteResources: (
    path: Href,
    nextContext: RouterContext | null
  ) => RouterAction;
  listen: () => RouterAction;
  getContext: () => Action<
    EntireRouterState,
    AllRouterActions,
    { query: Query; route: Route; match: Match }
  >;
  updateQueryParam: (
    params: {
      [key: string]: string | undefined;
    },
    updateType?: HistoryUpdateType
  ) => RouterAction;
  updatePathParam: (
    params: {
      [key: string]: string | undefined;
    },
    updateType?: HistoryUpdateType
  ) => RouterAction;
};

type PublicRouterActions = {
  push: (path: Href, state?: any) => RouterAction;
  pushTo: (route: Route, attributes?: ToAttributes) => RouterAction;
  replace: (path: Href) => RouterAction;
  replaceTo: (route: Route, attributes?: ToAttributes) => RouterAction;
  goBack: () => RouterAction;
  goForward: () => RouterAction;
  registerBlock: (
    blocker: HistoryBlocker | any
  ) => Action<EntireRouterState, AllRouterActions, UnregisterCallback>;
  getBasePath: () => Action<EntireRouterState, AllRouterActions, string>;
};

export type AllRouterActions = PrivateRouterActions & PublicRouterActions;

/**
 * Public API
 */
export type RouterState = PublicStateProperties;
export type RouterActionsType = BoundActions<
  EntireRouterState,
  PublicRouterActions
>;
export type RouterActionPush = RouterActionsType['push'];
export type RouterActionReplace = RouterActionsType['replace'];
export type RouterSubscriberProps = {
  children: (state: RouterState, actions: RouterActionsType) => ReactNode;
};
