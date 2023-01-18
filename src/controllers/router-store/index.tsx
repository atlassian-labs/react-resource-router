import { Action, parsePath, Location } from 'history';
import {
  createContainer,
  createHook,
  createStore,
  createSubscriber,
  defaultRegistry,
  batch,
} from 'react-sweet-state';

import {
  DEFAULT_ACTION,
  DEFAULT_HISTORY,
  DEFAULT_MATCH,
  DEFAULT_ROUTE,
} from '../../common/constants';
import { Query } from '../../common/types';
import {
  findRouterContext,
  isServerEnvironment,
  generatePath as generatePathUsingPathParams,
  generateLocationFromPath,
  warmupMatchRouteCache,
} from '../../common/utils';
import { getResourceStore } from '../resource-store';

import {
  AllRouterActions,
  ContainerProps,
  UniversalRouterContainerProps,
  EntireRouterState,
  RouterState,
} from './types';
import {
  getRelativePath,
  isExternalAbsolutePath,
  updateQueryParams,
  getRelativeURLFromLocation,
} from './utils';

export const INITIAL_STATE: EntireRouterState = {
  history: DEFAULT_HISTORY,
  location: DEFAULT_HISTORY.location,
  query: {},
  routes: [],
  route: DEFAULT_ROUTE,
  match: DEFAULT_MATCH,
  action: DEFAULT_ACTION,
  unlisten: null,
  basePath: '',
  isStatic: false,
  onPrefetch: undefined,
  loader: null,
};

