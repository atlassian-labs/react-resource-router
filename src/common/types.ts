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
  state?: unknown;
};

export type BrowserHistory = (
  | Omit<History4, 'location' | 'go' | 'createHref' | 'push' | 'replace'>
  | Omit<History5, 'location' | 'go' | 'createHref' | 'push' | 'replace'>
) & {
  location: Location;
  push: (path: string | Location, state?: unknown) => void;
  replace: (path: string | Location, state?: unknown) => void;
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
  component?: ComponentType<RouteContext>;
  EXPERIMENTAL__shouldReload?: ShouldReloadFunction;
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
  state?: unknown;
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

export interface Plugin {
  id: string;
  beforeRouteLoad?: (params: {
    context: RouterContext;
    nextContext: RouterContext;
  }) => void;
  routeLoad?: (params: {
    context: RouterContext;
    prevContext?: RouterContext;
  }) => void;
  routePrefetch?: (params: {
    context: RouterContext;
    nextContext: RouterContext;
  }) => void;
  [key: string]: any;
}

export type ShouldReloadFunction = (params: {
  context: RouterContext;
  prevContext: RouterContext;
  pluginId: string;
  defaultShouldReload: boolean;
}) => boolean;
