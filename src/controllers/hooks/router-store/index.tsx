import React from 'react';
import { createHook } from 'react-sweet-state';
import {
  useRouterStore,
  useRouterStoreStatic,
  RouterStore,
} from '../../router-store';
import {
  RouterActionsType,
  RouterState,
  EntireRouterState,
  AllRouterActions,
  HistoryUpdateType,
} from '../../router-store/types';

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

const createQueryParamHook = createHook<
  EntireRouterState,
  AllRouterActions,
  string,
  { paramKey: string }
>(RouterStore, {
  selector: ({ query }, { paramKey }): string => query[paramKey],
});

const createPathParamHook = createHook<
  EntireRouterState,
  AllRouterActions,
  string,
  { paramKey: string }
>(RouterStore, {
  selector: ({ match: { params } }, { paramKey }): string =>
    params[paramKey] as string,
});

/**
 * Utility hook for accessing URL query params
 */
export const useQueryParam = (
  paramKey: string
): [string | undefined, (qp: string | undefined) => void] => {
  const [paramVal, routerActions] = createQueryParamHook({ paramKey });

  const setQueryParam = React.useCallback(
    (newValue: string | undefined, updateType?: HistoryUpdateType) => {
      routerActions.updateQueryParam({ [paramKey]: newValue }, updateType);
    },
    [paramKey, routerActions]
  );

  return [paramVal, setQueryParam];
};

/**
 * Utility hook for accessing URL path params
 */
export const usePathParam = (
  paramKey: string
): [string | undefined, (pp: string | undefined) => void] => {
  const [paramVal, routerActions] = createPathParamHook({ paramKey });

  const setPathParam = React.useCallback(
    (newValue: string | undefined, updateType?: HistoryUpdateType) => {
      routerActions.updatePathParam({ [paramKey]: newValue }, updateType);
    },
    [paramKey, routerActions]
  );

  return [paramVal, setPathParam];
};
