import {
  createActionsHook,
  createContainer,
  createHook,
  createStore,
  createSubscriber,
  defaultRegistry,
} from 'react-sweet-state';

import { isServerEnvironment } from '../../../common/utils';
import type { RouterContext } from '../../../index';
import type {
  ResourceStoreContext,
  ResourceStoreData,
  RouteResource,
  EmptyObject,
  RouteResourceAsyncResult,
  RouteResourceResponse,
  RouteResourceUpdater,
  RouteResourceSyncResult,
} from '../../common/types';

import { getResourceStoreContext, getSliceForResource } from './selectors';
import {
  ContainerProps,
  GetResourceOptions,
  ResourceAction,
  ResourceSliceIdentifier,
  State,
} from './types';
import {
  deserializeError,
  getAccessedAt,
  getExpiresAt,
  isFromSsr,
  serializeError,
  setExpiresAt,
  shouldUseCache,
  transformData,
  TimeoutError,
  setSsrDataPromise,
  getResourceState,
  setResourceState,
  deleteResourceState,
  validateLRUCache,
  actionWithDependencies,
  mapActionWithDependencies,
  executeForDependents,
  getDependencies,
  getDefaultStateSlice,
  getPrefetchSlice,
  setPrefetchSlice,
  createLoadingSlice,
} from './utils';

export { createResource, ResourceDependencyError } from './utils';
export type {
  CreateResourceArgAsync,
  CreateResourceArgBase,
  CreateResourceArgSync,
} from './utils';

