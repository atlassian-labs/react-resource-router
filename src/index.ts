export { createBrowserHistory, createMemoryHistory } from 'history';

export {
  createRouterSelector,
  MemoryRouter,
  Redirect,
  RouteResourceEnabledSubscriber,
  Router,
  RouterActions,
  RouterSubscriber,
  usePathParam,
  useQueryParam,
  useRouter,
  useRouterActions,
  withRouter,
} from './controllers';

export { RouteComponent, Link } from './ui';

export {
  createLegacyHistory,
  createRouterContext,
  findRouterContext,
  generatePath,
  matchRoute,
} from './common/utils';

export { invokePluginLoad } from './controllers/plugins';

export type {
  AdditionalRouteAttributes,
  BrowserHistory,
  CreateRouterContextOptions,
  FindRouterContextOptions,
  GenerateLocationOptions,
  History,
  HistoryAction,
  HistoryActions,
  HistoryBlocker,
  HistoryListen,
  LinkProps,
  Location,
  LocationShape,
  Match,
  MatchParams,
  MatchedInvariantRoute,
  MatchedRoute,
  Query,
  ResourceStoreContext,
  ResourceStoreData,
  Route,
  Routes,
  RouteContext,
  RouteResource,
  RouteResourceError,
  RouteResourceLoading,
  RouteResourceResponse,
  RouteResourceUpdater,
  RouterContext,
  RouterDataContext,
  UseResourceHookResponse,
  Plugin,
} from './common/types';

export type {
  RouterActionsType,
  RouterActionPush,
  RouterActionReplace,
  RouterSubscriberProps,
} from './controllers/router-store/types';

// extra exports for resources only
export {
  RouterStore,
  useRouterStoreActions,
  getRouterState,
} from './controllers/router-store';
export type {
  EntireRouterState,
  AllRouterActions,
} from './controllers/router-store/types';

export { DEFAULT_MATCH, DEFAULT_ROUTE } from './common/constants';

// resources plugin re-exports (deprecated)
export {
  createResource,
  ResourceDependencyError,
  ResourceSubscriber,
  useResource,
  useResourceStoreContext,
} from './resources';

export type {
  CreateResourceArgBase,
  CreateResourceArgSync,
  CreateResourceArgAsync,
} from './resources';