const actions: AllRouterActions = {
  /**
   * Bootstraps the store with initial data.
   *
   */
  bootstrapStore:
    props =>
    ({ setState, dispatch }) => {
      const {
        resourceContext,
        resourceData,
        basePath = '',
        routes,
        initialRoute,
        loader,
        ...initialProps
      } = props;
      const { history, isStatic } = initialProps;
      const routerContext = findRouterContext(
        initialRoute ? [initialRoute] : routes,
        { location: history.location, basePath }
      );

      setState({
        ...initialProps,
        ...routerContext,
        basePath,
        routes,
        location: history.location,
        action: history.action,
        loader,
      });

      // getResourceStore().actions.hydrate({ resourceContext, resourceData });

      if (!isStatic) {
        dispatch(actions.listen());
      }
    },

  /**
   * Duplicate method that uses isServerEnvironment instead of removed isStatic prop
   * internally. We can remove this when UniversalRouter replaces Router completely.
   */
  bootstrapStoreUniversal:
    props =>
    ({ setState, dispatch }) => {
      const {
        resourceContext,
        resourceData,
        basePath = '',
        loader,
        ...initialProps
      } = props;
      const { history, routes } = initialProps;
      const routerContext = findRouterContext(routes, {
        location: history.location,
        basePath,
      });

      setState({
        ...initialProps,
        ...routerContext,
        basePath,
        location: history.location,
        action: history.action,
        loader,
      });
      getResourceStore().actions.hydrate({ resourceContext, resourceData });

      if (!isServerEnvironment()) {
        dispatch(actions.listen());
      }
    },

  /**
   * Uses the resource store to request resources for the route.
   * Must be dispatched after setting state with the new route context.
   *
   */
  // TODO: remove
  requestRouteResources:
    (options = {}) =>
    ({ getState }) => {
      const { route, match, query } = getState();

      return getResourceStore().actions.requestAllResources(
        // same as requestResources() from the page
        {
          route,
          match,
          query,
        },
        options
      );
    },

  // prefetchNextRouteResources:
  //   (path, nextContext) =>
  //   ({ getState }) => {
  //     const { routes, basePath, onPrefetch, route, match, query } = getState();
  //     const { prefetchResources, getContext: getResourceStoreContext } =
  //       getResourceStore().actions;

  //     if (!nextContext && !isExternalAbsolutePath(path)) {
  //       const location = parsePath(getRelativePath(path, basePath) as any);
  //       nextContext = findRouterContext(routes, { location, basePath });
  //     }

  //     if (nextContext == null) return;
  //     const nextLocationContext = nextContext;

  //     const nextResources = getResourcesForNextLocation(
  //       { route, match, query },
  //       nextLocationContext,
  //       getResourceStoreContext()
  //     );

  //     batch(() => {
  //       prefetchResources(nextResources, nextLocationContext, {});
  //       if (onPrefetch) onPrefetch(nextLocationContext);
  //     });
  //   },

  /**
   * Starts listening to browser history and sets the unlisten function in state.
   * Will request route resources on route change.
   *
   */
  listen:
    () =>
    ({ getState, setState, dispatch }) => {
      const { history } = getState();

      type LocationUpateV4 = [Location, Action];
      type LocationUpateV5 = [{ location: Location; action: Action }];

      const stopListening = history.listen(
        (...update: LocationUpateV4 | LocationUpateV5) => {
          const location = update.length === 2 ? update[0] : update[0].location;
          const action = update.length === 2 ? update[1] : update[0].action;

          const {
            routes,
            basePath,
            match: currentMatch,
            route: currentRoute,
            query: currentQuery,
          } = getState();

          // const {
          //   cleanExpiredResources,
          //   requestResources,
          //   getContext: getResourceStoreContext,
          // } = getResourceStore().actions;

          const nextContext = findRouterContext(routes, { location, basePath });
          // const nextLocationContext = {
          //   route: nextContext.route,
          //   match: nextContext.match,
          //   query: nextContext.query,
          // };
          // const nextResources = getResourcesForNextLocation(
          //   {
          //     route: currentRoute,
          //     match: currentMatch,
          //     query: currentQuery,
          //   },
          //   nextLocationContext,
          //   getResourceStoreContext()
          // );

          const prevLocationContext = {
            route: currentRoute,
            match: currentMatch,
            query: currentQuery,
          };

          /* Explicitly batch update
           * as we need resources cleaned + route changed + resource fetch started together
           * If we do not batch, React might be re-render when route changes but resource
           * fetching has not started yet, making the app render with data null */

          batch(() => {
            // cleanExpiredResources(nextResources, nextLocationContext);
            setState({
              ...nextContext,
              location,
              action,
            });
            // requestResources(nextResources, nextLocationContext, {});

            dispatch(actions.loadRoute(prevLocationContext));
          });
        }
      );

      setState({
        unlisten: stopListening,
      });
    },

  push:
    path =>
    ({ getState }) => {
      const { history, basePath } = getState();
      if (isExternalAbsolutePath(path)) {
        window.location.assign(path as string);
      } else {
        history.push(getRelativePath(path, basePath));
      }
    },

  pushTo:
    (route, attributes = {}) =>
    ({ getState }) => {
      const { history, basePath } = getState();
      const location = generateLocationFromPath(route.path, {
        ...attributes,
        basePath,
      });
      warmupMatchRouteCache(
        route,
        location.pathname,
        attributes.query,
        basePath
      );
      history.push(location as any);
    },

  replace:
    path =>
    ({ getState }) => {
      const { history, basePath } = getState();
      if (isExternalAbsolutePath(path)) {
        window.location.replace(path as string);
      } else {
        history.replace(getRelativePath(path, basePath) as any);
      }
    },

  replaceTo:
    (route, attributes = {}) =>
    ({ getState }) => {
      const { history, basePath } = getState();
      const location = generateLocationFromPath(route.path, {
        ...attributes,
        basePath,
      });
      warmupMatchRouteCache(
        route,
        location.pathname,
        attributes.query,
        basePath
      );
      history.replace(location as any);
    },

  goBack:
    () =>
    ({ getState }) => {
      const { history } = getState();

      // history@4 uses goBack(), history@5 uses back()
      if ('goBack' in history) {
        history.goBack();
      } else if ('back' in history) {
        history.back();
      } else {
        throw new Error('History does not support goBack');
      }
    },

  goForward:
    () =>
    ({ getState }) => {
      const { history } = getState();

      // history@4 uses goForward(), history@5 uses forward()
      if ('goForward' in history) {
        history.goForward();
      } else if ('forward' in history) {
        history.forward();
      } else {
        throw new Error('History does not support goForward');
      }
    },

  registerBlock:
    blocker =>
    ({ getState }) => {
      const { history } = getState();

      return history.block(blocker);
    },

  getContext:
    () =>
    ({ getState }) => {
      const { query, route, match } = getState();

      return { query, route, match };
    },

  getBasePath:
    () =>
    ({ getState }) => {
      const { basePath } = getState();

      return basePath;
    },

  updateQueryParam:
    (params, updateType = 'push') =>
    ({ getState }) => {
      const { query: existingQueryParams, history, location } = getState();
      const updatedQueryParams = { ...existingQueryParams, ...params };
      // remove undefined keys
      Object.keys(updatedQueryParams).forEach(
        key =>
          updatedQueryParams[key] === undefined &&
          delete updatedQueryParams[key]
      );
      const existingPath = updateQueryParams(location, existingQueryParams);
      const updatedPath = updateQueryParams(
        location,
        updatedQueryParams as Query
      );

      if (updatedPath !== existingPath) {
        history[updateType](updatedPath);
      }
    },

  updatePathParam:
    (params, updateType = 'push') =>
    ({ getState }) => {
      const {
        history,
        location,
        route: { path },
        match: { params: existingPathParams },
        basePath,
      } = getState();
      const pathWithBasePath = basePath + path;
      const updatedPathParams = { ...existingPathParams, ...params };
      const updatedPath = generatePathUsingPathParams(
        pathWithBasePath,
        updatedPathParams
      );
      const updatedLocation = { ...location, pathname: updatedPath };

      const existingRelativePath = getRelativeURLFromLocation(location);
      const updatedRelativePath = getRelativeURLFromLocation(updatedLocation);

      if (updatedRelativePath !== existingRelativePath) {
        history[updateType](updatedRelativePath);
      }
    },
  loadRoute:
    prevLocationContext =>
    ({ getState }) => {
      const { loader, match, query, route } = getState();

      return loader?.load({ match, query, route, prevLocationContext });
    },
  prefetchRoute:
    (path, nextContext) =>
    ({ getState }) => {
      const { loader, routes, basePath, onPrefetch } = getState();

      if (!nextContext && !isExternalAbsolutePath(path)) {
        const location = parsePath(getRelativePath(path, basePath) as any);
        nextContext = findRouterContext(routes, { location, basePath });
      }

      if (nextContext == null) return;
      const nextLocationContext = nextContext;

      batch(() => {
        loader?.prefetch(nextLocationContext);
        // prefetchResources(nextResources, nextLocationContext, {});
        if (onPrefetch) onPrefetch(nextLocationContext);
      });
    },
  // ...
};