export const privateActions = {
  /**
   * Clears a resource for the current key, or where context is not provided all keys.
   */
  clearResource:
    (
      resource: RouteResource,
      routerStoreContext: RouterContext | null
    ): ResourceAction<void> =>
    ({ getState, dispatch }) => {
      const { type, getKey } = resource;
      const { context } = getState();

      if (routerStoreContext) {
        const key = getKey(routerStoreContext, context);
        dispatch(deleteResourceState(type, key));
        dispatch(
          executeForDependents(resource, dependentResource =>
            privateActions.clearResource(dependentResource, routerStoreContext)
          )
        );
      } else {
        dispatch(deleteResourceState(type));
      }
    },

  /**
   * Update the data property for a resource in the cache and reset expiresAt based
   * on maxAge.
   */
  updateResourceState:
    (
      resource: RouteResource,
      routerStoreContext: RouterContext,
      getNewSliceData: RouteResourceUpdater
    ): ResourceAction<void> =>
    ({ getState, dispatch }) => {
      const { type, getKey, maxAge } = resource;
      const { context, ...resourceStoreState } = getState();
      const key = getKey(routerStoreContext, context);
      const prevSlice = getSliceForResource(resourceStoreState, {
        type,
        key,
      });
      const data = getNewSliceData(prevSlice.data);
      const changes: RouteResourceSyncResult<unknown> = prevSlice.loading
        ? {
            data,
            error: null,
            loading: true,
            // promise: existing value retained
          }
        : {
            data,
            error: null,
            loading: false,
            promise: Promise.resolve(data),
          };

      const newSlice = {
        ...prevSlice,
        ...changes,
        expiresAt: getExpiresAt(maxAge),
        accessedAt: getAccessedAt(),
      };
      dispatch(setResourceState(type, key, newSlice));

      // trigger dependent resources on change
      if (newSlice.data !== prevSlice.data) {
        dispatch(
          executeForDependents(resource, dependentResource =>
            privateActions.getResourceFromRemote(
              dependentResource,
              routerStoreContext,
              {}
            )
          )
        );
      }
    },

  /**
   * Get a single resource, either from the cache if it exists and has not expired, or
   * the remote if it has expired.
   */
  getResource:
    (
      resource: RouteResource,
      routerStoreContext: RouterContext,
      options: GetResourceOptions
    ): ResourceAction<Promise<RouteResourceResponse>> =>
    async ({ getState, dispatch }) => {
      const { type, getKey, maxAge } = resource;
      const { context } = getState();
      const key = getKey(routerStoreContext, context);
      let cached = dispatch(getResourceState(type, key));

      if (cached && shouldUseCache(cached)) {
        if (isFromSsr(cached)) {
          const withResolvedPromise = setSsrDataPromise(cached);
          cached = setExpiresAt(withResolvedPromise, maxAge);
        }

        cached.accessedAt = getAccessedAt();
        dispatch(setResourceState(type, key, cached));

        return cached;
      }

      return dispatch(
        privateActions.getResourceFromRemote(
          resource,
          routerStoreContext,
          options
        )
      );
    },

  /**
   * Request a single resource and update the resource cache.
   */
  getResourceFromRemote:
    (
      resource: RouteResource,
      routerStoreContext: RouterContext,
      options: GetResourceOptions
    ): ResourceAction<Promise<RouteResourceResponse<unknown>>> =>
    async ({ getState, dispatch }) => {
      const { type, getKey, maxAge } = resource;
      const { context } = getState();
      const key = getKey(routerStoreContext, context);
      const prevSlice =
        dispatch(getResourceState(type, key)) || getDefaultStateSlice();

      // abort request if already in flight
      if (prevSlice.loading) {
        return prevSlice;
      }

      dispatch(validateLRUCache(resource, key));

      const loadingSlice =
        dispatch(getPrefetchSlice(type, key)) ||
        createLoadingSlice({
          context,
          dependencies: () =>
            dispatch(getDependencies(resource, routerStoreContext, options)),
          options,
          resource,
          routerStoreContext,
        });

      let resolvedSlice: EmptyObject | RouteResourceAsyncResult<unknown>;

      if (loadingSlice.data === prevSlice.data) {
        // same data (by reference) means nothing has changed and we can avoid loading state
        resolvedSlice = {};
      } else {
        // enter loading state
        dispatch(
          setResourceState(type, key, {
            ...prevSlice,
            ...loadingSlice,
            data: maxAge === 0 ? null : prevSlice.data,
            error: maxAge === 0 ? null : prevSlice.error,
            loading: true,
            accessedAt: getAccessedAt(),
          })
        );

        // trigger dependent resources to also load
        dispatch(
          executeForDependents(resource, dependentResource =>
            privateActions.getResourceFromRemote(
              dependentResource,
              routerStoreContext,
              options
            )
          )
        );

        // in case another action occurred while loading promise may not be the one we started with
        // we need to re-assign promise consistent with error/data that we are assigning here
        try {
          const data = loadingSlice.data ?? (await loadingSlice.promise);
          resolvedSlice = {
            data,
            error: null, // any existing error is cleared
            loading: false,
            promise: loadingSlice.promise,
          };
        } catch (error) {
          if (error instanceof TimeoutError) {
            resolvedSlice = {
              // data: do not replace existing data
              error,
              loading: true, // this condition cannot recover so must only be present in static/server router
              promise: null, // special case for timeout
            };
          } else {
            resolvedSlice = {
              // data: do not replace existing data
              // @ts-ignore
              error,
              loading: false,
              promise: loadingSlice.promise,
            };
          }
        }
      }

      // ensure most recent data when return occurs
      const recentSlice = dispatch(getResourceState(type, key));
      const finalSlice = {
        ...(recentSlice || prevSlice),
        ...resolvedSlice,
        accessedAt: getAccessedAt(),
        expiresAt: getExpiresAt(maxAge),
      };

      // protect against race conditions: if resources get cleared while await happens, we discard the result
      if (recentSlice || loadingSlice.data !== undefined) {
        dispatch(setResourceState(type, key, finalSlice));
      }

      return finalSlice;
    },

  /**
   * Prefetch a single resource and store in the prefetch cache.
   */
  prefetchResourceFromRemote:
    (
      resource: RouteResource,
      routerStoreContext: RouterContext,
      options: GetResourceOptions
    ): ResourceAction<Promise<void>> =>
    async ({ getState, dispatch }) => {
      const { type, getKey } = resource;
      const { context } = getState();
      const key = getKey(routerStoreContext, context);

      const loadingSlice =
        dispatch(getPrefetchSlice(type, key)) ||
        createLoadingSlice({
          context,
          dependencies: () =>
            dispatch(getDependencies(resource, routerStoreContext, options)),
          options,
          resource,
          routerStoreContext,
        });

      // save deferred value to be used also by dependants
      dispatch(setPrefetchSlice(type, key, loadingSlice));

      // trigger dependent resources to also prefetch
      dispatch(
        executeForDependents(resource, dependentResource =>
          privateActions.prefetchResourceFromRemote(
            dependentResource,
            routerStoreContext,
            options
          )
        )
      );
    },
};

