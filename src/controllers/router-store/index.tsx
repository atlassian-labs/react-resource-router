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
import { findRouterContext, isServerEnvironment } from '../../common/utils';
import { getResourceStore } from '../resource-store';
import { getResourcesForNextLocation } from '../resource-store/utils';

import {
  AllRouterActions,
  ContainerProps,
  UniversalRouterContainerProps,
  EntireRouterState,
} from './types';
import { getRelativePath, isExternalAbsolutePath } from './utils';

export const INITIAL_STATE: EntireRouterState = {
  history: DEFAULT_HISTORY,
  location: DEFAULT_HISTORY.location,
  query: {},
  routes: [],
  route: DEFAULT_ROUTE,
  match: DEFAULT_MATCH,
  action: DEFAULT_ACTION,
  unlisten: null,
  isStatic: false,
  shouldUseSuspense: false,
};

const actions: AllRouterActions = {
  /**
   * Bootstraps the store with initial data.
   *
   */
  bootstrapStore: props => ({ setState, dispatch }) => {
    const { resourceContext, resourceData, ...initialProps } = props;
    const { history, routes, isStatic } = initialProps;
    const routerContext = findRouterContext(routes, history.location);

    setState({
      ...initialProps,
      ...routerContext,
      location: history.location,
      action: history.action,
    });
    getResourceStore().actions.hydrate({ resourceContext, resourceData });

    if (!isStatic) {
      dispatch(actions.listen());
    }
  },

  /**
   * Duplicate method that uses isServerEnvironment instead of removed isStatic prop
   * internally. We can remove this when UniversalRouter replaces Router completely.
   */
  bootstrapStoreUniversal: props => ({ setState, dispatch }) => {
    const { resourceContext, resourceData, ...initialProps } = props;
    const { history, routes } = initialProps;
    const routerContext = findRouterContext(routes, history.location);

    setState({
      ...initialProps,
      ...routerContext,
      location: history.location,
      action: history.action,
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
  requestRouteResources: () => ({ getState }) => {
    const { route, match, query } = getState();

    return getResourceStore().actions.requestAllResources({
      route,
      match,
      query,
    });
  },

  /**
   * Starts listening to browser history and sets the unlisten function in state.
   * Will request route resources on route change.
   *
   */
  listen: () => ({ getState, setState }) => {
    const { history, routes } = getState();

    const stopListening = history.listen(async (location, action) => {
      const nextContext = findRouterContext(routes, location);
      const {
        match: currentMatch,
        route: currentRoute,
        query: currentQuery,
      } = getState();

      const {
        actions: {
          cleanExpiredResources,
          requestResources,
          getContext: getResourceStoreContext,
        },
      } = getResourceStore();
      const nextLocationContext = {
        route: nextContext.route,
        match: nextContext.match,
        query: nextContext.query,
      };
      const nextResources = getResourcesForNextLocation(
        {
          route: currentRoute,
          match: currentMatch,
          query: currentQuery,
        },
        nextLocationContext,
        getResourceStoreContext()
      );

      /* Explicitly batch update
       * as we need resources cleaned + route changed + resource fetch started together
       * If we do not batch, React might be re-render when route changes but resource
       * fetching has not started yet, making the app render with data null */

      batch(() => {
        cleanExpiredResources(nextResources, nextLocationContext);
        setState({
          ...nextContext,
          location,
          action,
        });
        requestResources(nextResources, nextLocationContext);
      });
    });

    setState({
      unlisten: stopListening,
    });
  },

  push: path => ({ getState }) => {
    const { history } = getState();

    if (isExternalAbsolutePath(path)) {
      window.location.assign(path as string);
    } else {
      history.push(getRelativePath(path) as any);
    }
  },

  replace: path => ({ getState }) => {
    const { history } = getState();

    if (isExternalAbsolutePath(path)) {
      window.location.replace(path as string);
    } else {
      history.replace(getRelativePath(path) as any);
    }
  },

  goBack: () => ({ getState }) => {
    const { history } = getState();

    history.goBack();
  },

  goForward: () => ({ getState }) => {
    const { history } = getState();

    history.goForward();
  },

  registerBlock: blocker => ({ getState }) => {
    const { history } = getState();

    return history.block(blocker);
  },

  getContext: () => ({ getState }) => {
    const { query, route, match } = getState();

    return { query, route, match };
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
    onInit: () => ({ dispatch }, props) => {
      dispatch(actions.bootstrapStore(props));
      !props.isStatic && dispatch(actions.requestRouteResources());
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
  onInit: () => ({ dispatch }, props) => {
    dispatch(actions.bootstrapStoreUniversal(props));
    !isServerEnvironment() && dispatch(actions.requestRouteResources());
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

export const RouterSubscriber = createSubscriber<State, Actions>(RouterStore, {
  displayName: 'BaseRouterSubscriber',
});

export const RouterActionsSubscriber = createSubscriber<
  State,
  Actions,
  void,
  {}
>(RouterStore, {
  displayName: 'RouterActionsSubscriber',
  selector: null,
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

export const useRouterStoreStatic = createHook<
  EntireRouterState,
  AllRouterActions,
  void
>(RouterStore, {
  selector: null,
});

export const getRouterStore = () =>
  // @ts-ignore calling `getStore` without providing a scopeId
  defaultRegistry.getStore<EntireRouterState, AllRouterActions>(RouterStore);

// @ts-ignore accessing private store property
export const getRouterState = () => getRouterStore().storeState.getState();
