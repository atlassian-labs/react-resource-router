import { MemoryHistory, UnregisterCallback } from 'history';
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
  Route,
  RouterContext,
  Routes,
  Plugin,
} from '../../common/types';

type PublicStateProperties = {
  action: HistoryAction;
  basePath: string;
  location: Location;
  match: Match;
  query: Query;
  route: Route;
};

export type UnlistenHistory = () => void;

type PrivateStateProperties = {
  history: BrowserHistory;
  onPrefetch?: (routerContext: RouterContext) => void;
  routes: Routes;
  unlisten: UnlistenHistory | null;
  plugins: Plugin[];
};

export type EntireRouterState = PublicStateProperties & PrivateStateProperties;

export type ContainerProps = {
  basePath?: string;
  history: BrowserHistory | MemoryHistory;
  initialRoute?: Route;
  isGlobal?: boolean;
  onPrefetch?: (routerContext: RouterContext) => void;
  routes: Routes;
  plugins: Plugin[];
};

export type RouterAction = Action<EntireRouterState, AllRouterActions>;

export type HistoryUpdateType = 'push' | 'replace';

type ToAttributes = {
  query?: Query;
  params?: MatchParams;
  state?: unknown;
};

type PrivateRouterActions = {
  bootstrapStore: (initialState: ContainerProps) => RouterAction;
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
  loadPlugins: () => RouterAction;
  prefetchRoute: (
    path: Href,
    nextContext: RouterContext | null
  ) => RouterAction;
};

type PublicRouterActions = {
  push: (path: Href | Location, state?: unknown) => RouterAction;
  pushTo: (route: Route, attributes?: ToAttributes) => RouterAction;
  replace: (path: Href | Location, state?: unknown) => RouterAction;
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