export const actions = {
  /**
   * Clears a resource for the current key, or where context is not provided all keys.
   * Execute such that dependencies on current route will be cleared.
   */
  clearResource: (
    resource: RouteResource,
    routerStoreContext?: RouterContext
  ): ResourceAction<void> =>
    actionWithDependencies(
      routerStoreContext?.route.resources,
      resource,
      privateActions.clearResource(resource, routerStoreContext ?? null)
    ),

  /**
   * Update the data property for a resource in the cache and reset expiresAt based
   * on maxAge.
   * Execute such that dependencies on current route will be updated.
   */
  updateResourceState: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    getNewSliceData: RouteResourceUpdater
  ) =>
    actionWithDependencies<void>(
      routerStoreContext.route.resources,
      resource,
      privateActions.updateResourceState(
        resource,
        routerStoreContext,
        getNewSliceData
      )
    ),

  /**
   * Get a single resource, either from the cache if it exists and has not expired, or
   * the remote if it has expired.
   * Execute such that dependencies on current route will be updated.
   */
  getResource: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ) =>
    actionWithDependencies<Promise<RouteResourceResponse>>(
      routerStoreContext.route.resources,
      resource,
      privateActions.getResource(resource, routerStoreContext, options)
    ),

  /**
   * Request a single resource and update the resource cache.
   * Execute such that dependencies on current route will be updated.
   */
  getResourceFromRemote: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ) =>
    actionWithDependencies<Promise<RouteResourceResponse>>(
      routerStoreContext.route.resources,
      resource,
      privateActions.getResourceFromRemote(
        resource,
        routerStoreContext,
        options
      )
    ),

  /**
   * Request all resources.
   */
  requestAllResources:
    (
      routerStoreContext: RouterContext,
      options: GetResourceOptions = {}
    ): ResourceAction<Promise<RouteResourceResponse[]>> =>
    ({ dispatch }) => {
      const { route } = routerStoreContext || {};

      if (!route || !route.resources) {
        return Promise.all([]);
      }

      return Promise.all(
        dispatch(
          actions.requestResources(route.resources, routerStoreContext, options)
        )
      );
    },

  /**
   * Cleans expired resources and resets them back to their initial state.
   * We need to do this when transitioning into a route.
   */
  cleanExpiredResources:
    (
      resources: RouteResource[],
      routerStoreContext: RouterContext
    ): ResourceAction<void> =>
    ({ getState, dispatch }) => {
      const { context: resourceContext } = getState();

      resources.forEach(resource => {
        const { type, getKey } = resource;
        const key = getKey(routerStoreContext, resourceContext);
        const slice = dispatch(getResourceState(type, key));

        if (slice && (!slice.expiresAt || slice.expiresAt < Date.now())) {
          dispatch(deleteResourceState(type, key));
        }
      });
    },

  /**
   * Requests a specific set of resources.
   */
  requestResources: (
    resources: RouteResource[],
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ) => {
    const predicate = isServerEnvironment()
      ? ({ isBrowserOnly }: RouteResource) => !isBrowserOnly
      : () => true;

    return mapActionWithDependencies<Promise<RouteResourceResponse>>(
      routerStoreContext.route.resources?.filter(predicate),
      resources.filter(predicate),
      resource =>
        privateActions.getResource(resource, routerStoreContext, options)
    );
  },

  /**
   * Prefetch a specific set of resources.
   */
  prefetchResources: (
    resources: RouteResource[],
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ) =>
    mapActionWithDependencies<Promise<void>>(
      routerStoreContext.route.resources,
      resources,
      resource =>
        privateActions.prefetchResourceFromRemote(
          resource,
          routerStoreContext,
          { ...options, prefetch: true }
        )
    ),
  /**
   * Hydrates the store with state.
   * Will not override pre-hydrated state.
   */
  hydrate:
    ({
      resourceData,
      resourceContext,
    }: {
      resourceData?: ResourceStoreData;
      resourceContext?: ResourceStoreContext;
    }): ResourceAction<void> =>
    ({ getState, setState }) => {
      const { data, context } = getState();
      function getNextStateValue<R = any>(
        prev: ResourceStoreData | ResourceStoreContext,
        next: ResourceStoreData | ResourceStoreContext | typeof undefined
      ): R {
        if (!Object.keys(prev).length && next && Object.keys(next).length) {
          return next as R;
        }

        return prev as R;
      }
      const hydratedData = transformData(
        getNextStateValue<ResourceStoreData>(data, resourceData),
        ({ error, expiresAt, loading, ...rest }) => {
          const deserializedError = !error ? null : deserializeError(error);
          const isTimeoutError = deserializedError?.name === 'TimeoutError';

          return {
            ...rest,
            expiresAt: isTimeoutError ? Date.now() - 1 : expiresAt,
            loading: isTimeoutError ? false : loading,
            error: deserializedError,
          };
        }
      );

      setState({
        data: hydratedData,
        context: getNextStateValue<ResourceStoreContext>(
          context,
          resourceContext
        ),
      });
    },

  /**
   * Gets the store's context
   */
  getContext:
    (): ResourceAction<ResourceStoreContext> =>
    ({ getState }) =>
      getState().context,

  /**
   * Returns safe, portable and rehydratable data.
   */
  getSafeData:
    (): ResourceAction<ResourceStoreData> =>
    ({ getState }) =>
      transformData(getState().data, ({ data, key, error, loading }) => ({
        data,
        key,
        promise: null,
        expiresAt: null,
        accessedAt: null,
        error: !error
          ? null
          : serializeError(
              error instanceof Error ? error : new Error(JSON.stringify(error))
            ),
        loading: error instanceof TimeoutError ? loading : false,
      })),
};

