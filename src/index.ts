export { createBrowserHistory, createMemoryHistory } from 'history';

export {
  Router,
  MemoryRouter,
  RouterSubscriber,
  RouteResourceEnabledSubscriber,
  Redirect,
  RouterActions,
  withRouter,
  ResourceSubscriber,
  useResource,
  useRouter,
  useQueryParam,
  usePathParam,
  useResourceStoreContext,
  createResource,
  useRouterActions,
  createRouterSelector,
} from './controllers';

export type { WithRouter } from './controllers';

export { RouteComponent, Link } from './ui';

export {
  matchRoute,
  generatePath,
  createLegacyHistory,
  createRouterContext,
  findRouterContext,
} from './common/utils';

export type {
  BrowserHistory,
  CreateRouterContextOptions,
  FindRouterContextOptions,
  GenerateLocationOptions,
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
