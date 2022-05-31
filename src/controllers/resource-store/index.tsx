import {
  createContainer,
  createHook,
  createStore,
  createSubscriber,
  defaultRegistry,
} from 'react-sweet-state';

import {
  ResourceStoreContext,
  ResourceStoreData,
  RouterContext,
  RouteResource,
  EmptyObject,
  RouteResourceAsyncResult,
  RouteResourceResponse,
  RouteResourceUpdater,
  RouteResourceSyncResult,
} from '../../common/types';

import { getResourceStoreContext, getSliceForResource } from './selectors';
import {
  Actions,
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
  generateTimeGuard,
  TimeoutError,
  setSsrDataPromise,
  getResourceState,
  setResourceState,
  deleteResourceState,
  validateLRUCache,
  actionWithDependencies,
  mapActionWithDependencies,
  toPromise,
} from './utils';

const PREFETCH_MAX_AGE = 10000;

export const privateActions = {
  /**
   * Clears a resource for the current key, or where context is not provided all keys.
   */
  clearResource: (
    resource: RouteResource,
    routerStoreContext: RouterContext | null
  ): ResourceAction<void> => ({ getState, dispatch }) => {
    const { type, getKey } = resource;
    const { context } = getState();

    if (routerStoreContext) {
      const key = getKey(routerStoreContext, context);
      dispatch(deleteResourceState(type, key));
    } else {
      dispatch(deleteResourceState(type));
    }
  },

  /**
   * Update the data property for a resource in the cache and reset expiresAt based
   * on maxAge.
   */
  updateResourceState: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    getNewSliceData: RouteResourceUpdater
  ): ResourceAction<void> => ({ getState, dispatch }) => {
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
  },

  /**
   * Get a single resource, either from the cache if it exists and has not expired, or
   * the remote if it has expired.
   */
  getResource: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ): ResourceAction<Promise<RouteResourceResponse>> => async ({
    getState,
    dispatch,
  }) => {
    const { type, getKey, maxAge } = resource;
    const { context, ...resourceStoreState } = getState();
    const key = getKey(routerStoreContext, context);
    let cached = getSliceForResource(resourceStoreState, { type, key });

    if (shouldUseCache(cached)) {
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
  getResourceFromRemote: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ): ResourceAction<Promise<RouteResourceResponse<unknown>>> => async ({
    getState,
    dispatch,
  }) => {
    const { type, getKey, getData, maxAge } = resource;
    const { prefetch, timeout } = options;
    const { context, ...resourceStoreState } = getState();
    const key = getKey(routerStoreContext, context);
    const prevSlice = getSliceForResource(resourceStoreState, {
      type,
      key,
    });

    // abort request if already in flight
    if (prevSlice.loading) {
      return prevSlice;
    }

    dispatch(validateLRUCache(resource, key));

    const promiseOrData = getData(
      {
        ...routerStoreContext,
        isPrefetch: !!prefetch,
      },
      context
    );

    let resolvedSlice: EmptyObject | RouteResourceAsyncResult<unknown>;

    if (promiseOrData === prevSlice.data) {
      // same data (by reference) means nothing has changed and we can avoid loading state
      resolvedSlice = {};
    } else {
      // ensure the promise includes any timeout error
      const timeoutGuard = timeout ? generateTimeGuard(timeout) : null;
      const promise = timeout
        ? Promise.race([promiseOrData, timeoutGuard?.promise]).then(
            maybeData => {
              if (timeoutGuard && !timeoutGuard.isPending) {
                throw new TimeoutError(type);
              }
              timeoutGuard?.timerId && clearTimeout(timeoutGuard.timerId);

              return maybeData;
            }
          )
        : toPromise(promiseOrData);

      // enter loading state
      dispatch(
        setResourceState(type, key, {
          ...prevSlice,
          data: maxAge === 0 ? null : prevSlice.data,
          error: maxAge === 0 ? null : prevSlice.error,
          loading: true,
          promise,
          accessedAt: getAccessedAt(),
          // prevent resource from being cleaned prematurely and trigger more network requests.
          expiresAt: options.prefetch
            ? getExpiresAt(PREFETCH_MAX_AGE)
            : prevSlice.expiresAt,
        })
      );

      // in case another action occurred while loading promise may not be the one we started with
      // we need to re-assign promise consistent with error/data that we are assigning here
      try {
        const data = await promise;
        resolvedSlice = {
          data,
          error: null, // any existing error is cleared
          loading: false,
          promise,
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
            error,
            loading: false,
            promise,
          };
        }
      }
    }

    const finalSlice = {
      ...getSliceForResource(getState(), { type, key }), // ensure most recent data when error occurs
      ...resolvedSlice,
      accessedAt: getAccessedAt(),
      expiresAt: getExpiresAt(
        options.prefetch && maxAge < PREFETCH_MAX_AGE
          ? PREFETCH_MAX_AGE
          : maxAge
      ),
    };

    if (dispatch(getResourceState(type, key))) {
      dispatch(setResourceState(type, key, finalSlice));
    }

    return finalSlice;
  },
};