export type Actions = typeof actions;

export const ResourceStore = createStore<State, Actions>({
  initialState: {
    data: {},
    context: {},
    executing: null,
    prefetching: null,
  },
  actions,
  name: 'router-resources',
});

export const ResourceContainer = createContainer<
  State,
  Actions,
  ContainerProps
>(ResourceStore, {
  displayName: 'ResourceContainer',
});

export const ResourceSubscriber = createSubscriber<
  State,
  Actions,
  RouteResourceResponse,
  { resourceType: string; resourceKey: string }
>(ResourceStore, {
  displayName: 'ResourceSelectorSubscriber',
  selector: (state, props) =>
    getSliceForResource(state, {
      type: props.resourceType,
      key: props.resourceKey,
    }),
});

export const getResourceStore = () =>
  // @ts-ignore not providing a scopeId param
  defaultRegistry.getStore<State, Actions>(ResourceStore);

export const useResourceStore = createHook<
  State,
  Actions,
  RouteResourceResponse,
  ResourceSliceIdentifier
>(ResourceStore, {
  selector: getSliceForResource,
});

export const useResourceStoreActions = createActionsHook<State, Actions>(
  ResourceStore
);

export const useResourceStoreContext = createHook<
  State,
  Actions,
  ResourceStoreContext
>(ResourceStore, {
  selector: getResourceStoreContext,
});