type State = EntireRouterState;

type Actions = AllRouterActions;

export const RouterStore = createStore<State, Actions>({
  initialState: INITIAL_STATE,
  actions,
  name: 'router',
});

export const RouterContainer = createContainer<State, Actions, ContainerProps>(
  RouterStore,
  {
    displayName: 'RouterContainer',
    onInit:
      () =>
      ({ dispatch }, props) => {
        dispatch(actions.bootstrapStore(props));
        // !props.isStatic && dispatch(actions.requestRouteResources());
        !props.isStatic && dispatch(actions.loadRoute());
      },
    onCleanup: () => () => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(
          `Warning: react-resource-router has been unmounted! Was this intentional? Resources will be refetched when the router is mounted again.`
        );
      }
    },
  }
);

export const UniversalRouterContainer = createContainer<
  State,
  Actions,
  UniversalRouterContainerProps
>(RouterStore, {
  displayName: 'UniversalRouterContainer',
  onInit:
    () =>
    ({ dispatch }, props) => {
      dispatch(actions.bootstrapStoreUniversal(props));
      // !isServerEnvironment() && dispatch(actions.requestRouteResources());
      !isServerEnvironment() && dispatch(actions.loadRoute());
    },
  onCleanup: () => () => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        `Warning: react-resource-router has been unmounted! Was this intentional? Resources will be refetched when the router is mounted again.`
      );
    }
  },
});

export const RouteResourceEnabledSubscriber = createSubscriber<
  State,
  Actions,
  boolean
>(RouterStore, {
  selector: state => Boolean(state.route && state.route.resources),
});

export const useRouterStore = createHook<EntireRouterState, AllRouterActions>(
  RouterStore
);

export const useRouterStoreActions = createHook<
  EntireRouterState,
  AllRouterActions,
  void
>(RouterStore, {
  selector: null,
});

/**
 * Utility to create custom hooks without re-rendering on route change
 */
export function createRouterSelector<T, U = void>(
  selector: (state: RouterState, props: U) => T
) {
  const useHook = createHook<EntireRouterState, AllRouterActions, T, U>(
    RouterStore,
    { selector }
  );

  return function useRouterSelector(
    ...args: U extends undefined ? [] : [U]
  ): T {
    return useHook(...args)[0];
  };
}

export const getRouterStore = () =>
  // @ts-ignore calling `getStore` without providing a scopeId
  defaultRegistry.getStore<EntireRouterState, AllRouterActions>(RouterStore);

// @ts-ignore accessing private store property
export const getRouterState = () => getRouterStore().storeState.getState();
