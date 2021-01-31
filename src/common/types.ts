/* eslint-disable no-use-before-define */

import { ComponentType, ReactNode, MouseEvent, KeyboardEvent } from 'react';

import { History, Location as HistoryLocationShape } from 'history';

export type LocationShape = HistoryLocationShape;

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

export type RouteResourceError = Record<string, any> | Error;

export type RouteResourceDataPayload = Record<string, any>;

export type RouteResourcePromise<T> = Promise<T> | null;

export type RouteResourceUpdater<RouteResourceData = unknown> = (
  data: RouteResourceData
) => RouteResourceData;

export type RouteResourceResponseBase<RouteResourceData> = {
  loading?: RouteResourceLoading;
  error?: RouteResourceError | null;
  data?: RouteResourceData;
  key?: string;
  promise?: RouteResourcePromise<RouteResourceData>;
  expiresAt: RouteResourceTimestamp;
};

export type RouteResourceResponseLoading<RouteResourceData> = {
  loading: true;
};

export type RouteResourceResponseError<RouteResourceData> = {
  loading: false;
  error: RouteResourceError;
};

export type RouteResourceResponseLoaded<RouteResourceData> = {
  loading: false;
  error: null;
  data: RouteResourceData;
};

export type RouteResourceResponse<
  RouteResourceData = unknown
> = RouteResourceResponseBase<RouteResourceData> &
  (
    | RouteResourceResponseLoading<RouteResourceData>
    | RouteResourceResponseError<RouteResourceData>
    | RouteResourceResponseLoaded<RouteResourceData>
  );

export type RouterDataContext = RouterContext & ResourceFetchContext;

export type RouteResourceGettersArgs = [
  RouterDataContext,
  ResourceStoreContext
];

export type RouteResource<RouteResourceData = unknown> = {
  type: string;
  getKey: (
    routerContext: RouterContext,
    customContext: ResourceStoreContext
  ) => string;
  maxAge: number;
  getData: (
    routerContext: RouterDataContext,
    customContext: ResourceStoreContext
  ) => RouteResourcePromise<RouteResourceData>;
};

export type RouteResources = RouteResource[];

export type ResourceStoreContext = any;

export type RouteResourceDataForType = {
  [index: string]: RouteResourceResponseBase<unknown>;
};

export type ResourceStoreData = {
  [index: string]: RouteResourceDataForType;
};

export type RouterContext = {
  route: Route;
  match: Match;
  query: Query;
};

export type ResourceFetchContext = {
  isPrefetch: boolean;
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
  to?: string | Route | Promise<{ default: Route } | Route>;
  replace?: boolean;
  type?: 'a' | 'button';
  onClick?: (e: MouseEvent | KeyboardEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  params?: MatchParams;
  query?: Query;
  prefetch?: false | 'hover' | 'mount';
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
  basePath?: string;
  isStatic?: boolean;
  location?: string;
  routes: Routes;
  children: ReactNode;
  resourceData?: ResourceStoreData;
  resourceContext?: ResourceStoreContext;
};

export type GenerateLocationOptions = {
  params?: MatchParams;
  query?: Query;
  basePath?: string;
};

export type CreateRouterContextOptions = {
  params?: MatchParams;
  query?: Query;
  basePath?: string;
};

export type FindRouterContextOptions = {
  location: Location;
  basePath?: string;
};
