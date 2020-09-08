export { createBrowserHistory, createMemoryHistory } from 'history';

export {
  Router,
  MemoryRouter,
  StaticRouter,
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
} from './controllers';

export { RouteComponent, Link, noopRouterDecorator } from './ui';

export {
  matchRoute,
  generatePath,
  createLegacyHistory,
  createRouterContext,
  findRouterContext,
} from './common/utils';

export {
  Location,
  Route,
  Routes,
  Match,
  MatchedRoute,
  RouteResource,
  RouteContext,
  RouterContext,
  ResourceStoreData,
  HistoryBlocker,
  Navigation,
  NavigationType,
  NavigationRenderUpdater,
  NavigationStatics,
  LinkProps,
  BrowserHistory,
  LocationShape,
} from './common/types';

export {
  RouterActionsType,
  RouterActionPush,
  RouterActionReplace,
  RouterSubscriberProps,
} from './controllers/router-store/types';