export const actions: Actions = {
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
    ...args
  ) =>
    actionWithDependencies<void>(
      routerStoreContext.route.resources,
      resource,
      privateActions.updateResourceState(resource, routerStoreContext, ...args)
    ),

  /**
   * Get a single resource, either from the cache if it exists and has not expired, or
   * the remote if it has expired.
   * Execute such that dependencies on current route will be updated.
   */
  getResource: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    ...args
  ) =>
    actionWithDependencies<Promise<RouteResourceResponse<unknown>>>(
      routerStoreContext.route.resources,
      resource,
      privateActions.getResource(resource, routerStoreContext, ...args)
    ),

  /**
   * Request a single resource and update the resource cache.
   * Execute such that dependencies on current route will be updated.
   */
  getResourceFromRemote: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    ...args
  ) =>
    actionWithDependencies<Promise<RouteResourceResponse<unknown>>>(
      routerStoreContext.route.resources,
      resource,
      privateActions.getResourceFromRemote(
        resource,
        routerStoreContext,
        ...args
      )
    ),

  /**
   * Request all resources.
   */
  requestAllResources: (routerStoreContext, options) => ({ dispatch }) => {
    const { route } = routerStoreContext || {};

    if (!route || !route.resources) {
      return Promise.all([]);
    }

    return Promise.all(
      dispatch(
        actions.requestResources(
          route.resources,
          routerStoreContext,
          options || {}
        )
      )
    );
  },

  /**
   * Cleans expired resources and resets them back to their initial state.
   * We need to do this when transitioning into a route.
   */
  cleanExpiredResources: (resources, routerStoreContext) => ({
    getState,
    dispatch,
  }) => {
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
  requestResources: (resources, routerStoreContext, options) => {
    const predicate = options.isStatic
      ? ({ isBrowserOnly }: RouteResource) => !isBrowserOnly
      : () => true;

    return mapActionWithDependencies<Promise<RouteResourceResponse<unknown>>>(
      routerStoreContext.route.resources?.filter(predicate),
      resources.filter(predicate),
      resource =>
        privateActions.getResource(resource, routerStoreContext, options)
    );
  },

  /**
   * Hydrates the store with state.
   * Will not override pre-hydrated state.
   */
  hydrate: ({ resourceData, resourceContext }) => ({ getState, setState }) => {
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
  getContext: () => ({ getState }) => getState().context,

  /**
   * Returns safe, portable and rehydratable data.
   */
  getSafeData: () => ({ getState }) =>
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

export const ResourceStore = createStore<State, Actions>({
  initialState: {
    data: {},
    context: {},
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

export const ResourceActions = createSubscriber<State, Actions, void>(
  ResourceStore,
  {
    selector: null,
  }
);

export const ResourceSubscriber = createSubscriber<
  State,
  Actions,
  RouteResourceResponse<unknown>,
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
  RouteResourceResponse<unknown>,
  ResourceSliceIdentifier
>(ResourceStore, {
  selector: getSliceForResource,
});

export const useResourceStoreContext = createHook<
  State,
  Actions,
  ResourceStoreContext
>(ResourceStore, {
  selector: getResourceStoreContext,
});

export const useResourceActions = createHook<State, Actions, void>(
  ResourceStore,
  {
    selector: null,
  }
);
