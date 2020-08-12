export {
  Router,
  MemoryRouter,
  StaticRouter,
  RouterSubscriber,
  RouteResourceEnabledSubscriber,
  Redirect,
  RouterActions,
  withRouter,
  WithRouterProps,
  ResourceSubscriber,
  useResource,
  useRouter,
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

export type {
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
} from './common/types';

export type {
  RouterActionsType,
  RouterActionPush,
  RouterActionReplace,
  RouterSubscriberProps,
} from './controllers/router-store/types';

export { createBrowserHistory, createMemoryHistory } from 'history';
