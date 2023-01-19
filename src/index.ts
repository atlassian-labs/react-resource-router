export { createBrowserHistory, createMemoryHistory } from 'history';

export {
  createResource,
  createRouterSelector,
  MemoryRouter,
  Redirect,
  ResourceDependencyError,
  ResourceSubscriber,
  RouteResourceEnabledSubscriber,
  Router,
  RouterActions,
  RouterSubscriber,
  usePathParam,
  useQueryParam,
  useResource,
  useResourceStoreContext,
  useRouter,
  useRouterActions,
  withRouter,
} from './controllers';

export type {
  CreateResourceArgBase,
  CreateResourceArgSync,
  CreateResourceArgAsync,
} from './controllers';

export { RouteComponent, Link } from './ui';

export {
  createLegacyHistory,
  createRouterContext,
  findRouterContext,
  generatePath,
  matchRoute,
} from './common/utils';

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
} from './common/types';

export type {
  RouterActionsType,
  RouterActionPush,
  RouterActionReplace,
  RouterSubscriberProps,
} from './controllers/router-store/types';
