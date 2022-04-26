import { useCallback, useMemo } from 'react';

import {
  RouteResource,
  RouteResourceResponse,
  RouteResourceUpdater,
  RouterContext,
  UseResourceHookResponse,
} from '../../../common/types';
import { useResourceActions, useResourceStore } from '../../resource-store';
import { useRouterStoreStatic, RouterStore } from '../../router-store';
import { EntireRouterState, AllRouterActions } from '../../router-store/types';
import { createHook } from 'react-sweet-state';

type UseResourceOptions = {
  routerContext?: RouterContext;
};

export const useResource = <RouteResourceData extends unknown>(
  resource: RouteResource<RouteResourceData>,
  options?: UseResourceOptions
): UseResourceHookResponse<RouteResourceData> => {
  const [, actions] = useResourceActions();
  const [, { getContext: getRouterContext }] = useRouterStoreStatic();

  // Dynamically generate a router subscriber based on the resource:
  // makes the component re-render only when key changes instead of
  // after every route change
  const useKey = useMemo(
    () =>
      createHook<
        EntireRouterState,
        AllRouterActions,
        string,
        RouterContext | void
      >(RouterStore, {
        selector: ({ match, query, route }, keyArg): string =>
          resource.getKey(
            keyArg != null ? keyArg : { match, query, route },
            actions.getContext()
          ),
      }),
    [resource, actions]
  );

  const key = useKey(options?.routerContext!)[0];
  const [slice] = useResourceStore({
    type: resource.type,
    key,
  }) as RouteResourceResponse<RouteResourceData>[];

  // we keep route context bound to key, so route context won't refresh
  // unless key changes. This allows refresh to be called on effect cleanup
  // or asynchronously, when route context might already have changed
  const routerContext = useMemo(
    () => options?.routerContext! || getRouterContext(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  const update = useCallback(
    (updater: RouteResourceUpdater<RouteResourceData>) => {
      actions.updateResourceState(
        resource as RouteResource<unknown>,
        routerContext,
        updater as RouteResourceUpdater<unknown>
      );
    },
    [resource, routerContext, actions]
  );

  const clear = useCallback(() => {
    actions.clearResource(resource, routerContext);
  }, [resource, routerContext, actions]);

  const clearAll = useCallback(() => {
    actions.clearResource(resource);
  }, [resource, actions]);

  const refresh = useCallback(() => {
    actions.getResourceFromRemote(
      resource as RouteResource<unknown>,
      routerContext,
      { prefetch: false }
    );
  }, [resource, routerContext, actions]);

  return { ...slice, update, key, refresh, clear, clearAll };
};
