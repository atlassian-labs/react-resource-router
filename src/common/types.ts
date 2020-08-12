/* eslint-disable no-use-before-define */

import { ComponentType, ReactNode } from 'react';

import { History, Location as LocationShape } from 'history';

export { LocationShape };

export type Href = string;

export type Location = {
  pathname: string;
  search: string;
  hash: string;
};

export type BrowserHistory = Omit<
  History,
  'location' | 'go' | 'createHref' | 'push' | 'replace'
> & {
  location: Location;
  push: (path: string) => void;
  replace: (path: string) => void;
};

export type MatchParams = {
  [key: string]: string | null | typeof undefined;
};

export type Match = {
  /** TODO we are supporting `undefined` here because we are currently using both
   * this version of the `Match` type, and react-routers version (which allows for `undefined`)
   * To fix this we should move `matchPath` to our own util so we can apply our own types, then
   * decide if we want to support undefined types.
   */
  params: MatchParams;
  query: Query;
  isExact: boolean;
  path: string;
  url: string;
};

export type Query = {
  [key: string]: string;
};

export type MatchedInvariantRoute = {
  route: InvariantRoute;
  match: Match;
};

export type MatchedRoute = {
  route: Route;
  match: Match;
};

export type RouteContext = {
  location: Location;
  query: Query;
  route: Route;
  match: Match;
  action: HistoryAction;
};

export type RouteResourceLoading = boolean;

export type RouteResourceTimestamp = number | null;

export type RouteResourceError = Record<string, any> | Error | null;

export type RouteResourceData = Record<string, any> | null;

export type RouteResourcePromise = Promise<any> | null;

export type RouteResourceUpdater = (
  data: RouteResourceData
) => RouteResourceData;

export type RouteResourceResponse = {
  loading: RouteResourceLoading;
  error: RouteResourceError;
  data: RouteResourceData;
  promise: RouteResourcePromise;
  expiresAt: RouteResourceTimestamp;
};

export type RouteResourceGettersArgs = [RouterContext, ResourceStoreContext];

export type RouteResource = {
  type: string;
  getKey: (...args: RouteResourceGettersArgs) => string;
  maxAge: number;
  getData: (...args: RouteResourceGettersArgs) => RouteResourcePromise;
};

export type RouteResources = RouteResource[];

export type ResourceStoreContext = Record<string, any>;

export type RouteResourceDataForType = {
  [index: string]: RouteResourceResponse;
};

export type ResourceStoreData = {
  [index: string]: RouteResourceDataForType;
};

export type RouterContext = {
  route: Route;
  match: Match;
  query: Query;
};

/**
 * Invariant route
 *
 * Base type for route, which doesn't contain implementation details
 */
export type InvariantRoute = {
  path: string;
  exact?: boolean;

  /** Used to prevent transitions between app groups */
  group?: string;

  /** Unique name for the route */
  name: string;

  /**
   * Query string matching. Each query param must match for the route to match.
   *
   * A query param can take the following shapes:
   *  * query name only: 'foo' - matches if query name 'foo' is present
   *  * query name matching value: 'foo=bar' - matches if query name 'foo' equals
   *    'bar' exactly
   *  * query name matching regex: 'foo=(bar.+) - matches if query name 'foo' equals
   *    regex '^(bar.+)$'. Note you must escape backslashes and wrap regex in parentheses.
   *  * query name NOT matching value: 'foo!=bar' - matches if query name 'foo' does
   *    not equal bar OR if query name 'foo' does not exist at all
   */
  query?: string[];
};

export type Route = InvariantRoute & {
  /** The component to render on match, typed explicitly */
  component: ComponentType<RouteContext>;

  /** If present, must return true to include the route. */
  enabled?: () => boolean;

  /**
   * Triggered before leaving the route, can trigger full page reload if returns (or resolves) false.
   * Defaults to true.
   */
  canTransitionOut?: (
    currentRouteMatch: MatchedRoute,
    nextRouteMatch: MatchedRoute,
    props: any
  ) => boolean | Promise<boolean>;

  /**
   * Triggered before entering the route, can trigger full page reload if returns (or resolves) false.
   * Defaults to true.
   */
  canTransitionIn?: (
    currentRouteMatch: MatchedRoute,
    nextRouteMatch: MatchedRoute,
    props: any
  ) => boolean | Promise<boolean>;

  /**
   * The resources for the route
   */
  resources?: RouteResources;
};

export type HistoryAction = 'PUSH' | 'REPLACE' | 'POP' | '';

export type InvariantRoutes = InvariantRoute[];
export type Routes = Route[];

export type NavigationType = 'container' | 'product';

export type NavigationRenderUpdater = (
  location: Location,
  match: Match,
  route: Route
) => ReactNode;

export type NavigationStatics = {
  type: NavigationType;
  view: (...args: any[]) => string;
};

export type Navigation = NavigationStatics & {
  renderNavigationUpdater: NavigationRenderUpdater;
};

export type LinkElementType = 'a' | 'button';

export type LinkProps = {
  children: ReactNode;
  target?: '_blank' | '_self' | '_parent' | '_top';
  href?: string;
  to?: string;
  replace?: boolean;
  type?: 'a' | 'button';
  onClick?: (e: any) => void;
};

export type HistoryBlocker = (
  location: Location,
  action: string
) => boolean | Promise<boolean>;

export type HistoryLocation = {
  pathname: string;
  search: string;
  hash: string;
  state: {
    [key: string]: any;
  };
  key: string;
};

export type HistoryListen = (
  arg0: (arg0: HistoryLocation, arg1: HistoryAction) => void
) => () => void;

export type HistoryActions = {
  push: (path: Href | LocationShape) => void;
  replace: (path: Href | LocationShape) => void;
  goBack: () => void;
  goForward: () => void;
  registerBlock: (blocker: HistoryBlocker) => () => void;
  listen: HistoryListen;
};

export type MemoryRouterProps = {
  isStatic?: boolean;
  location?: string;
  routes: Routes;
  children: ReactNode;
  resourceData?: ResourceStoreData;
  resourceContext?: ResourceStoreContext;
};
