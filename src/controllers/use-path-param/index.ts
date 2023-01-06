import { useCallback } from 'react';
import { createHook } from 'react-sweet-state';

import { RouterStore } from '../router-store';
import {
  EntireRouterState,
  AllRouterActions,
  HistoryUpdateType,
} from '../router-store/types';

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
 * Utility hook for accessing URL path params
 */
export const usePathParam = (
  paramKey: string
): [
  string | undefined,
  (newValue: string | undefined, updateType?: HistoryUpdateType) => void
] => {
  const [paramVal, routerActions] = createPathParamHook({ paramKey });

  const setPathParam = useCallback(
    (newValue: string | undefined, updateType?: HistoryUpdateType) => {
      routerActions.updatePathParam({ [paramKey]: newValue }, updateType);
    },
    [paramKey, routerActions]
  );

  return [paramVal, setPathParam];
};
