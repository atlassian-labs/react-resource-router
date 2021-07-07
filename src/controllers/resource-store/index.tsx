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
  RouteResourceResponse,
} from '../../common/types';

import { getResourceStoreContext, getSliceForResource } from './selectors';
import {
  Actions,
  ContainerProps,
  ResourceSliceIdentifier,
  State,
} from './types';
import {
  deserializeError,
  getExpiresAt,
  isFromSsr,
  serializeError,
  setExpiresAt,
  shouldUseCache,
  transformData,
  generateTimeGuard,
  TimeoutError,
  setSsrDataPromise,
} from './utils';

const PREFETCH_MAX_AGE = 10000;

export const actions: Actions = {
  /**
   * Set the state of a resource in the cache.
   *
   */
  setResourceState: (type, key, state) => ({ setState, getState }) => {
    const { data } = getState();

    setState({
      data: {
        ...data,
        [type]: {
          ...(data[type] || {}),
          [key]: state,
        },
      },
    });
  },
  /**
   * Update the data property for a resource in the cache.
   *
   * Also resets the expiresAt based on maxAge
   */
  updateResourceState: (type, key, maxAge, getNewSliceData) => ({
    getState,
    dispatch,
  }) => {
    const { data } = getState();

    const slice = getSliceForResource({ data }, { type, key });

    dispatch(
      actions.setResourceState(type, key, {
        ...slice,
        data: getNewSliceData(slice.data),
        expiresAt: getExpiresAt(maxAge),
      })
    );
  },
  /**
   * Get a single resource, either from the cache if it exists and has not expired, or
   * the remote if it has expired.
   */
  getResource: (resource, routerStoreContext, options) => async ({
    getState,
    dispatch,
  }) => {
    const { type, getKey, maxAge } = resource;
    const { getResourceFromRemote, setResourceState } = actions;
    const { data: resourceStoreData, context } = getState();
    const key = getKey(routerStoreContext, context);
    const cached = getSliceForResource(
      { data: resourceStoreData },
      { type, key }
    );

    if (shouldUseCache(cached)) {
      if (isFromSsr(cached)) {
        const withResolvedPromise = setSsrDataPromise(cached);
        const withExpiresAt = setExpiresAt(withResolvedPromise, maxAge);

        dispatch(setResourceState(type, key, withExpiresAt));

        return withExpiresAt;
      }

      return cached;
    }

    return dispatch(
      getResourceFromRemote(resource, routerStoreContext, options)
    );
  },
  /**
   * Request a single resource and update the resource cache.
   */
  getResourceFromRemote: (resource, routerStoreContext, options) => async ({
    getState,
    dispatch,
  }): Promise<RouteResourceResponse<unknown>> => {
    const { type, getKey, getData, maxAge } = resource;
    const { prefetch, timeout } = options;
    const { setResourceState } = actions;
    const { data: resourceStoreData, context } = getState();
    const key = getKey(routerStoreContext, context);
    const slice = getSliceForResource(
      { data: resourceStoreData },
      { type, key }
    );

    if (slice.loading) {
      return slice;
    }

    const pending = {
      ...slice,
      data: maxAge === 0 ? null : slice.data,
      error: maxAge === 0 ? null : slice.error,
      loading: true,
      promise: getData(
        { ...routerStoreContext, isPrefetch: !!prefetch },
        context
      ),
    };

    dispatch(setResourceState(type, key, pending));

    const response = {
      ...pending,
    };

    try {
      response.error = null;

      if (timeout) {
        const timeoutGuard = generateTimeGuard(timeout);
        const maybeData = await Promise.race([
          pending.promise,
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
        response.data = await pending.promise;
        response.loading = false;
      }
    } catch (e) {
      response.error = e;
      response.loading = false;
    }

    response.expiresAt = getExpiresAt(
      options.prefetch && maxAge < PREFETCH_MAX_AGE ? PREFETCH_MAX_AGE : maxAge
    );

    dispatch(setResourceState(type, key, response));

    return response;
  },
  /**
   * Request all resources.
   *
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
    const { data, context: resourceContext } = getState();

    resources.forEach(resource => {
      const { type, getKey } = resource;
      const key = getKey(routerStoreContext, resourceContext);
      const slice = getSliceForResource({ data }, { type, key });

      if (!slice.expiresAt || slice.expiresAt < Date.now()) {
        dispatch(
          actions.setResourceState(type, key, {
            ...slice,
            data: null,
            error: null,
            expiresAt: getExpiresAt(0),
          })
        );
      }
    });
  },

  /**
   * Requests a specific set of resources.
   */
  requestResources: (resources, routerStoreContext, options) => ({
    dispatch,
  }) =>
    resources.map(resource =>
      dispatch(actions.getResource(resource, routerStoreContext, options))
    ),

  /**
   * Hydrates the store with state.
   * Will not override pre-hydrated state.
   *
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
   *
   */
  getContext: () => ({ getState }) => getState().context,

  /**
   * Returns safe, portable and rehydratable data.
   *
   */
  getSafeData: () => ({ getState }) =>
    transformData(getState().data, ({ data, key, error, loading }) => ({
      data,
      key,
      promise: null,
      expiresAt: null,
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
