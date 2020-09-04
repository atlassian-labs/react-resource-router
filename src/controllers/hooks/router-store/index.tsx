import React from 'react';
import { qs } from 'url-parse';
import {
  useRouterStore,
  useRouterStoreStatic,
  RouterStore,
  getRouterState,
} from '../../router-store';
import {
  RouterActionsType,
  RouterState,
  EntireRouterState,
  AllRouterActions,
} from '../../router-store/types';
import { createHook } from 'react-sweet-state';

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

const useParam = createHook<
  EntireRouterState,
  AllRouterActions,
  string,
  { paramKey: string }
>(RouterStore, {
  selector: ({ query }, { paramKey }): string => query[paramKey],
});

/**
 * Utility hook for accessing URL query params
 */
export const useQueryParam = (
  paramKey: string
): [string | undefined, (qp: string | null) => void] => {
  const [paramVal, routerActions] = useParam({ paramKey });

  const setQueryParam = React.useCallback(
    (newValue: string | undefined | null) => {
      const {
        location: { pathname },
        query,
      } = getRouterState();
      const { [paramKey]: deletedKey, ...newQueryObj } = query;

      if (newValue) {
        newQueryObj[paramKey] = newValue;
      }

      const stringifiedQuery = qs.stringify(newQueryObj);
      routerActions.push(
        pathname + (stringifiedQuery !== '' ? `?${stringifiedQuery}` : '')
      );
    },
    [paramKey, routerActions]
  );

  return [paramVal, setQueryParam];
};
