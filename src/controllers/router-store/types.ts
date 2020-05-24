import { ReactNode } from 'react';

import { ActionAny as Action } from 'react-sweet-state';

import {
  BrowserHistory,
  HistoryAction,
  HistoryBlocker,
  Href,
  Location,
  Match,
  Query,
  ResourceStoreContext,
  ResourceStoreData,
  Route,
  Routes,
} from '../../common/types';

type PublicStateProperties = {
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
  shouldUseSuspense: boolean;
};

export type EntireRouterState = PublicStateProperties & PrivateStateProperties;

export type ContainerProps = {
  isStatic?: boolean;
  history: BrowserHistory;
  location?: Location;
  routes: Routes;
  resourceData?: ResourceStoreData;
  resourceContext?: ResourceStoreContext;
};

export type RouterAction = Action<EntireRouterState, AllRouterActions>;

type PrivateRouterActions = {
  bootstrapStore: (initialState: ContainerProps) => RouterAction;
  requestRouteResources: () => RouterAction;
  listen: () => RouterAction;
};

type PublicRouterActions = {
  push: (path: Href | Location, state?: any) => RouterAction;
  replace: (path: Href | Location) => RouterAction;
  goBack: () => RouterAction;
  goForward: () => RouterAction;
  registerBlock: (blocker: HistoryBlocker | any) => RouterAction;
};

export type AllRouterActions = PrivateRouterActions & PublicRouterActions;

/**
 * Public API
 */
export type RouterState = PublicStateProperties;
export type RouterActionsType = PublicRouterActions;
export type RouterActionPush = RouterActionsType['push'];
export type RouterActionReplace = RouterActionsType['replace'];
export type RouterSubscriberProps = {
  children: (state: RouterState, actions: RouterActionsType) => ReactNode;
};
