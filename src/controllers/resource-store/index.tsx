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
  RouteResourceResponse,
  RouteResourceUpdater,
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

    dispatch(
      setResourceState(type, key, {
        ...prevSlice,
        data: getNewSliceData(prevSlice.data),
        expiresAt: getExpiresAt(maxAge),
        accessedAt: getAccessedAt(),
      })
    );
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

    const pendingSlice = {
      ...prevSlice,
      data: maxAge === 0 ? null : prevSlice.data,
      error: maxAge === 0 ? null : prevSlice.error,
      loading: true,
      promise: getData(
        { ...routerStoreContext, isPrefetch: !!prefetch },
        context
      ),
      accessedAt: getAccessedAt(),
      // prevent resource from being cleaned prematurely and traigger more network requests.
      ...(options.prefetch
        ? {
            expiresAt: getExpiresAt(PREFETCH_MAX_AGE),
          }
        : {}),
    };

    dispatch(setResourceState(type, key, pendingSlice));

    const response = {
      ...pendingSlice,
    };

    try {
      response.error = null;

      if (timeout) {
        const timeoutGuard = generateTimeGuard(timeout);
        const maybeData = await Promise.race([
          pendingSlice.promise,
          timeoutGuard.promise,
        ]);

        if (!timeoutGuard.isPending) {
          response.data = null;
          response.error = new TimeoutError(type);
          response.loading = true;
          response.promise = null;
        } else {
          timeoutGuard.timerId && clearTimeout(timeoutGuard.timerId);
          response.data = maybeData;
          response.loading = false;
        }
      } else {
        response.data = await pendingSlice.promise;
        response.loading = false;
      }
    } catch (e) {
      response.error = e;
      response.loading = false;
    }

    response.expiresAt = getExpiresAt(
      options.prefetch && maxAge < PREFETCH_MAX_AGE ? PREFETCH_MAX_AGE : maxAge
    );

    response.accessedAt = getAccessedAt();

    if (dispatch(getResourceState(type, key))) {
      dispatch(setResourceState(type, key, response));
    }

    return response;
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
