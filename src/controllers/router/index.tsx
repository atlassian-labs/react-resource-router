import { createMemoryHistory } from 'history';
import React, { useMemo, useEffect } from 'react';

import { combine } from '../../common/utils/combine';
import { createResourcesPlugin } from '../../resources/plugin';
import { getResourceStore, ResourceContainer } from '../resource-store';
import {
  getRouterState,
  RouterContainer,
  getRouterStore,
} from '../router-store';

import {
  RouterProps,
  MemoryRouterProps,
  RequestResourcesParams,
  LoadRouteParams,
} from './types';

export const Router = ({
  basePath,
  children,
  history,
  initialRoute,
  isGlobal = true,
  plugins,
  onPrefetch,
  resourceContext,
  resourceData,
  routes,
}: RouterProps) => {
  useEffect(() => {
    const { unlisten } = getRouterState();

    return () => {
      unlisten && unlisten();
    };
  }, []);

  const defaultPlugins = useMemo(() => {
    if (plugins) return combine(plugins);

    // default 'plugins' fallback for the first relase
    const resourcesPlugin = createResourcesPlugin({
      context: resourceContext,
      resourceData,
    });

    return combine([resourcesPlugin]);
  }, [resourceContext, resourceData, plugins]);

  return (
    <ResourceContainer isGlobal>
      <RouterContainer
        basePath={basePath}
        history={history}
        initialRoute={initialRoute}
        isGlobal={isGlobal}
        onPrefetch={onPrefetch}
        plugins={defaultPlugins}
        resourceContext={resourceContext}
        resourceData={resourceData}
        routes={routes}
      >
        {children}
      </RouterContainer>
    </ResourceContainer>
  );
};

/**
 * @deprecated
 * The entry point for requesting resource data on the server.
 * Pass the result data into the router as a prop in order to hydrate it.
 */
Router.requestResources = async ({
  location,
  history,
  timeout,
  plugins,
  ...bootstrapProps
}: RequestResourcesParams) => {
  const { bootstrapStore, loadRoute } = getRouterStore().actions;

  const defaultPluginsFallback = (() => {
    if (plugins) {
      return combine(plugins);
    }

    // default 'plugins' fallback for the first relase
    const resourcesPlugin = createResourcesPlugin({
      context: bootstrapProps.resourceContext,
      resourceData: null,
      timeout,
    });

    return combine([resourcesPlugin]);
  })();

  bootstrapStore({
    ...bootstrapProps,
    history: history || createMemoryHistory({ initialEntries: [location] }),
    plugins: defaultPluginsFallback,
  });

  await loadRoute().resources;

  return getResourceStore().actions.getSafeData();
};

Router.loadRoute = ({ history, plugins, routes }: LoadRouteParams) => {
  const { bootstrapStore, loadRoute } = getRouterStore().actions;

  bootstrapStore({
    routes,
    history: history,
    plugins: combine(plugins),
  });

  return loadRoute();
};

Router.addResourcesListener = (fn: (...args: any) => any) =>
  getResourceStore().storeState.subscribe(fn);

export function MemoryRouter(props: MemoryRouterProps) {
  const history = useMemo(
    () =>
      createMemoryHistory(
        props.location ? { initialEntries: [props.location] } : {}
      ),
    [props.location]
  );

  return <Router {...props} history={history} isGlobal={false} />;
}
