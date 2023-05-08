import { useCallback } from 'react';
import { createHook } from 'react-sweet-state';

import { RouterStore } from '../router-store';
import {
  EntireRouterState,
  AllRouterActions,
  HistoryUpdateType,
} from '../router-store/types';

const createQueryParamHook = createHook<
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
): [
  string | undefined,
  (
    newValue: string | undefined,
    updateType?: HistoryUpdateType,
    options?: { avoidRoutePluginsLoad?: boolean }
  ) => void
] => {
  const [paramVal, routerActions] = createQueryParamHook({ paramKey });

  const setQueryParam = useCallback(
    (
      newValue: string | undefined,
      updateType?: HistoryUpdateType,
      options?: { avoidRoutePluginsLoad?: boolean }
    ) => {
      routerActions.updateQueryParam(
        { [paramKey]: newValue },
        updateType,
        options
      );
    },
    [paramKey, routerActions]
  );

  return [paramVal, setQueryParam];
};
