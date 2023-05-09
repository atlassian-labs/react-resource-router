import { Action, parsePath, Location } from 'history';
import {
  createActionsHook,
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
  isSameRoute,
} from '../../common/utils';
import { shouldRoutePluginsLoad, setRoutePluginsReloadFlag } from '../plugins';

import {
  AllRouterActions,
  ContainerProps,
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
  action: DEFAULT_ACTION,
  basePath: '',
  location: DEFAULT_HISTORY.location,
  history: DEFAULT_HISTORY,
  match: DEFAULT_MATCH,
  onPrefetch: undefined,
  query: {},
  route: DEFAULT_ROUTE,
  routes: [],
  unlisten: null,
  plugins: [],
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
        basePath = '',
        history,
        initialRoute,
        onPrefetch,
        routes,
        plugins,
      } = props;
      const routerContext = findRouterContext(
        initialRoute ? [initialRoute] : routes,
        { location: history.location, basePath }
      );

      setState({
        ...routerContext,
        basePath,
        history,
        onPrefetch,
        routes,
        location: history.location,
        action: history.action,
        plugins,
      });

      if (!isServerEnvironment()) {
        dispatch(actions.listen());
      }
    },

  /**
   * Starts listening to browser history and sets the unlisten function in state.
   * Will request route resources on route change.
   *
   */
  listen:
    () =>
    ({ getState, setState }) => {
      const { history, unlisten } = getState();
      if (unlisten) unlisten();

      type LocationUpateV4 = [Location, Action];
      type LocationUpateV5 = [{ location: Location; action: Action }];

      const stopListening = history.listen(
        (...update: LocationUpateV4 | LocationUpateV5) => {
          const location = update.length === 2 ? update[0] : update[0].location;
          const action = update.length === 2 ? update[1] : update[0].action;

          const {
            plugins,
            routes,
            basePath,
            match: currentMatch,
            route: currentRoute,
            query: currentQuery,
          } = getState();

          const nextContext = findRouterContext(routes, {
            location,
            basePath,
          });

          const prevContext = {
            route: currentRoute,
            match: currentMatch,
            query: currentQuery,
          };

          const sameRoute = isSameRoute({
            prevContextMatch: prevContext.match,
            nextContextMatch: nextContext.match,
          });

          /* Explicitly batch update
           * as we need resources cleaned + route changed + resource fetch started together
           * If we do not batch, React might be re-render when route changes but resource
           * fetching has not started yet, making the app render with data null */

          batch(() => {
            plugins.forEach(p => {
              if (
                (p.id === 'resources-plugin' || !sameRoute) &&
                shouldRoutePluginsLoad()
              ) {
                p.beforeRouteLoad?.({
                  context: prevContext,
                  nextContext,
                });
              }
            });

            setState({
              ...nextContext,
              location,
              action,
            });

            plugins.forEach(p => {
              // keep old behaviour for Resources plugin
              // load Route only if path/query/params changed, and ignore the rest of query-params
              if (
                (p.id === 'resources-plugin' || !sameRoute) &&
                shouldRoutePluginsLoad()
              ) {
                p.routeLoad?.({ context: nextContext, prevContext });
              }
            });

            if (shouldRoutePluginsLoad() === false) {
              setRoutePluginsReloadFlag(true);
            }
          });
        }
      );

      setState({
        unlisten: stopListening,
      });
    },

  push:
    (path, options) =>
    ({ getState }) => {
      const { history, basePath } = getState();
      if (isExternalAbsolutePath(path)) {
        window.location.assign(path as string);
      } else {
        if (options?.avoidRoutePluginsLoad === true)
          setRoutePluginsReloadFlag(false);

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
    (
      params,
      updateType = 'push',
      options?: { avoidRoutePluginsLoad?: boolean }
    ) =>
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
        if (options?.avoidRoutePluginsLoad === true)
          setRoutePluginsReloadFlag(false);

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
  loadPlugins:
    () =>
    ({ getState }) => {
      const { plugins, match, query, route } = getState();

      plugins.forEach(p => p.routeLoad?.({ context: { match, query, route } }));
    },
  prefetchRoute:
    (path, nextContext) =>
    ({ getState }) => {
      const { plugins, routes, basePath, onPrefetch } = getState();
      const { route, match, query } = getRouterState();

      if (!nextContext && !isExternalAbsolutePath(path)) {
        const location = parsePath(getRelativePath(path, basePath) as any);
        nextContext = findRouterContext(routes, { location, basePath });
      }

      if (nextContext == null) return;
      const nextLocationContext = nextContext;

      batch(() => {
        plugins.forEach(p =>
          p.routePrefetch?.({
            context: { route, match, query },
            nextContext: nextLocationContext,
          })
        );
        if (onPrefetch) onPrefetch(nextLocationContext);
      });
    },
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
        !isServerEnvironment() && dispatch(actions.loadPlugins());
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

export const useRouterStoreActions = createActionsHook<
  EntireRouterState,
  AllRouterActions
>(RouterStore);

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
