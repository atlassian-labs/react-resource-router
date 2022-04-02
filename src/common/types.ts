import { History as History4, Location as HistoryLocationShape } from 'history';
import { History as History5 } from 'history-5';
import {
  ComponentType,
  ReactNode,
  MouseEvent,
  KeyboardEvent,
  AnchorHTMLAttributes,
} from 'react';

export type LocationShape = HistoryLocationShape;

export type Href = string;

export type Location = {
  pathname: string;
  search: string;
  hash: string;
};

export type BrowserHistory = (
  | Omit<History4, 'location' | 'go' | 'createHref' | 'push' | 'replace'>
  | Omit<History5, 'location' | 'go' | 'createHref' | 'push' | 'replace'>
) & {
  location: Location;
  push: (path: string | Location) => void;
  replace: (path: string | Location) => void;
};

export type History = BrowserHistory;

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

export type RouteResourceUpdater<RouteResourceData = unknown> = (
  data: RouteResourceData
) => RouteResourceData;

export type EmptyObject = {
  [K in any]: never;
};

export type RouteResourceSyncResult<RouteResourceData> =
  | {
      data: RouteResourceData;
      error: null;
      loading: true;
      // promise: existing value retained
    }
  | {
      data: RouteResourceData;
      error: null;
      loading: false;
      promise: Promise<RouteResourceData>;
    };

export type RouteResourceAsyncResult<RouteResourceData> =
  | {
      data: RouteResourceData;
      error: null;
      loading: false;
      promise: Promise<RouteResourceData>;
    }
  | {
      // data: existing value retained
      error: RouteResourceError;
      loading: false;
      promise: Promise<RouteResourceData>;
    }
  | {
      // data: existing value retained
      error: RouteResourceError;
      loading: true;
      promise: null;
    };

type RouteResourceResponseBase<RouteResourceData> = {
  key?: string;
  loading: RouteResourceLoading;
  error: RouteResourceError | null;
  data: RouteResourceData | null;
  promise: Promise<RouteResourceData> | null;
  expiresAt: RouteResourceTimestamp;
  accessedAt: RouteResourceTimestamp;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RouteResourceResponseInitial<RouteResourceData> = {
  loading: false;
  error: null;
  data: null;
  promise: null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RouteResourceResponseLoading<RouteResourceData> = {
  loading: true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RouteResourceResponseError<RouteResourceData> = {
  loading: false;
  error: RouteResourceError;
};

export type RouteResourceResponseLoaded<RouteResourceData> = {
  loading: false;
  error: null;
  data: RouteResourceData;
};

export type RouteResourceResponse<RouteResourceData = unknown> =
  RouteResourceResponseBase<RouteResourceData> &
    (
      | RouteResourceResponseInitial<RouteResourceData>
      | RouteResourceResponseLoading<RouteResourceData>
      | RouteResourceResponseError<RouteResourceData>
      | RouteResourceResponseLoaded<RouteResourceData>
    );

export type RouterDataContext = RouterContext & {
  isPrefetch: boolean;
  dependencies: ResourceDependencies;
};

export type UseResourceHookResponse<RouteResourceData> =
  RouteResourceResponse<RouteResourceData> & {
    update: (getNewData: RouteResourceUpdater<RouteResourceData>) => void;
    refresh: () => void;
    clear: () => void;
    clearAll: () => void;
  };

export type ResourceType = string;
export type ResourceKey = string;

export type RouteResource<T extends unknown = unknown> = {
  type: ResourceType;
  getKey: (
    routerContext: RouterContext,
    customContext: ResourceStoreContext
  ) => ResourceKey;
  maxAge: number;
  getData: (
    routerContext: RouterDataContext,
    customContext: ResourceStoreContext
  ) => T | Promise<T>;
  maxCache: number;
  isBrowserOnly: boolean;
  depends: ResourceType[] | null;
};

export type RouteResources = RouteResource[];

export interface ResourceStoreContext {}

export type RouteResourceDataForType = Record<
  string,
  RouteResourceResponse<unknown>
>;

export type ResourceStoreData = Record<string, RouteResourceDataForType>;

export type RouterContext = {
  route: Route;
  match: Match;
  query: Query;
};

export type ResourceDependencies = {
  [type: string]: RouteResourceResponse | undefined;
};

/**
 * Invariant route
 *
 * Base type for route, which doesn't contain implementation details
 */
export type InvariantRoute = {
  path: string;
  exact?: boolean;

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

/**
 * Custom additional attributes that may be present in each route definition.
 */
export interface AdditionalRouteAttributes {}

export type Route = InvariantRoute & {
  /** The component to render on match, typed explicitly */
  component: ComponentType<RouteContext>;

  /**
   * The resources for the route
   */
  resources?: RouteResources;
} & AdditionalRouteAttributes;

export type HistoryAction = 'PUSH' | 'REPLACE' | 'POP' | '';

export type InvariantRoutes = InvariantRoute[];
export type Routes = Route[];

export type LinkElementType = 'a' | 'button';

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  target?: '_blank' | '_self' | '_parent' | '_top';
  href?: string;
  to?: string | Route | Promise<{ default: Route } | Route>;
  replace?: boolean;
  type?: 'a' | 'button';
  onClick?: (e: MouseEvent | KeyboardEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onPointerDown?: (e: PointerEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
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
  arg0: (location: HistoryLocation, action: HistoryAction) => void
) => () => void;

export type HistoryActions = {
  push: (path: Href | LocationShape) => void;
  replace: (path: Href | LocationShape) => void;
  goBack: () => void;
  goForward: () => void;
  registerBlock: (blocker: HistoryBlocker) => () => void;
  listen: HistoryListen;
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
