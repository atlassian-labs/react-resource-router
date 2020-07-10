import { useRouterStore, useRouterStoreStatic } from '../../router-store';
import { RouterActionsType, RouterState } from '../../router-store/types';
import {
  BrowserHistory,
  MatchParams,
  Match,
  Route,
  Location,
} from '../../../common/types';
import matchPath from '../../../common/utils/match-route/matchPath';

/**
 * Utility hook for accessing the public router store
 */
export const useRouter = (): [RouterState, RouterActionsType] => {
  const [entireState, allActions] = useRouterStore();

  return [entireState, allActions];
};

/**
 * Hook for accessing the public router store without re-rendering on route change
 */
export const useRouterActions = (): RouterActionsType => {
  const [, allActions] = useRouterStoreStatic();

  return allActions;
};

export const useLocation = (): Location => {
  const [routerState] = useRouterStore();

  return routerState.location;
};

export const useHistory = (): BrowserHistory => {
  const [routerState] = useRouterStore();

  return routerState.history;
};

export const useParams = (): MatchParams => {
  const [routerState] = useRouterStore();

  return routerState.match.params;
};

export const useRouteMatch = (route?: string | Route): Match => {
  const [routerState] = useRouterStore();

  return route
    ? matchPath(
        routerState.location.pathname,
        typeof route === 'string' ? { path: route } : route
      )
    : routerState.match;
};
